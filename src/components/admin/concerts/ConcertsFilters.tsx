import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { Artist, Venue, Promoter, ConcertFilters } from './types';

interface ConcertsFiltersProps {
    filters: ConcertFilters;
    artists: Artist[];
    venues: Venue[];
    promoters: Promoter[];
    totalConcerts: number;
    filteredCount: number;
    onFilterChange: (filters: Partial<ConcertFilters>) => void;
    onResetFilters: () => void;
}

export const ConcertsFilters = ({
    filters,
    artists,
    venues,
    promoters,
    totalConcerts,
    filteredCount,
    onFilterChange,
    onResetFilters,
}: ConcertsFiltersProps) => {
    const hasActiveFilters =
        filters.search !== '' ||
        filters.eventType !== 'all' ||
        filters.status !== 'all' ||
        filters.artistId !== 'all' ||
        filters.venueId !== 'all' ||
        filters.promoterId !== 'all' ||
        filters.featured !== null;

    return (
        <div className="space-y-3">
            {/* Top row: search + count */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, slug o artista…"
                        value={filters.search}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                        className="pl-10"
                    />
                </div>
                <span className="text-sm text-muted-foreground ml-auto">
                    {filteredCount} de {totalConcerts}
                </span>
            </div>

            {/* Filter selects */}
            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={filters.eventType}
                    onValueChange={(value) => onFilterChange({ eventType: value })}
                >
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="concert">Conciertos</SelectItem>
                        <SelectItem value="festival">Festivales</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status}
                    onValueChange={(value) => onFilterChange({ status: value })}
                >
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="upcoming">Próximos</SelectItem>
                        <SelectItem value="past">Pasados</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.artistId}
                    onValueChange={(value) => onFilterChange({ artistId: value })}
                >
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Artista" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los artistas</SelectItem>
                        {artists.map((artist) => (
                            <SelectItem key={artist.id} value={artist.id}>
                                {artist.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.venueId}
                    onValueChange={(value) => onFilterChange({ venueId: value })}
                >
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Venue" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los venues</SelectItem>
                        {venues.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                                {venue.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.promoterId}
                    onValueChange={(value) => onFilterChange({ promoterId: value })}
                >
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Promotor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los promotores</SelectItem>
                        {promoters.map((promoter) => (
                            <SelectItem key={promoter.id} value={promoter.id}>
                                {promoter.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.featured === null ? 'all' : filters.featured.toString()}
                    onValueChange={(value) =>
                        onFilterChange({
                            featured: value === 'all' ? null : value === 'true',
                        })
                    }
                >
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Destacados</SelectItem>
                        <SelectItem value="false">No destacados</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-9 gap-1">
                        <X className="w-3 h-3" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    );
};
