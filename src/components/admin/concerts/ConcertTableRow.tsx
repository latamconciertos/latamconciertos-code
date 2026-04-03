import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreVertical, Edit, Trash2, Star, Music, Eye } from 'lucide-react';
import { SetlistManager } from '../SetlistManager';
import type { Concert, Artist, Venue } from './types';

interface ConcertTableRowProps {
    concert: Concert;
    index: number;
    artists: Artist[];
    venues: Venue[];
    onEdit: (concert: Concert) => void;
    onDelete: (id: string) => void;
    onToggleFeatured: (id: string, currentStatus: boolean) => void;
}

export const ConcertTableRow = ({
    concert,
    index,
    artists,
    venues,
    onEdit,
    onDelete,
    onToggleFeatured,
}: ConcertTableRowProps) => {
    const getArtistName = (artistId: string | null) => {
        if (!artistId) return 'N/A';
        const artist = artists.find(a => a.id === artistId);
        return artist ? artist.name : 'N/A';
    };

    const getVenueName = (venueId: string | null) => {
        if (!venueId) return 'N/A';
        const venue = venues.find(v => v.id === venueId);
        if (!venue) return 'N/A';
        const cityName = venue.cities?.name || '';
        return cityName ? `${venue.name} (${cityName})` : venue.name;
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Sin fecha';
        // Parse as local date to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('es', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isPastConcert = (date: string | null) => {
        if (!date) return false;
        // Parse as local date to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        const concertDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return concertDate < today;
    };

    const handleDeleteClick = () => {
        if (confirm('¿Estás seguro de que quieres eliminar este concierto?')) {
            onDelete(concert.id);
        }
    };

    return (
        <TableRow className="hover:bg-muted/30">
            <TableCell className="font-medium text-muted-foreground">
                {index + 1}
            </TableCell>

            {/* Imagen */}
            <TableCell>
                {concert.image_url ? (
                    <img
                        src={concert.image_url}
                        alt={concert.title}
                        className="w-10 h-10 rounded object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                )}
            </TableCell>

            {/* Título */}
            <TableCell>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{concert.title}</span>
                        {concert.is_featured && (
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        )}
                    </div>
                    {concert.ticket_prices_html && (
                        <Badge variant="outline" className="text-xs w-fit">
                            💰 Precios
                        </Badge>
                    )}
                </div>
            </TableCell>

            {/* Artista/Tipo */}
            <TableCell>
                <div className="flex flex-col gap-1">
                    <Badge
                        variant={concert.event_type === 'festival' ? 'default' : 'secondary'}
                        className="text-xs w-fit"
                    >
                        {concert.event_type === 'festival' ? 'Festival' : 'Concierto'}
                    </Badge>
                    {concert.event_type === 'concert' && (
                        <span className="text-sm text-muted-foreground">
                            {getArtistName(concert.artist_id)}
                        </span>
                    )}
                </div>
            </TableCell>

            {/* Venue */}
            <TableCell className="text-sm">
                {getVenueName(concert.venue_id)}
            </TableCell>

            {/* Fecha */}
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="text-sm">{formatDate(concert.date)}</span>
                    {concert.date && (
                        <Badge
                            variant={isPastConcert(concert.date) ? 'outline' : 'default'}
                            className="text-xs w-fit"
                        >
                            {isPastConcert(concert.date) ? 'Pasado' : 'Próximo'}
                        </Badge>
                    )}
                </div>
            </TableCell>

            {/* Acciones */}
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => onEdit(concert)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                        </DropdownMenuItem>

                        <Dialog>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Music className="mr-2 h-4 w-4" />
                                    <span>Gestionar Setlist</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Gestionar Setlist</DialogTitle>
                                </DialogHeader>
                                <SetlistManager concertId={concert.id} concertTitle={concert.title} />
                            </DialogContent>
                        </Dialog>

                        <DropdownMenuItem
                            onClick={() => onToggleFeatured(concert.id, concert.is_featured)}
                        >
                            <Star className={`mr-2 h-4 w-4 ${concert.is_featured ? 'fill-current' : ''}`} />
                            <span>{concert.is_featured ? 'Quitar destacado' : 'Marcar destacado'}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};
