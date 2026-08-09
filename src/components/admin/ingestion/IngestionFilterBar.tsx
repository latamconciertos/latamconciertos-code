import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterSelectConfig {
  value: string;
  onChange: (value: string) => void;
  /** Etiqueta de la opción "todos", p. ej. "Todos los países" */
  allLabel: string;
  options: { value: string; label: string }[];
  /** Ancho mínimo del trigger (clase tailwind), opcional */
  triggerClass?: string;
}

interface IngestionFilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selects: FilterSelectConfig[];
  shown: number;
  total: number;
  hasActiveFilters: boolean;
  onClear: () => void;
}

/**
 * Barra de filtros compartida por las pestañas de ingesta.
 * Pills sobre superficie con focus periwinkle, según el sistema nocturno.
 */
export const IngestionFilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  selects,
  shown,
  total,
  hasActiveFilters,
  onClear,
}: IngestionFilterBarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-texto-2" />
          <Input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-full border-linea bg-superficie pl-9 text-sm focus-visible:ring-periwinkle"
          />
        </div>
      )}

      {selects.map((select, i) => (
        <Select key={i} value={select.value} onValueChange={select.onChange}>
          <SelectTrigger
            className={`h-9 w-auto rounded-full border-linea bg-superficie text-xs font-semibold focus:ring-periwinkle ${select.triggerClass ?? 'min-w-[150px]'}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{select.allLabel}</SelectItem>
            {select.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      <div className="ml-auto flex items-center gap-3">
        <p className="text-xs text-texto-2">
          <span className="font-bold text-verde">{shown}</span> de {total}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-texto-2 transition-colors hover:text-texto"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};
