import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { FestivalFilterStatus } from '@/types/entities/festival';

interface Venue {
  id: string;
  name: string;
}

interface Promoter {
  id: string;
  name: string;
}

export interface FestivalFiltersState {
  search: string;
  status: FestivalFilterStatus;
  venueId: string;
  promoterId: string;
  featured: 'all' | 'true' | 'false';
}

interface FestivalFiltersProps {
  filters: FestivalFiltersState;
  venues: Venue[];
  promoters: Promoter[];
  totalCount: number;
  filteredCount: number;
  onFiltersChange: (filters: FestivalFiltersState) => void;
  onReset: () => void;
}

export const DEFAULT_FILTERS: FestivalFiltersState = {
  search: '',
  status: 'all',
  venueId: 'all',
  promoterId: 'all',
  featured: 'all',
};

export function FestivalFilters({
  filters,
  venues,
  promoters,
  totalCount,
  filteredCount,
  onFiltersChange,
  onReset,
}: FestivalFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.venueId !== 'all' ||
    filters.promoterId !== 'all' ||
    filters.featured !== 'all';

  return (
    <div className="space-y-3">
      {/* Top row: search + count */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredCount} de {totalCount}
        </span>
      </div>

      {/* Filter selects */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as FestivalFilterStatus })
          }
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="upcoming">Próximos</SelectItem>
            <SelectItem value="past">Pasados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.venueId}
          onValueChange={(value) => onFiltersChange({ ...filters, venueId: value })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los venues</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.promoterId}
          onValueChange={(value) => onFiltersChange({ ...filters, promoterId: value })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Promotora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las promotoras</SelectItem>
            {promoters.map((promoter) => (
              <SelectItem key={promoter.id} value={promoter.id}>
                {promoter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.featured}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, featured: value as 'all' | 'true' | 'false' })
          }
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Destacados</SelectItem>
            <SelectItem value="false">No destacados</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1">
            <X className="w-3 h-3" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
