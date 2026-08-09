import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  StagedEventStatus,
  StagedEventWithSource,
  StagedEventUpdate,
  IngestionSource,
  IngestionRunWithSource,
} from '@/types/entities';

const KEYS = {
  all: ['ingestion'] as const,
  staged: (status: StagedEventStatus) => [...KEYS.all, 'staged', status] as const,
  counts: () => [...KEYS.all, 'counts'] as const,
  sources: () => [...KEYS.all, 'sources'] as const,
  runs: () => [...KEYS.all, 'runs'] as const,
};

// Client-hydrates the source name (types are stale → `as any` on supabase calls).
async function attachSourceNames<T extends { source_id: string }>(
  rows: T[],
): Promise<(T & { source_name?: string; source_slug?: string })[]> {
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map((r) => r.source_id))];
  const { data: sources } = await (supabase as any)
    .from('ingestion_sources')
    .select('id, name, slug')
    .in('id', ids);
  const map = new Map<string, { id: string; name: string; slug: string }>(
    (sources ?? []).map((s: any) => [s.id as string, s]),
  );
  return rows.map((r) => ({
    ...r,
    source_name: map.get(r.source_id)?.name,
    source_slug: map.get(r.source_id)?.slug,
  }));
}

export const useStagedEvents = (status: StagedEventStatus) =>
  useQuery({
    queryKey: KEYS.staged(status),
    queryFn: async (): Promise<StagedEventWithSource[]> => {
      const { data, error } = await (supabase as any)
        .from('staged_events')
        .select('*')
        .eq('status', status)
        .order('event_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return attachSourceNames((data ?? []) as StagedEventWithSource[]);
    },
  });

export const useStagedCounts = () =>
  useQuery({
    queryKey: KEYS.counts(),
    queryFn: async (): Promise<Record<StagedEventStatus, number>> => {
      const statuses: StagedEventStatus[] = ['pending', 'approved', 'rejected', 'discarded', 'error'];
      const entries = await Promise.all(
        statuses.map(async (status) => {
          const { count } = await (supabase as any)
            .from('staged_events')
            .select('id', { count: 'exact', head: true })
            .eq('status', status);
          return [status, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<StagedEventStatus, number>;
    },
  });

export const useUpdateStagedEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StagedEventUpdate }) => {
      const { error } = await (supabase as any)
        .from('staged_events')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const snapshots = qc.getQueriesData<StagedEventWithSource[]>({ queryKey: KEYS.all });
      // If status changes, drop the row from whatever list it's currently in.
      qc.setQueriesData<StagedEventWithSource[]>({ queryKey: KEYS.all }, (old) => {
        if (!Array.isArray(old)) return old;
        if (data.status) return old.filter((e) => e.id !== id);
        return old.map((e) => (e.id === id ? { ...e, ...data } : e));
      });
      return { snapshots };
    },
    onError: (error: Error, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
      toast.error(`Error al actualizar: ${error.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useIngestionSources = () =>
  useQuery({
    queryKey: KEYS.sources(),
    queryFn: async (): Promise<IngestionSource[]> => {
      const { data, error } = await (supabase as any)
        .from('ingestion_sources')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as IngestionSource[];
    },
  });

export const useToggleSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await (supabase as any)
        .from('ingestion_sources')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.sources() });
      toast.success('Fuente actualizada');
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });
};

export const useIngestionRuns = () =>
  useQuery({
    queryKey: KEYS.runs(),
    queryFn: async (): Promise<IngestionRunWithSource[]> => {
      const { data, error } = await (supabase as any)
        .from('ingestion_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return attachSourceNames((data ?? []) as IngestionRunWithSource[]);
    },
  });

export const useIngestSingleUrl = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, url }: { sourceId: string; url: string }) => {
      const { data, error } = await supabase.functions.invoke('ingest-source', {
        body: { sourceId, singleUrl: url },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const stats = data?.data?.stats;
      if (stats?.events_new) {
        toast.success('Evento ingerido: revísalo en Pendientes');
      } else if (stats?.events_updated) {
        toast.success('Evento actualizado: revísalo en Pendientes');
      } else {
        toast.info('Ese evento ya estaba ingerido o no se pudo extraer');
      }
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(`No se pudo ingerir la URL: ${error.message}`),
  });
};

export const useRunSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('ingest-source', {
        body: { sourceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const stats = data?.data?.stats;
      toast.success(
        stats
          ? `Corrida lista: ${stats.events_new} nuevos, ${stats.events_updated} actualizados`
          : 'Corrida iniciada',
      );
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(`Error al ejecutar: ${error.message}`),
  });
};
