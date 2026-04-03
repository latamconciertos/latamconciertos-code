import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, ExternalLink, Search, MapPin } from 'lucide-react';
import type { Venue, City, Country } from './types';

interface VenuesTableProps {
    venues: Venue[];
    cities: City[];
    countries: Country[];
    onEdit: (venue: Venue) => void;
    onDelete: (id: string) => void;
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
    const [pageSize, setPageSize] = useState(10);

    // Get city name
    const getCityName = (cityId: string | null) => {
        if (!cityId) return 'N/A';
        const city = cities.find(c => c.id === cityId);
        return city ? city.name : 'N/A';
    };

    // Get country name from city
    const getCountryName = (cityId: string | null) => {
        if (!cityId) return 'N/A';
        const city = cities.find(c => c.id === cityId);
        if (!city || !city.country_id) return 'N/A';
        const country = countries.find(c => c.id === city.country_id);
        return country ? country.name : 'N/A';
    };

    // Format capacity
    const formatCapacity = (capacity: number | null) => {
        if (!capacity) return 'N/A';
        return capacity.toLocaleString('es');
    };

    // Get capacity size badge
    const getCapacitySize = (capacity: number | null) => {
        if (!capacity) return null;
        if (capacity < 5000) return { text: 'Pequeño', color: 'bg-blue-100 text-blue-800' };
        if (capacity < 15000) return { text: 'Mediano', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Grande', color: 'bg-green-100 text-green-800' };
    };

    // Filter venues
    const filteredVenues = venues.filter(venue => {
        const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.slug.toLowerCase().includes(searchTerm.toLowerCase());

        const city = cities.find(c => c.id === venue.city_id);
        const matchesCountry = filterCountry === 'all' || city?.country_id === filterCountry;
        const matchesCity = filterCity === 'all' || venue.city_id === filterCity;

        return matchesSearch && matchesCountry && matchesCity;
    });

    // Filter cities by selected country
    const availableCities = filterCountry === 'all'
        ? cities
        : cities.filter(c => c.country_id === filterCountry);

    // Pagination
    const totalPages = Math.ceil(filteredVenues.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVenues = filteredVenues.slice(startIndex, endIndex);

    // Reset page when filters change
    const handleFilterChange = (newFilters: { country?: string; city?: string }) => {
        if (newFilters.country !== undefined) {
            setFilterCountry(newFilters.country);
            if (newFilters.country !== filterCountry) {
                setFilterCity('all'); // Reset city when country changes
            }
        }
        if (newFilters.city !== undefined) {
            setFilterCity(newFilters.city);
        }
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterCountry('all');
        setFilterCity('all');
        setCurrentPage(1);
    };

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(Number(newSize));
        setCurrentPage(1);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este venue?')) {
            onDelete(id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, ubicación..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9"
                    />
                </div>
                <Select value={filterCountry} onValueChange={(value) => handleFilterChange({ country: value })}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los países</SelectItem>
                        {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterCity} onValueChange={(value) => handleFilterChange({ city: value })} disabled={filterCountry === 'all'}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las ciudades</SelectItem>
                        {availableCities.map(city => (
                            <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(searchTerm || filterCountry !== 'all' || filterCity !== 'all') && (
                    <Button variant="outline" onClick={resetFilters}>Limpiar</Button>
                )}
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>País</TableHead>
                            <TableHead>Capacidad</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedVenues.length > 0 ? (
                            paginatedVenues.map((venue, index) => {
                                const capacitySize = getCapacitySize(venue.capacity);
                                return (
                                    <TableRow key={venue.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-muted-foreground">
                                            {startIndex + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{venue.name}</span>
                                                {venue.location && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="w-3 h-3" />
                                                        {venue.location}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {getCityName(venue.city_id)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {getCountryName(venue.city_id)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm">{formatCapacity(venue.capacity)}</span>
                                                {capacitySize && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${capacitySize.color}`}>
                                                        {capacitySize.text}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {venue.website ? (
                                                <a
                                                    href={venue.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span className="max-w-[150px] truncate">Ver sitio</span>
                                                </a>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onEdit(venue)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    {venue.website && (
                                                        <DropdownMenuItem onClick={() => window.open(venue.website!, '_blank')}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Abrir Website
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(venue.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    {searchTerm || filterCountry !== 'all' || filterCity !== 'all'
                                        ? 'No se encontraron venues con ese criterio'
                                        : 'No hay venues registrados'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredVenues.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{' '}
                        <span className="font-medium text-foreground">{Math.min(endIndex, filteredVenues.length)}</span> de{' '}
                        <span className="font-medium text-foreground">{filteredVenues.length}</span> venues
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
