import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useIngestionRuns } from '@/hooks/queries/useIngestion';
import { IngestionFilterBar } from './IngestionFilterBar';
import { RUN_STATUS_LABELS, type RunStatus } from '@/types/entities';

const STATUS_COLORS: Record<RunStatus, string> = {
  running: 'border-periwinkle/30 bg-periwinkle/10 text-periwinkle',
  success: 'border-verde/30 bg-verde/10 text-verde',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
};

function durationLabel(started: string, finished: string | null): string {
  if (!finished) return '—';
  const secs = Math.round((new Date(finished).getTime() - new Date(started).getTime()) / 1000);
  return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export const IngestionRunsTab = () => {
  const { data: runs, isLoading } = useIngestionRuns();

  const [sourceId, setSourceId] = useState('all');
  const [runStatus, setRunStatus] = useState('all');

  const sourceOptions = useMemo(() => {
    const map = new Map<string, string>();
    (runs ?? []).forEach((r) => map.set(r.source_id, r.source_name ?? r.source_id.slice(0, 8)));
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [runs]);

  const statusOptions = useMemo(
    () =>
      (Object.keys(RUN_STATUS_LABELS) as RunStatus[]).map((status) => ({
        value: status,
        label: RUN_STATUS_LABELS[status],
      })),
    [],
  );

  const filtered = useMemo(
    () =>
      (runs ?? []).filter(
        (r) =>
          (sourceId === 'all' || r.source_id === sourceId) &&
          (runStatus === 'all' || r.status === runStatus),
      ),
    [runs, sourceId, runStatus],
  );

  const hasActiveFilters = sourceId !== 'all' || runStatus !== 'all';
  const clearFilters = () => {
    setSourceId('all');
    setRunStatus('all');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-texto-2" />
      </div>
    );
  }

  if (!runs?.length) {
    return <p className="py-12 text-center text-sm text-texto-2">Aún no hay corridas registradas.</p>;
  }

  return (
    <div>
      <IngestionFilterBar
        selects={[
          { value: sourceId, onChange: setSourceId, allLabel: 'Todas las fuentes', options: sourceOptions, triggerClass: 'min-w-[170px]' },
          { value: runStatus, onChange: setRunStatus, allLabel: 'Todos los estados', options: statusOptions },
        ]}
        shown={filtered.length}
        total={runs.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-texto-2">
          <History className="h-8 w-8 opacity-50" />
          <p className="text-sm">Sin corridas con estos filtros.</p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-[20px] border border-linea bg-superficie">
      <div className="grid min-w-[720px] grid-cols-12 gap-4 border-b border-linea bg-superficie-2/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-texto-2">
        <span className="col-span-3">Fuente</span>
        <span className="col-span-2">Inicio</span>
        <span className="col-span-1">Duración</span>
        <span className="col-span-1">Origen</span>
        <span className="col-span-4">Resultados</span>
        <span className="col-span-1">Estado</span>
      </div>
      <div className="divide-y divide-linea">
        {filtered.map((run) => (
          <div key={run.id} className="grid min-w-[720px] grid-cols-12 items-center gap-4 px-4 py-3 text-sm">
            <span className="col-span-3 truncate font-medium text-texto">{run.source_name ?? run.source_id.slice(0, 8)}</span>
            <span className="col-span-2 text-texto-2">{new Date(run.started_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
            <span className="col-span-1 text-texto-2">{durationLabel(run.started_at, run.finished_at)}</span>
            <span className="col-span-1 text-texto-2">{run.triggered_by === 'cron' ? 'Cron' : 'Manual'}</span>
            <span className="col-span-4 text-texto-2">
              {run.events_new} nuevos · {run.events_updated} act. · {run.events_skipped} omit.
              {run.error && <span className="ml-1 text-destructive">· {run.error.slice(0, 40)}</span>}
            </span>
            <span className="col-span-1">
              <Badge variant="outline" className={STATUS_COLORS[run.status]}>
                {RUN_STATUS_LABELS[run.status]}
              </Badge>
            </span>
          </div>
        ))}
      </div>
      </div>
      )}
    </div>
  );
};
