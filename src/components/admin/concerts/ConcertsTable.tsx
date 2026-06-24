import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConcertTableRow } from './ConcertTableRow';
import type { Concert, Artist, Venue } from './types';

interface ConcertsTableProps {
    concerts: Concert[];
    artists: Artist[];
    venues: Venue[];
    onEdit: (concert: Concert) => void;
    onDuplicate: (concert: Concert) => void;
    onDelete: (concert: Concert) => void;
    onToggleFeatured: (id: string, currentStatus: boolean) => void;
}

export const ConcertsTable = ({
    concerts,
    artists,
    venues,
    onEdit,
    onDuplicate,
    onDelete,
    onToggleFeatured,
}: ConcertsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const totalPages = Math.ceil(concerts.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedConcerts = concerts.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="col-span-4">Concierto</div>
                    <div className="col-span-2">Tipo / Artista</div>
                    <div className="col-span-2">Venue</div>
                    <div className="col-span-2">Fecha</div>
                    <div className="col-span-2 text-right">Acciones</div>
                </div>

                <div className="divide-y">
                    {paginatedConcerts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No se encontraron conciertos.
                        </div>
                    ) : (
                        paginatedConcerts.map((concert) => (
                            <ConcertTableRow
                                key={concert.id}
                                concert={concert}
                                artists={artists}
                                venues={venues}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onDelete={onDelete}
                                onToggleFeatured={onToggleFeatured}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {concerts.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}–{Math.min(endIndex, concerts.length)} de {concerts.length}
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
