import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface GenreItem {
  name: string;
  count: number;
}

export interface ConcertGenreFilterProps {
  genres: GenreItem[];
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
  isLoading: boolean;
}

export const ConcertGenreFilter = ({
  genres,
  selectedGenre,
  onGenreChange,
  isLoading,
}: ConcertGenreFilterProps) => {
  if (isLoading || !genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-periwinkle/10">
            <Music className="h-4 w-4 text-periwinkle" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Géneros musicales</h3>
            <p className="text-xs text-muted-foreground">
              {selectedGenre ? `Filtrando: ${selectedGenre}` : 'Filtra por género'}
            </p>
          </div>
        </div>
        {selectedGenre && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGenreChange(null)}
            className="text-xs h-7 hover:bg-destructive/10 hover:text-destructive"
          >
            Limpiar
          </Button>
        )}
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-3">
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre.name;
            return (
              <button
                key={genre.name}
                onClick={() => onGenreChange(isSelected ? null : genre.name)}
                className={`
                  relative px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200 flex-shrink-0
                  ${isSelected
                    ? 'bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)]'
                    : 'bg-superficie border border-linea hover:border-[rgba(231,4,133,.35)] hover:bg-superficie-2 text-texto'
                  }
                `}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
};
