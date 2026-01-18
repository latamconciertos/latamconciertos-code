import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useAdminArtists,
  useCreateArtist,
  useUpdateArtist,
  useDeleteArtist
} from '@/hooks/queries/useAdminArtists';
import { artistSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { ArtistsTable, ArtistFormDialog, type Artist, type ArtistFormData } from './artists';

export const ArtistsAdmin = () => {
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    genres: [],
  });

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
      console.log('Validando datos del artista:', artistData);
      artistSchema.parse(artistData);
    } catch (err) {
      if (err instanceof ZodError) {
        console.error('Errores de validación:', err.errors);
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Por favor corrige los errores en el formulario');
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

      if (!editingArtist && existing) {
        toast.error('Ya existe un artista con ese slug. Cambia el slug o el nombre.');
        return;
      }

      if (editingArtist && existing && existing.id !== editingArtist.id) {
        toast.error('Ese slug pertenece a otro artista.');
        return;
      }

      if (editingArtist) {
        await updateArtist.mutateAsync({
          id: editingArtist.id,
          data: artistData
        });
      } else {
        await createArtist.mutateAsync(artistData);
      }

      resetForm();
    } catch (err: any) {
      console.error('Error creando/actualizando artista:', err);
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio || '',
      photo_url: artist.photo_url || '',
      social_links: artist.social_links || {},
      genres: artist.genres || [],
    });
    setShowForm(true);
    setValidationErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artista?')) return;

    try {
      await deleteArtist.mutateAsync(id);
    } catch (err) {
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
      genres: [],
    });
    setEditingArtist(null);
    setShowForm(false);
    setValidationErrors({});
  };

  const isSubmitting = createArtist.isPending || updateArtist.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Artistas</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Artista
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando artistas...
        </div>
      ) : (
        <ArtistsTable
          artists={artists}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Dialog */}
      <ArtistFormDialog
        open={showForm}
        onClose={resetForm}
        artist={editingArtist}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        validationErrors={validationErrors}
      />
    </div>
  );
};
