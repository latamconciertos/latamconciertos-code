import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil, Trash2 } from 'lucide-react';
import type { Artist } from './types';

interface ArtistsTableProps {
    artists: Artist[];
    onEdit: (artist: Artist) => void;
    onDelete: (artist: Artist) => void;
}

export const ArtistsTable = ({ artists, onEdit, onDelete }: ArtistsTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const filteredArtists = useMemo(
        () =>
            artists.filter(
                (artist) =>
                    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    artist.slug.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        [artists, searchTerm],
    );

    const totalPages = Math.ceil(filteredArtists.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedArtists = filteredArtists.slice(startIndex, endIndex);

    const handlePageSizeChange = (value: string) => {
        setPageSize(Number(value));
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o slug…"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
                <span className="text-sm text-muted-foreground ml-auto">
                    {filteredArtists.length} de {artists.length}
                </span>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="col-span-5">Artista</div>
                    <div className="col-span-3">Slug</div>
                    <div className="col-span-3">Biografía</div>
                    <div className="col-span-1 text-right">Acciones</div>
                </div>

                <div className="divide-y">
                    {paginatedArtists.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {searchTerm
                                ? 'No se encontraron artistas.'
                                : 'No hay artistas registrados.'}
                        </div>
                    ) : (
                        paginatedArtists.map((artist) => (
                            <div
                                key={artist.id}
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
                                onClick={() => onEdit(artist)}
                            >
                                <div className="col-span-5 flex items-center gap-3 min-w-0">
                                    {artist.photo_url ? (
                                        <img
                                            src={artist.photo_url}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover shrink-0"
                                            loading="lazy"
                                            decoding="async"
                                            width={40}
                                            height={40}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <span className="text-[10px] text-muted-foreground">Sin foto</span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-medium truncate">{artist.name}</h3>
                                    </div>
                                </div>
                                <div className="col-span-3 text-xs text-muted-foreground font-mono truncate">
                                    {artist.slug}
                                </div>
                                <div className="col-span-3 text-sm text-muted-foreground truncate">
                                    {artist.bio
                                        ? artist.bio.length > 80
                                            ? `${artist.bio.slice(0, 80)}…`
                                            : artist.bio
                                        : <span className="italic">Sin biografía</span>}
                                </div>
                                <div className="col-span-1 flex justify-end gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(artist);
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
                                            onDelete(artist);
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
            {filteredArtists.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}–{Math.min(endIndex, filteredArtists.length)} de {filteredArtists.length}
                    </span>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Por página:</span>
                            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
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
                                    onClick={() => setCurrentPage(currentPage - 1)}
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
