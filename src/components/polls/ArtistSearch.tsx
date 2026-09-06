import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Plus, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { spotifyService, type SpotifyArtist } from '@/lib/spotify';
import { cn } from '@/lib/utils';

export interface ArtistPick {
  name: string;
  spotify_id: string | null;
  image_url: string | null;
}

interface ArtistSearchProps {
  disabled?: boolean;
  excludeSpotifyIds: string[];
  placeholder?: string;
  onSelect: (pick: ArtistPick) => void;
}

export const ArtistSearch = ({ disabled, excludeSpotifyIds, placeholder, onSelect }: ArtistSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    const id = ++requestId.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      const found = await spotifyService.searchArtists(q);
      if (id !== requestId.current) return;
      setResults(found.slice(0, 6));
      setSearched(true);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const reset = () => {
    requestId.current++;
    setQuery('');
    setResults([]);
    setSearched(false);
    setSearching(false);
  };

  const handleSelect = (artist: SpotifyArtist) => {
    onSelect({
      name: artist.name,
      spotify_id: artist.id,
      image_url: artist.images?.[0]?.url ?? null,
    });
    reset();
  };

  const handleManual = () => {
    const name = query.trim();
    if (!name) return;
    onSelect({ name, spotify_id: null, image_url: null });
    reset();
  };

  const visible = results.filter((r) => !excludeSpotifyIds.includes(r.id));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-fucsia pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder={placeholder ?? 'Escribe el nombre del artista'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-14 pl-12 pr-12 text-base rounded-full bg-superficie border-linea text-texto placeholder:text-texto-2 focus-visible:ring-fucsia"
          aria-label="Buscar artista en Spotify"
        />
        {searching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-texto-2" />
        )}
      </div>

      {(visible.length > 0 || (searched && !searching)) && (
        <ul
          className="rounded-[20px] border border-linea bg-superficie overflow-hidden divide-y divide-linea"
          role="listbox"
          aria-label="Resultados de Spotify"
        >
          {visible.map((artist) => (
            <li key={artist.id}>
              <button
                type="button"
                onClick={() => handleSelect(artist)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-superficie-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fucsia focus-visible:-outline-offset-2',
                )}
              >
                {artist.images?.[0]?.url ? (
                  <img
                    src={artist.images[artist.images.length - 1]?.url ?? artist.images[0].url}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <span className="h-11 w-11 rounded-full bg-superficie-2 flex items-center justify-center shrink-0">
                    <Music className="h-5 w-5 text-texto-2" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-texto truncate">{artist.name}</span>
                  {artist.genres && artist.genres.length > 0 && (
                    <span className="block text-xs text-texto-2 truncate">
                      {artist.genres.slice(0, 2).join(' · ')}
                    </span>
                  )}
                </span>
                <Plus className="h-5 w-5 text-fucsia shrink-0" />
              </button>
            </li>
          ))}

          {searched && !searching && visible.length === 0 && (
            <li className="px-4 py-4 space-y-3">
              <p className="text-sm text-texto-2">
                No lo encontramos en Spotify. Puedes agregarlo tal cual lo escribiste.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleManual}
                className="rounded-full border-linea bg-transparent hover:bg-superficie-2 text-texto"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar «{query.trim()}»
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
