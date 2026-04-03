import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import type { Artist } from './types';

interface ArtistsTableProps {
    artists: Artist[];
    onEdit: (artist: Artist) => void;
    onDelete: (id: string) => void;
}

export const ArtistsTable = ({ artists, onEdit, onDelete }: ArtistsTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Filter artists by search term
    const filteredArtists = artists.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredArtists.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedArtists = filteredArtists.slice(startIndex, endIndex);

    const handlePageSizeChange = (value: string) => {
        setPageSize(Number(value));
        setCurrentPage(1); // Reset to first page
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o slug..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        className="pl-10"
                    />
                </div>

                {/* Reset Button */}
                {searchTerm && (
                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        <X className="w-4 h-4 mr-2" />
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-20">Foto</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Biografía</TableHead>
                            <TableHead className="w-20 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedArtists.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    {searchTerm ? 'No se encontraron artistas' : 'No hay artistas registrados'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedArtists.map((artist) => (
                                <TableRow key={artist.id}>
                                    {/* Photo */}
                                    <TableCell>
                                        {artist.photo_url ? (
                                            <img
                                                src={artist.photo_url}
                                                alt={artist.name}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                Sin foto
                                            </div>
                                        )}
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell>
                                        <div className="font-semibold">{artist.name}</div>
                                    </TableCell>

                                    {/* Slug */}
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground font-mono">{artist.slug}</div>
                                    </TableCell>

                                    {/* Bio (truncated) */}
                                    <TableCell>
                                        {artist.bio ? (
                                            <div className="text-sm max-w-md">
                                                {artist.bio.length > 100 ? `${artist.bio.slice(0, 100)}...` : artist.bio}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Sin biografía</span>
                                        )}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(artist)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(artist.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {filteredArtists.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredArtists.length)} de{' '}
                            {filteredArtists.length} artistas
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Por página:</span>
                            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-20">
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

                        {/* Page Navigation */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
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
