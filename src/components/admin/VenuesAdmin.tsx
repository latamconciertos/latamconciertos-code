import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useAdminVenues,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue
} from '@/hooks/queries/useAdminVenues';
import { venueSchema } from '@/lib/validation';
import type { Venue } from '@/types/entities';
import { VenuesTable } from './venues/VenuesTable';
import { CountriesTable } from './venues/CountriesTable';
import { CitiesTable } from './venues/CitiesTable';
import { VenueFormDialog } from './venues/VenueFormDialog';
import type { Country, City, VenueFormData } from './venues/types';

export const VenuesAdmin = () => {
  // React Query hooks for venues
  const { data: venues = [], isLoading: venuesLoading } = useAdminVenues();
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();

  // Local state for countries and cities
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);

  useEffect(() => {
    fetchCountries();
    fetchCities();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');

    if (!error) {
      setCountries(data || []);
    }
  };

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (!error) {
      setCities(data || []);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleVenueSubmit = async (formData: VenueFormData) => {
    const venueData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
      capacity: formData.capacity || null,
    };

    // Validate with Zod
    const validation = venueSchema.safeParse(venueData);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      toast.error(`Error de validación: ${errors}`);
      return;
    }

    try {
      if (editingVenue) {
        await updateVenue.mutateAsync({
          id: editingVenue.id,
          data: {
            name: validation.data.name,
            slug: validation.data.slug || '',
            location: validation.data.location || null,
            capacity: validation.data.capacity ?? null,
            website: validation.data.website || null,
            city_id: validation.data.city_id || null,
            country: validation.data.country || null,
          }
        });
      } else {
        await createVenue.mutateAsync({
          name: validation.data.name,
          slug: validation.data.slug || '',
          location: validation.data.location || null,
          capacity: validation.data.capacity ?? null,
          website: validation.data.website || null,
          city_id: validation.data.city_id || null,
          country: validation.data.country || null,
        });
      }
      resetVenueForm();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setShowVenueForm(true);
  };

  const handleDeleteVenue = (venue: Venue) => {
    setDeleteTarget(venue);
  };

  const confirmDeleteVenue = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVenue.mutateAsync(deleteTarget.id);
    } catch (error) {
      // Error handled by mutation hook
    }
    setDeleteTarget(null);
  };

  const resetVenueForm = () => {
    setEditingVenue(null);
    setShowVenueForm(false);
  };

  const handleCreateCountry = async (data: { name: string; iso_code: string }) => {
    const { error } = await supabase
      .from('countries')
      .insert([{ ...data, continent: 'South America' }]);

    if (error) {
      toast.error('No se pudo crear el país');
    } else {
      toast.success('País creado correctamente');
      fetchCountries();
    }
  };

  const handleCreateCity = async (data: { name: string; country_id: string }) => {
    const { error } = await supabase
      .from('cities')
      .insert([{ ...data, slug: generateSlug(data.name) }]);

    if (error) {
      toast.error('No se pudo crear la ciudad');
    } else {
      toast.success('Ciudad creada correctamente');
      fetchCities();
    }
  };

  if (venuesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando venues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Venues</h2>
          <p className="text-muted-foreground">Administra venues, países y ciudades</p>
        </div>
        <Button onClick={() => setShowVenueForm(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Venue
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="venues" className="w-full">
        <TabsList>
          <TabsTrigger value="venues">Venues ({(venues ?? []).length})</TabsTrigger>
          <TabsTrigger value="countries">Países ({countries.length})</TabsTrigger>
          <TabsTrigger value="cities">Ciudades ({cities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4 mt-6">
          <VenuesTable
            venues={venues as any}
            cities={cities}
            countries={countries}
            onEdit={handleEditVenue as any}
            onDelete={handleDeleteVenue as any}
          />
        </TabsContent>

        <TabsContent value="countries" className="space-y-4 mt-6">
          <CountriesTable
            countries={countries}
            cities={cities}
            onCreateCountry={handleCreateCountry}
          />
        </TabsContent>

        <TabsContent value="cities" className="space-y-4 mt-6">
          <CitiesTable
            cities={cities}
            countries={countries}
            venues={venues as any}
            onCreateCity={handleCreateCity}
          />
        </TabsContent>
      </Tabs>

      {/* Venue Form Dialog */}
      <VenueFormDialog
        open={showVenueForm}
        onClose={resetVenueForm}
        venue={editingVenue as any}
        cities={cities}
        onSubmit={handleVenueSubmit}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venue?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El venue{' '}
              <strong>&quot;{deleteTarget?.name}&quot;</strong> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVenue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};