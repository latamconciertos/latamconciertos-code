import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Search, Music } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { spotifyService, type SpotifyArtist } from '@/lib/spotify';

interface QuickCreateArtistProps {
    onArtistCreated: (artistId: string) => void;
    initialName?: string;
}

export const QuickCreateArtist = ({ onArtistCreated, initialName }: QuickCreateArtistProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        photo_url: '',
        genres: [] as string[],
    });
    const [spotifyQuery, setSpotifyQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<SpotifyArtist[]>([]);
    const [selected, setSelected] = useState<SpotifyArtist | null>(null);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const runSearch = async (query: string) => {
        if (!query.trim()) return;
        setSearching(true);
        setResults([]);
        setSelected(null);
        try {
            const found = await spotifyService.searchArtists(query.trim());
            setResults(found);
            if (!found.length) {
                toast.info('No se encontró en Spotify. Puedes crearlo manualmente.');
            }
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = (artist: SpotifyArtist) => {
        setSelected(artist);
        setFormData((f) => ({
            ...f,
            name: artist.name,
            photo_url: artist.images[0]?.url ?? '',
            genres: artist.genres ?? [],
        }));
        setResults([]);
    };

    const handleOpen = () => {
        setOpen(true);
        if (initialName && !formData.name) {
            setFormData((f) => ({ ...f, name: initialName }));
            setSpotifyQuery(initialName);
            void runSearch(initialName);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('El nombre del artista es requerido');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('artists')
                .insert([{
                    name: formData.name.trim(),
                    slug: generateSlug(formData.name),
                    bio: formData.bio.trim() || null,
                    photo_url: formData.photo_url || null,
                    genres: formData.genres.length > 0 ? formData.genres : null,
                }])
                .select()
                .single();

            if (error) throw error;

            // Invalidate React Query cache to refresh ArtistsAdmin
            queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });

            toast.success('Artista creado exitosamente');
            onArtistCreated(data.id);
            setOpen(false);
            setFormData({ name: '', bio: '', photo_url: '', genres: [] });
            setSpotifyQuery('');
            setResults([]);
            setSelected(null);
        } catch (error: any) {
            toast.error(`Error al crear artista: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpen}
                className="shrink-0 rounded-full border-linea bg-transparent hover:bg-superficie-2"
            >
                <Plus className="w-4 h-4 mr-1" />
                Nuevo
            </Button>

            <Dialog open={open} onOpenChange={setOpen} modal={false}>
                {/* max-h + scroll: los resultados de Spotify crecen dentro del
                    diálogo y sin tope lo desbordaban del viewport en pantallas bajas */}
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Crear Artista Rápido</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="rounded-[16px] border border-linea bg-superficie-2/50 p-3">
                            <Label htmlFor="quick-artist-spotify">Buscar en Spotify</Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    id="quick-artist-spotify"
                                    value={spotifyQuery}
                                    onChange={(e) => setSpotifyQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            void runSearch(spotifyQuery);
                                        }
                                    }}
                                    placeholder="Ej: Caifanes"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 rounded-full border-linea bg-transparent hover:bg-superficie-2"
                                    disabled={searching}
                                    onClick={() => void runSearch(spotifyQuery)}
                                >
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {results.length > 0 && (
                                <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                                    {results.map((artist) => (
                                        <button
                                            key={artist.id}
                                            type="button"
                                            onClick={() => handleSelect(artist)}
                                            className="flex w-full items-center gap-3 rounded-[16px] border border-linea bg-superficie p-2 text-left transition-colors hover:border-periwinkle/35"
                                        >
                                            {artist.images[0]?.url ? (
                                                <img
                                                    src={artist.images[0].url}
                                                    alt={artist.name}
                                                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-superficie-2">
                                                    <Music className="h-4 w-4 text-periwinkle" />
                                                </span>
                                            )}
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold text-texto">{artist.name}</span>
                                                <span className="block truncate text-xs text-texto-2">
                                                    {(artist.genres ?? []).slice(0, 3).join(' · ') || 'Sin géneros'}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selected && (
                                <div className="mt-2 flex items-center gap-3 rounded-[16px] border border-verde/30 bg-verde/10 p-2.5">
                                    {selected.images[0]?.url && (
                                        <img
                                            src={selected.images[0].url}
                                            alt={selected.name}
                                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-texto">{selected.name}</p>
                                        <p className="text-xs text-verde">Foto y géneros importados de Spotify</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="quick-artist-name">Nombre del Artista *</Label>
                            <Input
                                id="quick-artist-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Bad Bunny"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-artist-bio">Biografía (opcional)</Label>
                            <Textarea
                                id="quick-artist-bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Breve biografía del artista..."
                                rows={3}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground">
                            El slug se generará automáticamente a partir del nombre
                        </p>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Artista'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
