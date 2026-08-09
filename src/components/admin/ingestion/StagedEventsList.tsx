import { useState } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStagedEvents, useUpdateStagedEvent } from '@/hooks/queries/useIngestion';
import { StagedEventCard } from './StagedEventCard';
import { ApproveStagedDialog } from './ApproveStagedDialog';
import type { StagedEventStatus, StagedEventWithSource } from '@/types/entities';

interface Props {
  status: Extract<StagedEventStatus, 'pending' | 'discarded'>;
}

export const StagedEventsList = ({ status }: Props) => {
  const { data: events, isLoading } = useStagedEvents(status);
  const updateStaged = useUpdateStagedEvent();
  const [approving, setApproving] = useState<StagedEventWithSource | null>(null);

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

  if (status === 'discarded') {
    return (
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-linea bg-superficie p-4 transition-colors hover:border-periwinkle/35">
            <div className="min-w-0">
              <p className="truncate font-medium text-texto">{event.title}</p>
              <p className="text-xs text-texto-2">
                {event.source_name} · {event.event_date ?? 'sin fecha'} · {event.venue_name ?? '—'}
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
    );
  }

  return (
    <>
      <div className="space-y-3">
        {events.map((event) => (
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
      <ApproveStagedDialog event={approving} onClose={() => setApproving(null)} />
    </>
  );
};
