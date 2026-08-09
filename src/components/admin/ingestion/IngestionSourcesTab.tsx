import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Globe } from 'lucide-react';
import { useIngestionSources, useToggleSource, useRunSource } from '@/hooks/queries/useIngestion';

export const IngestionSourcesTab = () => {
  const { data: sources, isLoading } = useIngestionSources();
  const toggleSource = useToggleSource();
  const runSource = useRunSource();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-texto-2" />
      </div>
    );
  }

  if (!sources?.length) {
    return <p className="py-12 text-center text-sm text-texto-2">No hay fuentes configuradas.</p>;
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <div
          key={source.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-linea bg-superficie p-4 transition-colors hover:border-periwinkle/35"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie-2">
              <Globe className="h-5 w-5 text-periwinkle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-texto">{source.name}</span>
                <Badge variant="outline" className="border-linea bg-superficie-2 text-[10px] text-texto-2">
                  {source.country_code}
                </Badge>
                <Badge variant="outline" className="border-linea bg-superficie-2 text-[10px] text-texto-2">
                  {source.fetch_method}
                </Badge>
              </div>
              <a
                href={source.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-texto-2 hover:underline"
              >
                {source.base_url}
              </a>
              {source.last_run_at && (
                <p className="text-[11px] text-texto-2/70">
                  Última corrida: {new Date(source.last_run_at).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={source.is_active}
                onCheckedChange={(checked) => toggleSource.mutate({ id: source.id, isActive: checked })}
              />
              {source.is_active ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-verde">
                  <span className="h-1.5 w-1.5 rounded-full bg-verde" aria-hidden />
                  Activa
                </span>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wide text-texto-2">Pausada</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
              disabled={runSource.isPending}
              onClick={() => runSource.mutate(source.id)}
            >
              {runSource.isPending && runSource.variables === source.id ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Ejecutar ahora
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
