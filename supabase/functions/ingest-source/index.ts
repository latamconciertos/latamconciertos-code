// Worker genérico de ingesta: procesa UNA fuente (descubre → fetch → extrae → matchea → stagea).
// Toda la variación por fuente vive en ingestion_sources.config; agregar ticketera = INSERT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { requireAdmin } from '../_shared/requireAdmin.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { isAllowedUrl } from '../_shared/antiSsrf.ts';
import { discoverEventUrls, eventKeyFromUrl } from '../_shared/ingest/discover.ts';
import { fetchPage } from '../_shared/ingest/fetchPage.ts';
import { extractEvent } from '../_shared/ingest/extractEvent.ts';
import { extractEventsFromJsonLd } from '../_shared/ingest/jsonldList.ts';
import type { CanonicalEvent } from '../_shared/ingest/types.ts';
import { matchEntity } from '../_shared/ingest/matching.ts';
import { computeFingerprint } from '../_shared/ingest/fingerprint.ts';
import { emptyCounters } from '../_shared/ingest/types.ts';
import type { SourceRow } from '../_shared/ingest/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Topes obligatorios en código (no solo en config): el runner espera a los workers en paralelo.
const WALL_CLOCK_BUDGET_MS = 100_000;
const HARD_MAX_NEW_PAGES = 40;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Compara lastmod del sitemap contra la última corrida como fechas reales
// (vienen en zonas horarias distintas). Ante fechas no parseables, re-visita.
function lastmodIsNewer(lastmod: string | undefined, sinceIso: string | null): boolean {
  if (!lastmod) return false;
  if (!sinceIso) return true;
  const lastmodMs = Date.parse(lastmod);
  const sinceMs = Date.parse(sinceIso);
  if (Number.isNaN(lastmodMs) || Number.isNaN(sinceMs)) return true;
  return lastmodMs > sinceMs;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const triggerSecret = Deno.env.get('INGEST_TRIGGER_SECRET') || '';

  let body: { sourceId?: string; runId?: string; triggeredBy?: string; authToken?: string; singleUrl?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { success: false, error: 'JSON body required' });
  }

  // Auth dual: el runner/cron llama con INGEST_TRIGGER_SECRET; el botón manual llega con JWT de admin.
  // El secreto viaja en el BODY: el gateway nuevo valida/filtra los headers (rechaza claves sb_ y
  // elimina headers custom), pero no toca el body. El routing se resuelve con un JWT anon en `apikey`.
  const isService = Boolean(triggerSecret) && body?.authToken === triggerSecret;
  if (!isService) {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;
    const limited = await enforceRateLimit(req, {
      functionName: 'ingest-source',
      maxRequests: 6,
      windowSeconds: 60,
      byUser: true,
    });
    if (limited) return limited;
  }

  if (!body.sourceId) {
    return json(400, { success: false, error: 'sourceId is required' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: source, error: sourceError } = await supabase
    .from('ingestion_sources')
    .select('*')
    .eq('id', body.sourceId)
    .maybeSingle();
  if (sourceError || !source) {
    return json(404, { success: false, error: 'Fuente no encontrada' });
  }
  const src = source as SourceRow;

  let runId = body.runId ?? null;
  if (!runId) {
    const { data: run, error: runError } = await supabase
      .from('ingestion_runs')
      .insert({
        source_id: src.id,
        triggered_by: body.triggeredBy === 'cron' ? 'cron' : 'manual',
      })
      .select('id')
      .single();
    if (runError || !run) {
      return json(500, { success: false, error: 'No se pudo crear el registro de corrida' });
    }
    runId = run.id;
  }

  const counters = emptyCounters();
  let runStatus: 'success' | 'partial' | 'error' = 'success';
  let runError: string | null = null;
  const startedMs = Date.now();

  try {
    const { data: lastOk } = await supabase
      .from('ingestion_runs')
      .select('started_at')
      .eq('source_id', src.id)
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sinceIso = lastOk?.started_at ?? null;

    // Modo URL puntual: ingesta una sola página sin correr el descubrimiento
    // completo. Se valida contra el dominio de la fuente (anti-SSRF): acepta
    // subdominios como web.tuboleta.com o prod.tuboleta.com.
    const singleUrl = body.singleUrl?.trim() || null;
    if (singleUrl && !isAllowedUrl(singleUrl, new URL(src.base_url).hostname)) {
      throw new Error('La URL no pertenece al dominio de esta fuente');
    }

    // Modo lista: los eventos salen del JSON-LD de las páginas de categoría, no de las fichas.
    // Se precomputan aquí y el bucle de abajo los usa sin volver a pedir la página ni llamar al LLM.
    const preExtracted = new Map<string, CanonicalEvent>();
    const listed: { url: string; categoryHint?: string }[] = [];
    if (!singleUrl && src.config.extract?.list_from_jsonld) {
      for (const categoryUrl of src.config.discovery.category_urls || []) {
        try {
          const page = await fetchPage(categoryUrl, src.fetch_method, {
            userAgent: src.config.fetch?.user_agent,
            waitForMs: src.config.fetch?.wait_for_ms,
          });
          counters.pages_fetched++;
          const hint = src.config.category_map?.[categoryUrl.split('/').pop() || ''];
          for (const item of extractEventsFromJsonLd({ source: src, html: page.html, categoryHint: hint })) {
            if (preExtracted.has(item.url)) continue;
            preExtracted.set(item.url, item.event);
            listed.push({ url: item.url, categoryHint: hint });
          }
        } catch (error) {
          console.error(`[ingest] category ${categoryUrl} failed:`, error instanceof Error ? error.message : error);
        }
      }
    }

    const discovered = singleUrl
      ? [{ url: singleUrl }]
      : (preExtracted.size ? listed : await discoverEventUrls(src));
    counters.pages_discovered = discovered.length;

    const { data: existingRows } = await supabase
      .from('staged_events')
      .select('id, source_event_key, fingerprint, status')
      .eq('source_id', src.id);
    const existing = new Map(
      (existingRows || []).map((r) => [r.source_event_key as string, r]),
    );

    let toFetch = discovered;
    if (!singleUrl) {
      // El tope duro protege contra corridas que descargan una ficha por evento. En modo lista
      // el costo ya está acotado por el número de páginas de categoría (los eventos salen del
      // mismo HTML, sin fetch ni LLM por evento), así que ahí manda solo la config.
      const maxNew = src.config.extract?.list_from_jsonld
        ? (src.config.discovery.max_new_pages_per_run ?? 100)
        : Math.min(src.config.discovery.max_new_pages_per_run ?? 25, HARD_MAX_NEW_PAGES);
      // Prioridad explícita: lo descubierto vía páginas de categoría (conciertos/
      // festivales curados por la fuente) se procesa antes que lo que solo aparece
      // en el sitemap, que en ticketeras generalistas trae teatro, deportes y hasta
      // álbumes de fútbol. El sort es estable: dentro de cada grupo se conserva el
      // orden de la página, y el backfill avanza de forma determinista corrida a corrida.
      const newItems = discovered
        .filter((d) => !existing.has(eventKeyFromUrl(d.url)))
        .sort((a, b) => Number(Boolean(b.categoryHint)) - Number(Boolean(a.categoryHint)))
        .slice(0, maxNew);
      // Re-visita solo pendientes cuyo lastmod sea posterior a la última corrida
      // exitosa (comparación de fechas reales: los lastmod vienen con offset -05:00
      // y sinceIso en UTC; compararlos como strings da resultados incorrectos).
      const pendingRefresh = discovered.filter((d) => {
        const row = existing.get(eventKeyFromUrl(d.url));
        return row && row.status === 'pending' && lastmodIsNewer(d.lastmod, sinceIso);
      });
      toFetch = [...newItems, ...pendingRefresh];

      // Todo lo ya visto que no se re-visita: solo se marca como visto en esta corrida.
      const refreshKeys = new Set(pendingRefresh.map((d) => eventKeyFromUrl(d.url)));
      const seenKeys = discovered
        .map((d) => eventKeyFromUrl(d.url))
        .filter((key) => existing.has(key) && !refreshKeys.has(key));
      if (seenKeys.length) {
        await supabase
          .from('staged_events')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('source_id', src.id)
          .in('source_event_key', seenKeys);
        counters.events_skipped += seenKeys.length;
      }
    }

    // Catálogos en memoria: una carga por corrida.
    const [artistsRes, venuesRes, promotersRes, pulepRes, upcomingRes, festivalsRes] =
      await Promise.all([
        supabase.from('artists').select('id, name'),
        supabase.from('venues').select('id, name'),
        supabase.from('promoters').select('id, name'),
        supabase.from('concerts').select('id, pulep_code').not('pulep_code', 'is', null),
        supabase.from('concerts').select('id, artist_id, date')
          .gte('date', new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)),
        supabase.from('festivals').select('id, name, start_date, pulep_code'),
      ]);
    const artists = artistsRes.data || [];
    const venues = venuesRes.data || [];
    const promoters = promotersRes.data || [];
    const concertsByPulep = new Map(
      (pulepRes.data || []).map((c) => [c.pulep_code as string, c.id as string]),
    );
    const upcomingConcerts = upcomingRes.data || [];
    const festivals = festivalsRes.data || [];
    const festivalsByPulep = new Map(
      festivals.filter((f) => f.pulep_code).map((f) => [f.pulep_code as string, f.id as string]),
    );

    const defaults = src.config.defaults || {};

    for (const item of toFetch) {
      if (Date.now() - startedMs > WALL_CLOCK_BUDGET_MS) {
        runStatus = 'partial';
        break;
      }
      const key = eventKeyFromUrl(item.url);
      try {
        // En modo lista el evento ya se extrajo del JSON-LD de la categoría: no se vuelve a
        // pedir la página (la ficha responde 401) ni se gasta una llamada al LLM.
        let event = preExtracted.get(item.url);
        if (!event) {
          const page = await fetchPage(item.url, src.fetch_method, {
            userAgent: src.config.fetch?.user_agent,
            waitForMs: src.config.fetch?.wait_for_ms,
          });
          counters.pages_fetched++;

          event = await extractEvent({
            source: src,
            url: item.url,
            html: page.html,
            markdown: page.markdown,
            categoryHint: item.categoryHint,
          });
        }
        counters.events_extracted++;

        const venueName = event.venue_name ?? defaults.venue_name ?? null;
        const cityName = event.city_name ?? defaults.city_name ?? null;
        const fingerprint = await computeFingerprint(event.title, event.event_date, venueName);

        const artistMatch = matchEntity(event.artist_name, artists);
        const venueMatch = matchEntity(venueName, venues);
        const promoterMatch = matchEntity(event.promoter_name, promoters);

        let matchedConcertId: string | null = null;
        let concertMatchType: 'pulep' | 'artist_date' | 'none' = 'none';
        if (event.pulep_code && concertsByPulep.has(event.pulep_code)) {
          matchedConcertId = concertsByPulep.get(event.pulep_code)!;
          concertMatchType = 'pulep';
        } else if (artistMatch && event.event_date) {
          const target = Date.parse(event.event_date);
          const hit = upcomingConcerts.find((c) =>
            c.artist_id === artistMatch.id &&
            c.date &&
            Math.abs(Date.parse(String(c.date).slice(0, 10)) - target) <= 1.5 * 86_400_000
          );
          if (hit) {
            matchedConcertId = hit.id;
            concertMatchType = 'artist_date';
          }
        }

        let matchedFestivalId: string | null = null;
        if (event.event_type_guess === 'festival') {
          if (event.pulep_code && festivalsByPulep.has(event.pulep_code)) {
            matchedFestivalId = festivalsByPulep.get(event.pulep_code)!;
          } else {
            const festivalMatch = matchEntity(event.title, festivals);
            if (festivalMatch?.confidence === 'exact') matchedFestivalId = festivalMatch.id;
          }
        }

        const payload = {
          source_url: item.url,
          pulep_code: event.pulep_code,
          fingerprint,
          title: event.title,
          artist_name: event.artist_name,
          venue_name: venueName,
          city_name: cityName,
          country_code: src.country_code,
          event_date: event.event_date,
          event_time: event.event_time,
          doors_time: event.doors_time,
          event_type_guess: event.event_type_guess,
          relevance: event.relevance,
          confidence: event.confidence,
          ticket_url: event.ticket_url,
          image_url: event.image_url,
          promoter_name: event.promoter_name,
          price_data: event.price_data,
          sale_stages: event.sale_stages,
          extraction_notes: event.extraction_notes,
          raw: {
            category_hint: item.categoryHint ?? null,
            lastmod: item.lastmod ?? null,
            fetched_at: new Date().toISOString(),
          },
          matched_artist_id: artistMatch?.id ?? null,
          artist_match_confidence: artistMatch?.confidence ?? 'not_found',
          matched_venue_id: venueMatch?.id ?? null,
          venue_match_confidence: venueMatch?.confidence ?? 'not_found',
          matched_promoter_id: promoterMatch?.id ?? null,
          promoter_match_confidence: promoterMatch?.confidence ?? 'not_found',
          matched_concert_id: matchedConcertId,
          matched_festival_id: matchedFestivalId,
          concert_match_type: concertMatchType,
          last_seen_at: new Date().toISOString(),
        };

        const existingRow = existing.get(key);
        if (!existingRow) {
          const { error: insertError } = await supabase
            .from('staged_events')
            .insert({ ...payload, source_id: src.id, source_event_key: key, status: 'pending' });
          if (insertError) throw new Error(insertError.message);
          counters.events_new++;
        } else if (existingRow.status === 'pending' && existingRow.fingerprint !== fingerprint) {
          const { error: updateError } = await supabase
            .from('staged_events')
            .update(payload)
            .eq('id', existingRow.id);
          if (updateError) throw new Error(updateError.message);
          counters.events_updated++;
        } else {
          // discarded/rejected/approved (o pending sin cambios): nunca se re-propone.
          counters.events_skipped++;
        }
      } catch (error) {
        console.error(`[ingest-source] ${src.slug} ${key}:`,
          error instanceof Error ? error.message : error);
        counters.events_skipped++;
      }
    }
  } catch (error) {
    runStatus = 'error';
    runError = error instanceof Error ? error.message : 'Ingestion failed';
    console.error(`[ingest-source] ${src.slug} run failed:`, runError);
  }

  await supabase
    .from('ingestion_runs')
    .update({
      status: runStatus,
      finished_at: new Date().toISOString(),
      error: runError,
      ...counters,
    })
    .eq('id', runId);
  await supabase
    .from('ingestion_sources')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', src.id);

  return json(runStatus === 'error' ? 500 : 200, {
    success: runStatus !== 'error',
    data: { runId, status: runStatus, stats: counters },
    error: runError ?? undefined,
  });
});
