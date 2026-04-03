import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersChipsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
}

export const ActiveFiltersChips = ({ filters, onRemove }: ActiveFiltersChipsProps) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20 transition-colors"
          onClick={() => onRemove(filter.key)}
        >
          <span className="text-xs">{filter.label}</span>
          <X className="h-3 w-3" />
        </Badge>
      ))}
    </div>
  );
};

export default ActiveFiltersChips;
