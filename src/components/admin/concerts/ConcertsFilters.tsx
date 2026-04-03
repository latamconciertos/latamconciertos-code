import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por título, slug o artista..."
                                value={filters.search}
                                onChange={(e) => onFilterChange({ search: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Filtros principales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <Label className="text-xs">Tipo de Evento</Label>
                            <Select
                                value={filters.eventType}
                                onValueChange={(value) => onFilterChange({ eventType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="concert">Conciertos</SelectItem>
                                    <SelectItem value="festival">Festivales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Estado</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => onFilterChange({ status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="upcoming">Próximos</SelectItem>
                                    <SelectItem value="past">Pasados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Artista</Label>
                            <Select
                                value={filters.artistId}
                                onValueChange={(value) => onFilterChange({ artistId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {artists.map((artist) => (
                                        <SelectItem key={artist.id} value={artist.id}>
                                            {artist.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Venue</Label>
                            <Select
                                value={filters.venueId}
                                onValueChange={(value) => onFilterChange({ venueId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {venues.map((venue) => (
                                        <SelectItem key={venue.id} value={venue.id}>
                                            {venue.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Promotor</Label>
                            <Select
                                value={filters.promoterId}
                                onValueChange={(value) => onFilterChange({ promoterId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {promoters.map((promoter) => (
                                        <SelectItem key={promoter.id} value={promoter.id}>
                                            {promoter.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Destacados</Label>
                            <Select
                                value={filters.featured === null ? 'all' : filters.featured.toString()}
                                onValueChange={(value) => onFilterChange({
                                    featured: value === 'all' ? null : value === 'true'
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Destacados</SelectItem>
                                    <SelectItem value="false">No destacados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Botón limpiar filtros */}
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onResetFilters}
                            className="gap-2"
                        >
                            <X className="w-4 h-4" />
                            Limpiar filtros
                        </Button>
                    </div>

                    {/* Contador de resultados */}
                    <div className="text-sm text-muted-foreground">
                        Mostrando {filteredCount} de {totalConcerts} conciertos
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
