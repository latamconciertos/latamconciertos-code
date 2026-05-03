import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Star, Music } from 'lucide-react';
import { SetlistManager } from '../SetlistManager';
import type { Concert, Artist, Venue } from './types';

interface ConcertTableRowProps {
    concert: Concert;
    artists: Artist[];
    venues: Venue[];
    onEdit: (concert: Concert) => void;
    onDelete: (concert: Concert) => void;
    onToggleFeatured: (id: string, currentStatus: boolean) => void;
}

export const ConcertTableRow = ({
    concert,
    artists,
    venues,
    onEdit,
    onDelete,
    onToggleFeatured,
}: ConcertTableRowProps) => {
    const getArtistName = (artistId: string | null) => {
        if (!artistId) return null;
        return artists.find((a) => a.id === artistId)?.name ?? null;
    };

    const getVenueLabel = (venueId: string | null) => {
        if (!venueId) return null;
        const venue = venues.find((v) => v.id === venueId);
        if (!venue) return null;
        const cityName = venue.cities?.name;
        return cityName ? `${venue.name} · ${cityName}` : venue.name;
    };

    const formatDate = (date: string | null) => {
        if (!date) return null;
        const [year, month, day] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('es', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isPastConcert = (date: string | null) => {
        if (!date) return false;
        const [year, month, day] = date.split('-').map(Number);
        const concertDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return concertDate < today;
    };

    const venueLabel = getVenueLabel(concert.venue_id);
    const artistName = getArtistName(concert.artist_id);
    const dateLabel = formatDate(concert.date);

    return (
        <div
            className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
            onClick={() => onEdit(concert)}
        >
            <div className="col-span-4 flex items-center gap-3 min-w-0">
                {concert.image_url ? (
                    <img
                        src={concert.image_url}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                    />
                ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="font-medium truncate">{concert.title}</h3>
                    {concert.ticket_prices_html && (
                        <p className="text-[10px] text-muted-foreground">💰 Precios</p>
                    )}
                </div>
            </div>

            <div className="col-span-2 min-w-0">
                <Badge
                    variant={concert.event_type === 'festival' ? 'default' : 'secondary'}
                    className="text-[10px]"
                >
                    {concert.event_type === 'festival' ? 'Festival' : 'Concierto'}
                </Badge>
                {concert.event_type === 'concert' && artistName && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{artistName}</p>
                )}
            </div>

            <div className="col-span-2 text-sm text-muted-foreground truncate">
                {venueLabel ?? <span className="italic">—</span>}
            </div>

            <div className="col-span-2 min-w-0">
                <p className="text-sm">{dateLabel ?? <span className="text-muted-foreground italic">Sin fecha</span>}</p>
                {concert.date && (
                    <p className={`text-[10px] ${isPastConcert(concert.date) ? 'text-muted-foreground' : 'text-primary'}`}>
                        {isPastConcert(concert.date) ? 'Pasado' : 'Próximo'}
                    </p>
                )}
            </div>

            <div className="col-span-2 flex justify-end gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFeatured(concert.id, concert.is_featured);
                    }}
                    aria-label={concert.is_featured ? 'Quitar destacado' : 'Marcar destacado'}
                >
                    <Star
                        className={`w-4 h-4 ${concert.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`}
                    />
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Gestionar setlist"
                        >
                            <Music className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Gestionar Setlist</DialogTitle>
                        </DialogHeader>
                        <SetlistManager concertId={concert.id} concertTitle={concert.title} />
                    </DialogContent>
                </Dialog>

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(concert);
                    }}
                    aria-label="Editar"
                >
                    <Pencil className="w-4 h-4" />
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(concert);
                    }}
                    aria-label="Eliminar"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
