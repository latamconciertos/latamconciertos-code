import { useMemo, useState } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStagedEvents, useUpdateStagedEvent } from '@/hooks/queries/useIngestion';
import { StagedEventCard } from './StagedEventCard';
import { ApproveStagedDialog } from './ApproveStagedDialog';
import { IngestionFilterBar } from './IngestionFilterBar';
import { countryLabel } from './countries';
import { smartTitleCase } from './titleCase';
import type { StagedEventStatus, StagedEventWithSource } from '@/types/entities';

interface Props {
  status: Extract<StagedEventStatus, 'pending' | 'discarded'>;
}

export const StagedEventsList = ({ status }: Props) => {
  const { data: events, isLoading } = useStagedEvents(status);
  const updateStaged = useUpdateStagedEvent();
  const [approving, setApproving] = useState<StagedEventWithSource | null>(null);

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [sourceId, setSourceId] = useState('all');

  const countryOptions = useMemo(
    () =>
      [...new Set((events ?? []).map((e) => e.country_code))]
        .sort()
        .map((code) => ({ value: code, label: countryLabel(code) })),
    [events],
  );

  const sourceOptions = useMemo(() => {
    const map = new Map<string, string>();
    (events ?? []).forEach((e) => map.set(e.source_id, e.source_name ?? 'Fuente'));
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (events ?? []).filter(
      (e) =>
        (country === 'all' || e.country_code === country) &&
        (sourceId === 'all' || e.source_id === sourceId) &&
        (!q ||
          [e.title, e.artist_name, e.venue_name, e.city_name]
            .some((v) => v?.toLowerCase().includes(q))),
    );
  }, [events, search, country, sourceId]);

  const hasActiveFilters = search.trim() !== '' || country !== 'all' || sourceId !== 'all';
  const clearFilters = () => {
    setSearch('');
    setCountry('all');
    setSourceId('all');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-texto-2" />
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-texto-2">
        <Inbox className="h-8 w-8 opacity-50" />
        <p className="text-sm">
          {status === 'pending' ? 'No hay eventos pendientes de revisión.' : 'No hay eventos descartados.'}
        </p>
      </div>
    );
  }

  const filterBar = (
    <IngestionFilterBar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por título, artista, venue o ciudad…"
      selects={[
        { value: country, onChange: setCountry, allLabel: 'Todos los países', options: countryOptions },
        { value: sourceId, onChange: setSourceId, allLabel: 'Todas las fuentes', options: sourceOptions, triggerClass: 'min-w-[170px]' },
      ]}
      shown={filtered.length}
      total={events.length}
      hasActiveFilters={hasActiveFilters}
      onClear={clearFilters}
    />
  );

  const emptyFiltered = (
    <div className="flex flex-col items-center gap-3 py-16 text-texto-2">
      <Inbox className="h-8 w-8 opacity-50" />
      <p className="text-sm">Sin resultados con estos filtros.</p>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
        onClick={clearFilters}
      >
        Limpiar filtros
      </Button>
    </div>
  );

  if (status === 'discarded') {
    return (
      <div>
        {filterBar}
        {filtered.length === 0 ? (
          emptyFiltered
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-linea bg-superficie p-4 transition-colors hover:border-periwinkle/35">
                <div className="min-w-0">
                  <p className="truncate font-medium text-texto">{smartTitleCase(event.title)}</p>
                  <p className="text-xs text-texto-2">
                    {event.source_name} · {countryLabel(event.country_code)} · {event.event_date ?? 'sin fecha'} · {event.venue_name ?? 'sin venue'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                  onClick={() => updateStaged.mutate({ id: event.id, data: { status: 'pending' } })}
                >
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {filterBar}
      {filtered.length === 0 ? (
        emptyFiltered
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <StagedEventCard
              key={event.id}
              event={event}
              onOpen={() => setApproving(event)}
              onApprove={setApproving}
              onDiscard={(id) => updateStaged.mutate({ id, data: { status: 'discarded' } })}
              onReject={(id) => updateStaged.mutate({ id, data: { status: 'rejected' } })}
            />
          ))}
        </div>
      )}
      <ApproveStagedDialog event={approving} onClose={() => setApproving(null)} />
    </>
  );
};
