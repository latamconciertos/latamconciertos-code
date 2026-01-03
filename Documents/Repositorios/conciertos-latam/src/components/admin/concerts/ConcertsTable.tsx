import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ConcertTableRow } from './ConcertTableRow';
import type { Concert, Artist, Venue } from './types';

interface ConcertsTableProps {
    concerts: Concert[];
    artists: Artist[];
    venues: Venue[];
    onEdit: (concert: Concert) => void;
    onDelete: (id: string) => void;
    onToggleFeatured: (id: string, currentStatus: boolean) => void;
}

export const ConcertsTable = ({
    concerts,
    artists,
    venues,
    onEdit,
    onDelete,
    onToggleFeatured,
}: ConcertsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Pagination calculations
    const totalPages = Math.ceil(concerts.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedConcerts = concerts.slice(startIndex, endIndex);

    // Reset to page 1 when page size changes
    const handlePageSizeChange = (newSize: string) => {
        setPageSize(Number(newSize));
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Controls: Page size selector */}
            <div className="flex items-center justify-between">
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
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="w-16">Imagen</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo/Artista</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedConcerts.length > 0 ? (
                            paginatedConcerts.map((concert, index) => (
                                <ConcertTableRow
                                    key={concert.id}
                                    concert={concert}
                                    index={startIndex + index}
                                    artists={artists}
                                    venues={venues}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onToggleFeatured={onToggleFeatured}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    No se encontraron conciertos
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {concerts.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{' '}
                        <span className="font-medium text-foreground">{Math.min(endIndex, concerts.length)}</span> de{' '}
                        <span className="font-medium text-foreground">{concerts.length}</span> conciertos
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
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>
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
