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
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Géneros Musicales</h3>
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
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                    : 'bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
                  }
                `}
              >
                <span className="relative z-10">{genre.name}</span>
                {isSelected && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent blur-xl" />
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
};
