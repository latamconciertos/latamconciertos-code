import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { spotifyService } from '@/lib/spotify';
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

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSpotifySearch = async () => {
        if (!spotifySearch.trim()) {
            toast.error('Ingresa un nombre para buscar');
            return;
        }

        setIsSearching(true);

        try {
            const imageUrl = await spotifyService.getArtistImage(spotifySearch);

            if (imageUrl && !imageUrl.includes('unsplash')) {
                onFormDataChange({
                    ...formData,
                    name: spotifySearch,
                    slug: generateSlug(spotifySearch),
                    photo_url: imageUrl,
                });

                toast.success(`Artista "${spotifySearch}" encontrado en Spotify`);
            } else {
                toast.error('No se encontró el artista en Spotify');
            }
        } catch (error) {
            toast.error('Error al buscar en Spotify. Verifica la conexión.');
        } finally {
            setIsSearching(false);
        }
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
