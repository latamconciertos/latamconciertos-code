// Dispatcher de ingesta: crea la corrida por fuente activa y hace fan-out al worker
// ingest-source. Lo invoca pg_cron (2x/semana) o el admin ("ejecutar todas").

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { requireAdmin } from '../_shared/requireAdmin.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const triggerSecret = Deno.env.get('INGEST_TRIGGER_SECRET') || '';

  let body: { sourceId?: string; trigger?: string; authToken?: string } = {};
  try {
    body = await req.json();
  } catch { /* cuerpo vacío permitido: corre todas las fuentes activas */ }

  // El service token (INGEST_TRIGGER_SECRET) viaja en el BODY: el gateway nuevo valida/filtra los
  // headers, pero no toca el body. El routing se resuelve con un JWT anon en `apikey`.
  const isService = Boolean(triggerSecret) && body?.authToken === triggerSecret;
  if (!isService) {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;
    const limited = await enforceRateLimit(req, {
      functionName: 'ingest-runner',
      maxRequests: 3,
      windowSeconds: 60,
      byUser: true,
    });
    if (limited) return limited;
  }

  const triggeredBy = isService && body.trigger === 'cron' ? 'cron' : 'manual';
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let query = supabase.from('ingestion_sources').select('id, slug, name').eq('is_active', true);
  if (body.sourceId) query = query.eq('id', body.sourceId);
  const { data: sources, error: sourcesError } = await query;
  if (sourcesError) {
    return json(500, { success: false, error: sourcesError.message });
  }
  if (!sources?.length) {
    return json(200, { success: true, data: { message: 'Sin fuentes activas', results: [] } });
  }

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const { data: run, error: runError } = await supabase
        .from('ingestion_runs')
        .insert({ source_id: source.id, triggered_by: triggeredBy })
        .select('id')
        .single();
      if (runError || !run) throw new Error(`run insert failed for ${source.slug}`);

      // apikey = JWT anon (el gateway enruta con eso); authToken en el body = INGEST_TRIGGER_SECRET.
      const response = await fetch(`${supabaseUrl}/functions/v1/ingest-source`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId: source.id, runId: run.id, authToken: triggerSecret }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        await supabase
          .from('ingestion_runs')
          .update({
            status: 'error',
            finished_at: new Date().toISOString(),
            error: payload?.error || `worker HTTP ${response.status}`,
          })
          .eq('id', run.id);
      }
      return { source: source.slug, runId: run.id, ...(payload?.data ?? {}) };
    }),
  );

  const outcomes = results.map((result, i) =>
    result.status === 'fulfilled'
      ? result.value
      : { source: sources[i].slug, error: String(result.reason) }
  );

  return json(200, { success: true, data: { triggeredBy, results: outcomes } });
});
