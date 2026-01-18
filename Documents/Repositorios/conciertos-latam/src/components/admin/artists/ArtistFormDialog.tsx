import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { spotifyService, type SpotifyArtist } from '@/lib/spotify';
import type { Artist, ArtistFormData } from './types';

interface ArtistFormDialogProps {
    open: boolean;
    onClose: () => void;
    artist: Artist | null;
    formData: ArtistFormData;
    onFormDataChange: (data: ArtistFormData) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    validationErrors: Record<string, string>;
}

export const ArtistFormDialog = ({
    open,
    onClose,
    artist,
    formData,
    onFormDataChange,
    onSubmit,
    isSubmitting,
    validationErrors,
}: ArtistFormDialogProps) => {
    const [spotifySearch, setSpotifySearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
    const [isExtractingGenres, setIsExtractingGenres] = useState(false);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleExtractGenres = async () => {
        if (!formData.name) {
            toast.error('El artista debe tener un nombre');
            return;
        }

        setIsExtractingGenres(true);
        try {
            console.log('Extrayendo géneros para:', formData.name);
            const artistData = await spotifyService.getArtistData(formData.name);
            console.log('Datos recibidos de Spotify:', artistData);

            if (artistData && artistData.genres && artistData.genres.length > 0) {
                onFormDataChange({
                    ...formData,
                    genres: artistData.genres,
                });
                toast.success(`Se encontraron ${artistData.genres.length} géneros: ${artistData.genres.slice(0, 3).join(', ')}${artistData.genres.length > 3 ? '...' : ''}`);
            } else if (artistData) {
                // Artist found but no genres
                toast.warning(`Artista encontrado en Spotify pero sin géneros asignados`);
            } else {
                // Artist not found
                toast.error(`No se encontró "${formData.name}" en Spotify. Intenta con el nombre exacto del artista.`);
            }
        } catch (error) {
            console.error('Error al extraer géneros:', error);
            toast.error('Error al conectar con Spotify. Intenta nuevamente.');
        } finally {
            setIsExtractingGenres(false);
        }
    };

    const handleSpotifySearch = async () => {
        if (!spotifySearch.trim()) {
            toast.error('Ingresa un nombre para buscar');
            return;
        }

        setIsSearching(true);
        setSearchResults([]);

        try {
            const results = await spotifyService.searchArtists(spotifySearch);

            if (results.length === 0) {
                toast.error('No se encontraron artistas en Spotify');
            } else if (results.length === 1) {
                // Auto-select if only one result
                handleArtistSelect(results[0]);
                toast.success(`Artista "${results[0].name}" encontrado en Spotify`);
            } else {
                // Show multiple results for user to choose
                setSearchResults(results);
                toast.success(`Se encontraron ${results.length} artistas`);
            }
        } catch (error) {
            toast.error('Error al buscar en Spotify. Verifica la conexión.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleArtistSelect = (artist: SpotifyArtist) => {
        const imageUrl = artist.images[0]?.url || '';

        onFormDataChange({
            ...formData,
            name: artist.name,
            slug: generateSlug(artist.name),
            photo_url: imageUrl,
            genres: artist.genres || [],
        });

        setSearchResults([]);
        setSpotifySearch('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {artist ? 'Editar Artista' : 'Nuevo Artista'}
                    </DialogTitle>
                </DialogHeader>

                {/* Spotify Search Section */}
                {!artist && (
                    <>
                        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                            <Label className="text-base font-semibold">Buscar en Spotify</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Buscar artista en Spotify..."
                                    value={spotifySearch}
                                    onChange={(e) => setSpotifySearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSpotifySearch();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleSpotifySearch}
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Busca un artista para cargar automáticamente su foto desde Spotify
                            </p>
                        </div>

                        {/* Artist Selection Grid */}
                        {searchResults.length > 0 && (
                            <div className="mb-6 p-4 border rounded-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                                <Label className="text-base font-semibold mb-3 block">
                                    Selecciona el artista correcto ({searchResults.length} resultados)
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                    {searchResults.map((artist) => (
                                        <div
                                            key={artist.id}
                                            onClick={() => handleArtistSelect(artist)}
                                            className="group relative p-3 border rounded-lg bg-background/80 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50 hover:bg-gradient-to-br hover:from-purple-100/30 hover:to-blue-100/30 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Artist Image */}
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={artist.images[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'}
                                                        alt={artist.name}
                                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
                                                        }}
                                                    />
                                                    {artist.popularity && artist.popularity > 70 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                                            ⭐
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Artist Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                        {artist.name}
                                                    </h4>

                                                    {/* Popularity */}
                                                    {artist.popularity !== undefined && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                                    style={{ width: `${artist.popularity}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                {artist.popularity}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Genres */}
                                                    {artist.genres && artist.genres.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {artist.genres.slice(0, 2).map((genre, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium"
                                                                >
                                                                    {genre}
                                                                </span>
                                                            ))}
                                                            {artist.genres.length > 2 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{artist.genres.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover overlay indicator */}
                                            <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Manual Form */}
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <Label htmlFor="name">Nombre del Artista *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                                required
                                className={validationErrors.name ? 'border-destructive' : ''}
                            />
                            {validationErrors.name && (
                                <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
                            )}
                        </div>

                        {/* Slug */}
                        <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => onFormDataChange({ ...formData, slug: e.target.value })}
                                placeholder="Se genera automáticamente"
                                className={validationErrors.slug ? 'border-destructive' : ''}
                            />
                            {validationErrors.slug && (
                                <p className="text-sm text-destructive mt-1">{validationErrors.slug}</p>
                            )}
                        </div>
                    </div>

                    {/* Photo URL */}
                    <div>
                        <Label htmlFor="photo_url">URL de Foto</Label>
                        <Input
                            id="photo_url"
                            value={formData.photo_url}
                            onChange={(e) => onFormDataChange({ ...formData, photo_url: e.target.value })}
                            placeholder="https://..."
                            className={validationErrors.photo_url ? 'border-destructive' : ''}
                        />
                        {validationErrors.photo_url && (
                            <p className="text-sm text-destructive mt-1">{validationErrors.photo_url}</p>
                        )}
                        {formData.photo_url && (
                            <div className="mt-2">
                                <img
                                    src={formData.photo_url}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Géneros Musicales */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                Géneros Musicales
                            </Label>
                            {artist && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExtractGenres}
                                    disabled={isExtractingGenres}
                                >
                                    {isExtractingGenres ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Music className="w-4 h-4 mr-2" />
                                    )}
                                    Extraer de Spotify
                                </Button>
                            )}
                        </div>

                        {formData.genres && formData.genres.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {formData.genres.map((genre, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {artist
                                    ? 'Haz clic en "Extraer de Spotify" para obtener los géneros del artista'
                                    : 'Los géneros se cargarán automáticamente al seleccionar un artista de Spotify'}
                            </p>
                        )}
                    </div>

                    {/* Bio */}
                    <div>
                        <Label htmlFor="bio">Biografía</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => onFormDataChange({ ...formData, bio: e.target.value })}
                            rows={4}
                            placeholder="Breve biografía del artista..."
                            className={validationErrors.bio ? 'border-destructive' : ''}
                        />
                        {validationErrors.bio && (
                            <p className="text-sm text-destructive mt-1">{validationErrors.bio}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {artist ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
