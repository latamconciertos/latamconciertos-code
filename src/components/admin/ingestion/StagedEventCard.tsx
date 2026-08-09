import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket, Tag } from 'lucide-react';
import type { StagedEventWithSource, MatchConfidence } from '@/types/entities';
import { EVENT_TYPE_GUESS_LABELS } from '@/types/entities';
import { countryLabel } from './countries';
import { smartTitleCase } from './titleCase';

const MATCH_DOT: Record<MatchConfidence, string> = {
  exact: 'bg-verde',
  partial: 'bg-amber-400',
  not_found: 'bg-texto-2/40',
};

function relevanceBadge(relevance: string | null) {
  if (relevance === 'low') return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (relevance === 'high') return 'border-verde/30 bg-verde/10 text-verde';
  return 'border-linea bg-superficie-2 text-texto-2';
}

interface Props {
  event: StagedEventWithSource;
  onOpen: (id: string) => void;
  onApprove: (event: StagedEventWithSource) => void;
  onDiscard: (id: string) => void;
  onReject: (id: string) => void;
}

export const StagedEventCard = ({ event, onOpen, onApprove, onDiscard, onReject }: Props) => {
  const isDuplicate = Boolean(event.matched_concert_id || event.matched_festival_id);

  return (
    <div className="rounded-[20px] border border-linea bg-superficie p-4 transition-colors hover:border-periwinkle/35">
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(event.id)}>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
              Pendiente
            </Badge>
            <Badge variant="outline" className="border-linea bg-superficie-2 text-[10px] text-texto-2">
              {event.source_name ?? 'Fuente'}
            </Badge>
            <Badge variant="outline" className="border-linea bg-superficie-2 text-[10px] text-texto-2">
              {countryLabel(event.country_code)}
            </Badge>
            <Badge variant="outline" className="border-linea bg-superficie-2 text-[10px] text-texto-2">
              {EVENT_TYPE_GUESS_LABELS[event.event_type_guess]}
            </Badge>
            {event.relevance && (
              <Badge variant="outline" className={`text-[10px] ${relevanceBadge(event.relevance)}`}>
                Relevancia {event.relevance}
              </Badge>
            )}
            {event.pulep_code && (
              <Badge variant="outline" className="border-periwinkle/30 bg-periwinkle/10 text-[10px] text-periwinkle">
                <Tag className="mr-1 h-3 w-3" /> {event.pulep_code}
              </Badge>
            )}
            {isDuplicate && (
              <Badge variant="outline" className="border-periwinkle/30 bg-periwinkle/10 text-[10px] text-periwinkle">
                Posible duplicado
              </Badge>
            )}
          </div>

          <h3 className="truncate font-semibold text-texto">{smartTitleCase(event.title)}</h3>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-2">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {event.event_date ?? 'sin fecha'}{event.event_time ? ` · ${event.event_time}` : ''}
            </span>
            {event.venue_name && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {event.venue_name}
                {event.city_name ? `, ${event.city_name}` : ''}
              </span>
            )}
            {event.ticket_url && (
              <span className="inline-flex items-center gap-1">
                <Ticket className="h-3 w-3" /> Tickets
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-texto-2">
            <span className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${MATCH_DOT[event.artist_match_confidence ?? 'not_found']}`} />
              Artista: {event.artist_name ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${MATCH_DOT[event.venue_match_confidence ?? 'not_found']}`} />
              Venue
            </span>
            {event.confidence != null && <span>Confianza: {Math.round(event.confidence * 100)}%</span>}
          </div>
        </button>

        <div className="flex shrink-0 flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-verde/30 bg-verde/10 text-verde hover:bg-verde/20 hover:text-verde"
            onClick={() => onApprove(event)}
          >
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-linea bg-transparent text-texto-2 hover:bg-superficie-2"
            onClick={() => onDiscard(event.id)}
          >
            Descartar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={() => onReject(event.id)}
          >
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  );
};
