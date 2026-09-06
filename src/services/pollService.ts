/**
 * Poll Service
 *
 * Encuestas de festival: lectura pública de encuestas activas, CRUD admin, envío de
 * respuestas (vía edge function poll-submit) y resultados agregados (RPC token-gated).
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Poll,
  PollWithRelations,
  PollInsert,
  PollUpdate,
  PollSubmission,
  PollResults,
} from '@/types/entities/poll';

// Las tablas de encuestas no están en los tipos generados todavía.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const POLL_SELECT = `
  *,
  festivals (id, name, slug, start_date)
`;

const ADMIN_SELECT = `
  *,
  festivals (id, name, slug, start_date),
  poll_share_links (token)
`;

class PollServiceClass {
  async getActivePolls(): Promise<PollWithRelations[]> {
    const { data, error } = await db
      .from('polls')
      .select(POLL_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PollWithRelations[];
  }

  async getActivePollBySlug(slug: string): Promise<PollWithRelations | null> {
    const { data, error } = await db
      .from('polls')
      .select(POLL_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return (data as PollWithRelations | null) ?? null;
  }

  async getAllForAdmin(): Promise<PollWithRelations[]> {
    const { data, error } = await db
      .from('polls')
      .select(ADMIN_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const polls = (data ?? []) as PollWithRelations[];
    if (!polls.length) return polls;

    const { data: counts } = await db
      .from('poll_responses')
      .select('poll_id')
      .in('poll_id', polls.map((p) => p.id));

    const countMap: Record<string, number> = {};
    for (const row of counts ?? []) {
      countMap[row.poll_id] = (countMap[row.poll_id] ?? 0) + 1;
    }
    return polls.map((p) => ({ ...p, response_count: countMap[p.id] ?? 0 }));
  }

  async create(input: PollInsert): Promise<Poll> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await db
      .from('polls')
      .insert({ ...input, created_by: user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as Poll;
  }

  async update(id: string, input: PollUpdate): Promise<Poll> {
    const { data, error } = await db
      .from('polls')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Poll;
  }

  async remove(id: string): Promise<void> {
    const { error } = await db.from('polls').delete().eq('id', id);
    if (error) throw error;
  }

  async submit(submission: PollSubmission): Promise<{ ok: boolean }> {
    const { data, error } = await supabase.functions.invoke('poll-submit', {
      body: submission,
    });

    if (error) {
      // supabase-js envuelve el body del error en context; intentamos recuperar el mensaje.
      const ctx = (error as { context?: Response }).context;
      let message = 'No pudimos guardar tu respuesta. Inténtalo de nuevo.';
      let status = 500;
      if (ctx && typeof ctx.json === 'function') {
        try {
          const body = await ctx.json();
          if (body?.error) message = body.error;
          status = ctx.status ?? status;
        } catch {
          // body no parseable
        }
      }
      const err = new Error(message) as Error & { status?: number };
      err.status = status;
      throw err;
    }

    if (data?.error) throw new Error(data.error);
    return data as { ok: boolean };
  }

  async getResults(token: string): Promise<PollResults | null> {
    const { data, error } = await db.rpc('get_poll_results', { p_token: token });
    if (error) throw error;
    return (data as PollResults | null) ?? null;
  }
}

export const pollService = new PollServiceClass();
