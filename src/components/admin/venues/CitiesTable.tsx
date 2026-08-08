import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import type { City, Country, Venue } from './types';

interface CitiesTableProps {
    cities: City[];
    countries: Country[];
    venues: Venue[];
    onCreateCity: (data: { name: string; country_id: string }) => Promise<void>;
}

export const CitiesTable = ({
    cities,
    countries,
    venues,
    onCreateCity,
}: CitiesTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCountry, setFilterCountry] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', country_id: '' });

    // Get country name
    const getCountryName = (countryId: string) => {
        const country = countries.find(c => c.id === countryId);
        return country ? country.name : 'N/A';
    };

    // Get venues count per city
    const getVenuesCount = (cityId: string) => {
        return venues.filter(venue => venue.city_id === cityId).length;
    };

    // Filter cities
    const filteredCities = cities.filter(city => {
        const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCountry = filterCountry === 'all' || city.country_id === filterCountry;
        return matchesSearch && matchesCountry;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCities.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCities = filteredCities.slice(startIndex, endIndex);

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(Number(newSize));
        setCurrentPage(1);
    };

    const handleFilterChange = (country: string) => {
        setFilterCountry(country);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterCountry('all');
        setCurrentPage(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreateCity(formData);
        setFormData({ name: '', country_id: '' });
        setShowForm(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Ciudades</h3>
                    <p className="text-sm text-muted-foreground">
                        {cities.length} ciudades registradas
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Ciudad
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardHeader>
                        <CardTitle>Nueva Ciudad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city_name">Nombre de la Ciudad</Label>
                                    <Input
                                        id="city_name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="country">País</Label>
                                    <Select
                                        value={formData.country_id}
                                        onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar país" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    className="rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95"
                                >
                                    Crear
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9"
                    />
                </div>
                <Select value={filterCountry} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filtrar por país" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los países</SelectItem>
                        {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(searchTerm || filterCountry !== 'all') && (
                    <Button
                        variant="outline"
                        className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                        onClick={resetFilters}
                    >
                        Limpiar
                    </Button>
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
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-[20px] border border-linea overflow-hidden bg-superficie">
                <Table>
                    <TableHeader>
                        <TableRow className="border-linea bg-superficie-2/60">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>País</TableHead>
                            <TableHead className="text-right"># Venues</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCities.length > 0 ? (
                            paginatedCities.map((city, index) => (
                                <TableRow key={city.id} className="border-linea hover:bg-superficie-2">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {startIndex + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{city.name}</TableCell>
                                    <TableCell className="text-sm">{getCountryName(city.country_id)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            {getVenuesCount(city.id)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    {searchTerm || filterCountry !== 'all'
                                        ? 'No se encontraron ciudades con ese criterio'
                                        : 'No hay ciudades registradas'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredCities.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{' '}
                        <span className="font-medium text-foreground">{Math.min(endIndex, filteredCities.length)}</span> de{' '}
                        <span className="font-medium text-foreground">{filteredCities.length}</span> ciudades
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
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
                            className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
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
