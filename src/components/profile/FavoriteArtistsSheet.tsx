import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Music, Save, Check, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar artistas basado en búsqueda
  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists;

    const query = searchQuery.toLowerCase().trim();
    return artists.filter(artist =>
      artist.name.toLowerCase().includes(query)
    );
  }, [artists, searchQuery]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        {/* Fixed Header */}
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Artistas favoritos
          </SheetTitle>
          <SheetDescription>
            Selecciona tus artistas favoritos ({selectedArtists.length} seleccionados)
          </SheetDescription>
        </SheetHeader>

        {/* Search Bar - Fixed */}
        <div className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Scrollable Artists Container */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-20">
          <div className="flex flex-wrap gap-2">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => {
                const isSelected = selectedArtists.includes(artist.id);
                return (
                  <button
                    key={artist.id}
                    onClick={() => onToggleArtist(artist.id)}
                    className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 flex items-center gap-1.5 ${isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {artist.name}
                  </button>
                );
              })
            ) : (
              <div className="w-full text-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">
                  No se encontraron artistas con "{searchQuery}"
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
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
