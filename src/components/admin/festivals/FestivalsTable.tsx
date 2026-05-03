import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Star, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FestivalWithRelations } from '@/types/entities/festival';

interface FestivalsTableProps {
    festivals: FestivalWithRelations[];
    onEdit: (festival: FestivalWithRelations) => void;
    onDelete: (festival: FestivalWithRelations) => void;
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
    isTogglingFeatured,
}: FestivalsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const totalPages = Math.ceil(festivals.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFestivals = festivals.slice(startIndex, endIndex);

    const formatDateRange = (startDate: string, endDate: string | null) => {
        const start = format(new Date(startDate), 'd MMM yyyy', { locale: es });
        if (!endDate) return start;
        const end = format(new Date(endDate), 'd MMM yyyy', { locale: es });
        return `${start} – ${end}`;
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="col-span-4">Festival</div>
                    <div className="col-span-3">Fechas</div>
                    <div className="col-span-3">Venue</div>
                    <div className="col-span-2 text-right">Acciones</div>
                </div>

                <div className="divide-y">
                    {paginatedFestivals.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No hay festivales para mostrar.
                        </div>
                    ) : (
                        paginatedFestivals.map((festival) => (
                            <div
                                key={festival.id}
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
                                onClick={() => onEdit(festival)}
                            >
                                <div className="col-span-4 min-w-0">
                                    <h3 className="font-medium truncate">{festival.name}</h3>
                                    {festival.edition && (
                                        <Badge variant="secondary" className="mt-0.5 text-[10px]">
                                            Edición {festival.edition}
                                        </Badge>
                                    )}
                                </div>
                                <div className="col-span-3 text-sm text-muted-foreground truncate">
                                    {formatDateRange(festival.start_date, festival.end_date)}
                                </div>
                                <div className="col-span-3 min-w-0">
                                    {festival.venues ? (
                                        <>
                                            <p className="text-sm truncate">{festival.venues.name}</p>
                                            {festival.venues.cities && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {festival.venues.cities.name}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">Sin venue</span>
                                    )}
                                </div>
                                <div className="col-span-2 flex justify-end gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFeatured(festival.id, !festival.is_featured);
                                        }}
                                        disabled={isTogglingFeatured}
                                        aria-label={festival.is_featured ? 'Quitar destacado' : 'Marcar destacado'}
                                    >
                                        <Star
                                            className={`w-4 h-4 ${festival.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`}
                                        />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onManageLineup(festival);
                                        }}
                                        aria-label="Gestionar lineup"
                                    >
                                        <Users className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(festival);
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
                                            onDelete(festival);
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
            {festivals.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}–{Math.min(endIndex, festivals.length)} de {festivals.length}
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
