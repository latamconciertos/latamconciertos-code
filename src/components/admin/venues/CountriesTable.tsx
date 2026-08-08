import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import type { Country } from './types';

interface CountriesTableProps {
    countries: Country[];
    cities: Array<{ id: string; country_id: string }>;
    onCreateCountry: (data: { name: string; iso_code: string }) => Promise<void>;
}

export const CountriesTable = ({
    countries,
    cities,
    onCreateCountry,
}: CountriesTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', iso_code: '' });

    // Get cities count per country
    const getCitiesCount = (countryId: string) => {
        return cities.filter(city => city.country_id === countryId).length;
    };

    // Filter countries
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.iso_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredCountries.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(Number(newSize));
        setCurrentPage(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreateCountry(formData);
        setFormData({ name: '', iso_code: '' });
        setShowForm(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Países</h3>
                    <p className="text-sm text-muted-foreground">
                        {countries.length} países registrados
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo País
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardHeader>
                        <CardTitle>Nuevo País</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="country_name">Nombre del País</Label>
                                    <Input
                                        id="country_name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="iso_code">Código ISO (2 letras)</Label>
                                    <Input
                                        id="iso_code"
                                        value={formData.iso_code}
                                        onChange={(e) => setFormData({ ...formData, iso_code: e.target.value.toUpperCase() })}
                                        required
                                        maxLength={2}
                                        minLength={2}
                                    />
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

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o código ISO..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                />
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
                            <TableHead>País</TableHead>
                            <TableHead>Código ISO</TableHead>
                            <TableHead className="text-right"># Ciudades</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCountries.length > 0 ? (
                            paginatedCountries.map((country, index) => (
                                <TableRow key={country.id} className="border-linea hover:bg-superficie-2">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {startIndex + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{country.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {country.iso_code}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            {getCitiesCount(country.id)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    {searchTerm
                                        ? 'No se encontraron países con ese criterio'
                                        : 'No hay países registrados'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredCountries.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{' '}
                        <span className="font-medium text-foreground">{Math.min(endIndex, filteredCountries.length)}</span> de{' '}
                        <span className="font-medium text-foreground">{filteredCountries.length}</span> países
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
