import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Star, Users, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FestivalWithRelations } from '@/types/entities/festival';

interface FestivalsTableProps {
    festivals: FestivalWithRelations[];
    onEdit: (festival: FestivalWithRelations) => void;
    onDelete: (id: string) => void;
    onToggleFeatured: (id: string, isFeatured: boolean) => void;
    onManageLineup: (festival: FestivalWithRelations) => void;
    isDeleting?: boolean;
    isTogglingFeatured?: boolean;
}

export const FestivalsTable = ({
    festivals,
    onEdit,
    onDelete,
    onToggleFeatured,
    onManageLineup,
    isDeleting,
    isTogglingFeatured,
}: FestivalsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Pagination calculations
    const totalPages = Math.ceil(festivals.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFestivals = festivals.slice(startIndex, endIndex);

    const handlePageSizeChange = (value: string) => {
        setPageSize(Number(value));
        setCurrentPage(1); // Reset to first page
    };

    const formatDateRange = (startDate: string, endDate: string | null) => {
        const start = format(new Date(startDate), 'd MMM yyyy', { locale: es });
        if (!endDate) return start;
        const end = format(new Date(endDate), 'd MMM yyyy', { locale: es });
        return `${start} - ${end}`;
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead className="w-24 text-center">Featured</TableHead>
                            <TableHead className="w-20 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedFestivals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No hay festivales para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedFestivals.map((festival) => (
                                <TableRow key={festival.id}>
                                    {/* Name with Edition */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <div className="font-semibold">{festival.name}</div>
                                                {festival.edition && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        Edición {festival.edition}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Dates */}
                                    <TableCell>
                                        <div className="text-sm">
                                            {formatDateRange(festival.start_date, festival.end_date)}
                                        </div>
                                    </TableCell>

                                    {/* Venue */}
                                    <TableCell>
                                        {festival.venues ? (
                                            <div>
                                                <div className="text-sm font-medium">{festival.venues.name}</div>
                                                {festival.venues.cities && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {festival.venues.cities.name}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Sin venue</span>
                                        )}
                                    </TableCell>

                                    {/* Featured Badge */}
                                    <TableCell className="text-center">
                                        {festival.is_featured && (
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mx-auto" />
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
                                                <DropdownMenuItem onClick={() => onEdit(festival)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onManageLineup(festival)}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Gestionar Lineup
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onToggleFeatured(festival.id, !festival.is_featured)}
                                                    disabled={isTogglingFeatured}
                                                >
                                                    {festival.is_featured ? (
                                                        <>
                                                            <StarOff className="w-4 h-4 mr-2" />
                                                            Quitar Featured
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Star className="w-4 h-4 mr-2" />
                                                            Marcar Featured
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(festival.id)}
                                                    className="text-destructive"
                                                    disabled={isDeleting}
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
            {festivals.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {startIndex + 1} a {Math.min(endIndex, festivals.length)} de{' '}
                            {festivals.length} festivales
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
