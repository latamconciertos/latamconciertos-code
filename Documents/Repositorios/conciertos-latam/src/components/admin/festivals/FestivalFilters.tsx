/**
 * Festival Filters Component
 * 
 * Filter controls for the festivals admin list.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value as FestivalFilterStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="past">Pasados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Venue</Label>
              <Select
                value={filters.venueId}
                onValueChange={(value) => onFiltersChange({ ...filters, venueId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Promotora</Label>
              <Select
                value={filters.promoterId}
                onValueChange={(value) => onFiltersChange({ ...filters, promoterId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Destacados</Label>
              <Select
                value={filters.featured}
                onValueChange={(value) => onFiltersChange({ ...filters, featured: value as 'all' | 'true' | 'false' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Destacados</SelectItem>
                  <SelectItem value="false">No destacados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredCount} de {totalCount} festivales
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
