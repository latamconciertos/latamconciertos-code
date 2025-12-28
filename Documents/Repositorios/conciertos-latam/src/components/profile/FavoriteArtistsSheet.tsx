import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Music, Save, Check } from 'lucide-react';
import type { Artist } from '@/hooks/queries/useProfile';

interface FavoriteArtistsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artists: Artist[];
  selectedArtists: string[];
  onToggleArtist: (artistId: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const FavoriteArtistsSheet = ({
  open,
  onOpenChange,
  artists,
  selectedArtists,
  onToggleArtist,
  onSave,
  isSaving,
}: FavoriteArtistsSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Artistas favoritos
          </SheetTitle>
          <SheetDescription>
            Selecciona tus artistas favoritos ({selectedArtists.length} seleccionados)
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto pb-24 -mx-6 px-6">
          <div className="flex flex-wrap gap-2">
            {artists.map((artist) => {
              const isSelected = selectedArtists.includes(artist.id);
              return (
                <button
                  key={artist.id}
                  onClick={() => onToggleArtist(artist.id)}
                  className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {artist.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full h-12 gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar artistas'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FavoriteArtistsSheet;
