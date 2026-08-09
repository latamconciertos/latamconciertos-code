import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveRunInfo {
  sourceId: string;
  sourceName: string;
  /** ISO de arranque del run en el cliente */
  startedAt: string;
  mode: 'full' | 'single';
}

interface Props {
  run: ActiveRunInfo;
  running: boolean;
}

/**
 * Progreso en vivo de una corrida de ingesta: el worker guarda cada evento
 * apenas lo procesa, así que contar lo staged desde el arranque da avance real.
 */
export const RunProgressCard = ({ run, running }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startMs = new Date(run.startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [run.startedAt]);

  const { data: found } = useQuery({
    queryKey: ['ingestion', 'progress', run.sourceId, run.startedAt],
    enabled: running,
    refetchInterval: 2500,
    queryFn: async (): Promise<number> => {
      const { count } = await (supabase as any)
        .from('staged_events')
        .select('id', { count: 'exact', head: true })
        .eq('source_id', run.sourceId)
        .gte('created_at', run.startedAt);
      return count ?? 0;
    },
  });

  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed right-4 top-24 z-50 w-72 rounded-[20px] border border-linea bg-superficie p-4 shadow-[0_20px_50px_rgba(0,0,0,.5)]">
      <div className="flex items-center gap-2">
        {running ? (
          <span className="punto-vivo h-2 w-2 shrink-0 rounded-full bg-verde" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-verde" />
        )}
        <p className="min-w-0 truncate text-sm font-semibold text-texto">
          {running ? 'Ejecutando' : 'Corrida completada'}: {run.sourceName}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-texto-2">
        <span>{run.mode === 'single' ? 'URL puntual' : 'Corrida completa'} · {minutes}:{seconds}</span>
        <span>
          <span className="font-display text-base font-extrabold text-verde">{found ?? 0}</span>
          {' '}{(found ?? 0) === 1 ? 'nuevo' : 'nuevos'}
        </span>
      </div>

      {running && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-texto-2/80">
          <Loader2 className="h-3 w-3 animate-spin" />
          Extrayendo y clasificando eventos de la fuente…
        </p>
      )}
    </div>
  );
};
