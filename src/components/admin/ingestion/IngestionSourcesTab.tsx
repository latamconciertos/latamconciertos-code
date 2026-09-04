import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Globe, Link2, Download } from 'lucide-react';
import { useIngestionSources, useToggleSource, useRunSource, useIngestSingleUrl } from '@/hooks/queries/useIngestion';
import { IngestionFilterBar } from './IngestionFilterBar';
import { RunProgressCard, type ActiveRunInfo } from './RunProgressCard';
import { COUNTRY_LABELS, countryLabel } from './countries';
import type { IngestionSource } from '@/types/entities';

export const IngestionSourcesTab = () => {
  const { data: sources, isLoading } = useIngestionSources();
  const toggleSource = useToggleSource();
  const runSource = useRunSource();
  const singleUrlIngest = useIngestSingleUrl();

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [method, setMethod] = useState('all');
  const [activity, setActivity] = useState('all');

  const [eventUrl, setEventUrl] = useState('');
  const [activeRun, setActiveRun] = useState<ActiveRunInfo | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  const startRun = (source: IngestionSource, mode: ActiveRunInfo['mode']) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setActiveRun({ sourceId: source.id, sourceName: source.name, startedAt: new Date().toISOString(), mode });
  };
  const scheduleClearRun = () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setActiveRun(null), 6000);
  };

  const handleRunSource = (source: IngestionSource) => {
    startRun(source, 'full');
    runSource.mutate(source.id, { onSettled: scheduleClearRun });
  };

  // Empareja la URL pegada con la fuente cuyo dominio la cubre (subdominios incluidos)
  const findSourceForUrl = (raw: string): IngestionSource | undefined => {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      return (sources ?? []).find((s) => {
        const root = new URL(s.base_url).hostname.toLowerCase().replace(/^www\./, '');
        return host === root || host.endsWith(`.${root}`);
      });
    } catch {
      return undefined;
    }
  };

  const handleSingleUrl = () => {
    const url = eventUrl.trim();
    if (!url) return;
    const source = findSourceForUrl(url);
    if (!source) {
      toast.error('Ninguna fuente configurada cubre ese dominio. Verifica la URL o agrega la fuente primero.');
      return;
    }
    startRun(source, 'single');
    singleUrlIngest.mutate(
      { sourceId: source.id, url },
      {
        onSuccess: () => setEventUrl(''),
        onSettled: scheduleClearRun,
      },
    );
  };

  const countryOptions = useMemo(
    () =>
      [...new Set((sources ?? []).map((s) => s.country_code))]
        .sort()
        .map((code) => ({ value: code, label: countryLabel(code) })),
    [sources],
  );

  const methodOptions = useMemo(
    () =>
      [...new Set((sources ?? []).map((s) => s.fetch_method))]
        .sort()
        .map((m) => ({ value: m, label: m })),
    [sources],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sources ?? []).filter(
      (s) =>
        (country === 'all' || s.country_code === country) &&
        (method === 'all' || s.fetch_method === method) &&
        (activity === 'all' || (activity === 'active' ? s.is_active : !s.is_active)) &&
        (!q || s.name.toLowerCase().includes(q) || s.base_url.toLowerCase().includes(q)),
    );
  }, [sources, search, country, method, activity]);

  // Agrupación por país: escala cuando haya más tiqueteras y mercados
  const grouped = useMemo(() => {
    const map = new Map<string, IngestionSource[]>();
    filtered.forEach((s) => {
      const list = map.get(s.country_code) ?? [];
      list.push(s);
      map.set(s.country_code, list);
    });
    return [...map.entries()].sort(([a], [b]) =>
      (COUNTRY_LABELS[a]?.name ?? a).localeCompare(COUNTRY_LABELS[b]?.name ?? b),
    );
  }, [filtered]);

  const hasActiveFilters =
    search.trim() !== '' || country !== 'all' || method !== 'all' || activity !== 'all';
  const clearFilters = () => {
    setSearch('');
    setCountry('all');
    setMethod('all');
    setActivity('all');
  };

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
    <div>
      {activeRun && (
        <RunProgressCard run={activeRun} running={runSource.isPending || singleUrlIngest.isPending} />
      )}

      {/* Ingesta puntual: pega la URL de un evento y se procesa sin correr toda la fuente */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[20px] border border-linea bg-superficie p-3">
        <Link2 className="ml-1 h-4 w-4 shrink-0 text-periwinkle" />
        <Input
          value={eventUrl}
          onChange={(e) => setEventUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSingleUrl();
            }
          }}
          placeholder="Pega la URL de un evento para ingerirlo directo (ej. https://tuboleta.com/es/eventos/…)"
          className="h-9 min-w-[240px] flex-1 rounded-full border-linea bg-superficie-2 text-sm focus-visible:ring-periwinkle"
        />
        <Button
          onClick={handleSingleUrl}
          disabled={singleUrlIngest.isPending || !eventUrl.trim()}
          className="h-9 rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] px-4 text-xs font-semibold text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95"
        >
          {singleUrlIngest.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Ingerir evento
        </Button>
      </div>

      <IngestionFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar fuente o URL…"
        selects={[
          { value: country, onChange: setCountry, allLabel: 'Todos los países', options: countryOptions },
          { value: method, onChange: setMethod, allLabel: 'Todos los métodos', options: methodOptions, triggerClass: 'min-w-[140px]' },
          {
            value: activity,
            onChange: setActivity,
            allLabel: 'Todas',
            options: [
              { value: 'active', label: 'Activas' },
              { value: 'paused', label: 'Pausadas' },
            ],
            triggerClass: 'min-w-[110px]',
          },
        ]}
        shown={filtered.length}
        total={sources.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-texto-2">
          <Globe className="h-8 w-8 opacity-50" />
          <p className="text-sm">Sin fuentes con estos filtros.</p>
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
        <div className="space-y-6">
          {grouped.map(([code, group]) => (
            <section key={code}>
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-azul-claro">
                  {countryLabel(code)}
                </h3>
                <span className="text-xs text-texto-2">
                  · {group.length} {group.length === 1 ? 'fuente' : 'fuentes'}
                </span>
              </div>

              <div className="space-y-3">
                {group.map((source) => (
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
                          className="data-[state=checked]:bg-verde"
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
                        onClick={() => handleRunSource(source)}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
