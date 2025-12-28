import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Search, Loader2 } from 'lucide-react';
import { spotifyService } from '@/lib/spotify';
import { 
  useAdminArtists, 
  useCreateArtist, 
  useUpdateArtist, 
  useDeleteArtist 
} from '@/hooks/queries/useAdminArtists';
import { artistSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import type { ArtistFormData } from '@/types/entities';

export const ArtistsAdmin = () => {
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [spotifySearch, setSpotifySearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // React Query hooks
  const { data: artists = [], isLoading } = useAdminArtists();
  const createArtist = useCreateArtist();
  const updateArtist = useUpdateArtist();
  const deleteArtist = useDeleteArtist();

  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    slug: '',
    bio: '',
    photo_url: '',
    social_links: {},
  });

  const searchSpotifyArtists = async () => {
    if (!spotifySearch.trim()) return;

    try {
      const imageUrl = await spotifyService.getArtistImage(spotifySearch);
      
      if (imageUrl && !imageUrl.includes('unsplash')) {
        setFormData({
          ...formData,
          name: spotifySearch,
          slug: generateSlug(spotifySearch),
          photo_url: imageUrl,
        });
        
        toast({
          title: "Artista encontrado",
          description: `Imagen de ${spotifySearch} cargada desde Spotify`,
        });
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontró el artista en Spotify",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar en Spotify. Verifica la conexión.",
        variant: "destructive",
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    const artistData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    };

    // Zod validation
    try {
      artistSchema.parse(artistData);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: 'Error de validación',
          description: 'Por favor corrige los errores en el formulario',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // Validate unique slug
      const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('slug', artistData.slug)
        .limit(1)
        .maybeSingle();

      if (!editingArtistId && existing) {
        toast({
          title: 'Slug duplicado',
          description: 'Ya existe un artista con ese slug. Cambia el slug o el nombre.',
          variant: 'destructive',
        });
        return;
      }

      if (editingArtistId && existing && existing.id !== editingArtistId) {
        toast({
          title: 'Slug en uso',
          description: 'Ese slug pertenece a otro artista.',
          variant: 'destructive',
        });
        return;
      }

      if (editingArtistId) {
        await updateArtist.mutateAsync({ 
          id: editingArtistId, 
          data: artistData 
        });
      } else {
        await createArtist.mutateAsync(artistData);
      }
      
      resetForm();
    } catch (err: any) {
      // Error handling is done in the mutation hooks
      console.error('Error creando/actualizando artista:', err);
    }
  };

  const handleEdit = (artist: typeof artists[0]) => {
    setEditingArtistId(artist.id);
    setFormData({
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio || '',
      photo_url: artist.photo_url || '',
      social_links: artist.social_links || {},
    });
    setShowForm(true);
    setValidationErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artista?')) return;
    
    try {
      await deleteArtist.mutateAsync(id);
    } catch (err) {
      // Error handling is done in the mutation hook
      console.error('Error eliminando artista:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      bio: '',
      photo_url: '',
      social_links: {},
    });
    setEditingArtistId(null);
    setShowForm(false);
    setValidationErrors({});
  };

  const filteredArtists = artists.filter(artist => 
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSubmitting = createArtist.isPending || updateArtist.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Artistas</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Artista
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingArtistId ? 'Editar Artista' : 'Nuevo Artista'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Spotify Search */}
            <div className="mb-6 p-4 border rounded-lg">
              <Label>Buscar en Spotify</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Buscar artista en Spotify..."
                  value={spotifySearch}
                  onChange={(e) => setSpotifySearch(e.target.value)}
                />
                <Button type="button" onClick={searchSpotifyArtists}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Busca un artista para cargar automáticamente su foto desde Spotify
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Artista</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={validationErrors.name ? 'border-destructive' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Se genera automáticamente"
                    className={validationErrors.slug ? 'border-destructive' : ''}
                  />
                  {validationErrors.slug && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.slug}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="photo_url">URL de Foto</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className={validationErrors.photo_url ? 'border-destructive' : ''}
                />
                {validationErrors.photo_url && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.photo_url}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className={validationErrors.bio ? 'border-destructive' : ''}
                />
                {validationErrors.bio && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.bio}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingArtistId ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredArtists.map((artist) => (
            <Card key={artist.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    {artist.photo_url && (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Slug: {artist.slug}
                      </p>
                      {artist.bio && (
                        <p className="text-sm mt-2 max-w-md">{artist.bio.slice(0, 150)}...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(artist)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(artist.id)}
                      disabled={deleteArtist.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
