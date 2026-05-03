import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, ExternalLink, Search, MapPin } from 'lucide-react';
import type { Venue, City, Country } from './types';

interface VenuesTableProps {
    venues: Venue[];
    cities: City[];
    countries: Country[];
    onEdit: (venue: Venue) => void;
    onDelete: (venue: Venue) => void;
}

export const VenuesTable = ({
    venues,
    cities,
    countries,
    onEdit,
    onDelete,
}: VenuesTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCountry, setFilterCountry] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const getCityName = (cityId: string | null) => {
        if (!cityId) return null;
        return cities.find((c) => c.id === cityId)?.name ?? null;
    };

    const getCountryName = (cityId: string | null) => {
        if (!cityId) return null;
        const city = cities.find((c) => c.id === cityId);
        if (!city || !city.country_id) return null;
        return countries.find((c) => c.id === city.country_id)?.name ?? null;
    };

    const formatCapacity = (capacity: number | null) =>
        capacity ? capacity.toLocaleString('es') : null;

    const filteredVenues = useMemo(
        () =>
            venues.filter((venue) => {
                const matchesSearch =
                    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    venue.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    venue.slug.toLowerCase().includes(searchTerm.toLowerCase());

                const city = cities.find((c) => c.id === venue.city_id);
                const matchesCountry = filterCountry === 'all' || city?.country_id === filterCountry;
                const matchesCity = filterCity === 'all' || venue.city_id === filterCity;

                return matchesSearch && matchesCountry && matchesCity;
            }),
        [venues, cities, searchTerm, filterCountry, filterCity],
    );

    const availableCities =
        filterCountry === 'all'
            ? cities
            : cities.filter((c) => c.country_id === filterCountry);

    const totalPages = Math.ceil(filteredVenues.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVenues = filteredVenues.slice(startIndex, endIndex);

    const handleCountryChange = (value: string) => {
        setFilterCountry(value);
        if (value !== filterCountry) setFilterCity('all');
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, ubicación…"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
                <Select value={filterCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los países</SelectItem>
                        {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filterCity}
                    onValueChange={(value) => {
                        setFilterCity(value);
                        setCurrentPage(1);
                    }}
                    disabled={filterCountry === 'all'}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las ciudades</SelectItem>
                        {availableCities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                                {city.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-auto">
                    {filteredVenues.length} de {venues.length}
                </span>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="col-span-4">Venue</div>
                    <div className="col-span-2">Ciudad</div>
                    <div className="col-span-2">País</div>
                    <div className="col-span-2">Capacidad</div>
                    <div className="col-span-1">Web</div>
                    <div className="col-span-1 text-right">Acciones</div>
                </div>

                <div className="divide-y">
                    {paginatedVenues.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {searchTerm || filterCountry !== 'all' || filterCity !== 'all'
                                ? 'No se encontraron venues.'
                                : 'No hay venues registrados.'}
                        </div>
                    ) : (
                        paginatedVenues.map((venue) => (
                            <div
                                key={venue.id}
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
                                onClick={() => onEdit(venue)}
                            >
                                <div className="col-span-4 min-w-0">
                                    <h3 className="font-medium truncate">{venue.name}</h3>
                                    {venue.location && (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{venue.location}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground truncate">
                                    {getCityName(venue.city_id) ?? <span className="italic">—</span>}
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground truncate">
                                    {getCountryName(venue.city_id) ?? <span className="italic">—</span>}
                                </div>
                                <div className="col-span-2 text-sm tabular-nums">
                                    {formatCapacity(venue.capacity) ?? <span className="text-muted-foreground italic">—</span>}
                                </div>
                                <div className="col-span-1 text-sm">
                                    {venue.website ? (
                                        <a
                                            href={venue.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground italic">—</span>
                                    )}
                                </div>
                                <div className="col-span-1 flex justify-end gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(venue);
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
                                            onDelete(venue);
                                        }}
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {filteredVenues.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}–{Math.min(endIndex, filteredVenues.length)} de {filteredVenues.length}
                    </span>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Por página:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => {
                                    setPageSize(Number(v));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
