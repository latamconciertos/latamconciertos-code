import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  useAdminVenues, 
  useCreateVenue, 
  useUpdateVenue, 
  useDeleteVenue 
} from '@/hooks/queries/useAdminVenues';
import { venueSchema } from '@/lib/validation';
import type { Venue } from '@/types/entities';

interface Country {
  id: string;
  name: string;
  iso_code: string;
}

interface City {
  id: string;
  name: string;
  country_id: string;
}

export const VenuesAdmin = () => {
  // React Query hooks for venues
  const { data: venues = [], isLoading: venuesLoading } = useAdminVenues();
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();

  // Local state for countries and cities (not migrated yet)
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Country and City forms (keep as-is for now)
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);
  const [countryForm, setCountryForm] = useState({ name: '', iso_code: '' });
  const [cityForm, setCityForm] = useState({ name: '', country_id: '' });

  const [venueForm, setVenueForm] = useState({
    name: '',
    slug: '',
    location: '',
    capacity: 0,
    website: '',
    country: '',
    city_id: '',
  });

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

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const venueData = {
      ...venueForm,
      slug: venueForm.slug || generateSlug(venueForm.name),
      capacity: venueForm.capacity || null,
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
            slug: validation.data.slug,
            location: validation.data.location || null,
            capacity: validation.data.capacity,
            website: validation.data.website || null,
            city_id: validation.data.city_id || null,
            country: validation.data.country || null,
          }
        });
      } else {
        await createVenue.mutateAsync({
          name: validation.data.name,
          slug: validation.data.slug,
          location: validation.data.location || null,
          capacity: validation.data.capacity,
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

  const handleCountrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('countries')
      .insert([{ ...countryForm, continent: 'South America' }]);

    if (error) {
      toast.error('No se pudo crear el país');
    } else {
      toast.success('País creado correctamente');
      setCountryForm({ name: '', iso_code: '' });
      setShowCountryForm(false);
      fetchCountries();
    }
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const generateCitySlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    const { error } = await supabase
      .from('cities')
      .insert([{ ...cityForm, slug: generateCitySlug(cityForm.name) }]);

    if (error) {
      toast.error('No se pudo crear la ciudad');
    } else {
      toast.success('Ciudad creada correctamente');
      setCityForm({ name: '', country_id: '' });
      setShowCityForm(false);
      fetchCities();
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setVenueForm({
      name: venue.name,
      slug: venue.slug,
      location: venue.location || '',
      capacity: venue.capacity || 0,
      website: venue.website || '',
      country: venue.country || '',
      city_id: venue.city_id || '',
    });
    setShowVenueForm(true);
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este venue?')) return;

    try {
      await deleteVenue.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const resetVenueForm = () => {
    setVenueForm({
      name: '',
      slug: '',
      location: '',
      capacity: 0,
      website: '',
      country: '',
      city_id: '',
    });
    setEditingVenue(null);
    setShowVenueForm(false);
  };

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venue.location && venue.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Venues</h2>

      <Tabs defaultValue="venues" className="w-full">
        <TabsList>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="countries">Países</TabsTrigger>
          <TabsTrigger value="cities">Ciudades</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Venues</h3>
            <Button onClick={() => setShowVenueForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Venue
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

          {showVenueForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingVenue ? 'Editar Venue' : 'Nuevo Venue'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenueSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del Venue</Label>
                      <Input
                        id="name"
                        value={venueForm.name}
                        onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={venueForm.slug}
                        onChange={(e) => setVenueForm({ ...venueForm, slug: e.target.value })}
                        placeholder="Se genera automáticamente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={venueForm.location}
                        onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={venueForm.capacity}
                        onChange={(e) => setVenueForm({ ...venueForm, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input
                        id="website"
                        value={venueForm.website}
                        onChange={(e) => setVenueForm({ ...venueForm, website: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Select
                        value={venueForm.city_id}
                        onValueChange={(value) => setVenueForm({ ...venueForm, city_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingVenue ? 'Actualizar' : 'Crear'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetVenueForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {filteredVenues.map((venue) => (
              <Card key={venue.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {venue.location} | Capacidad: {venue.capacity || 'N/A'}
                      </p>
                      {venue.website && (
                        <p className="text-sm text-blue-600">{venue.website}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                       <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditVenue(venue)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVenue(venue.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Países</h3>
            <Button onClick={() => setShowCountryForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo País
            </Button>
          </div>

          {showCountryForm && (
            <Card>
              <CardHeader>
                <CardTitle>Nuevo País</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCountrySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country_name">Nombre del País</Label>
                      <Input
                        id="country_name"
                        value={countryForm.name}
                        onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="iso_code">Código ISO</Label>
                      <Input
                        id="iso_code"
                        value={countryForm.iso_code}
                        onChange={(e) => setCountryForm({ ...countryForm, iso_code: e.target.value })}
                        required
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Crear</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCountryForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {countries.map((country) => (
              <Card key={country.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{country.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Código ISO: {country.iso_code}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Ciudades</h3>
            <Button onClick={() => setShowCityForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Ciudad
            </Button>
          </div>

          {showCityForm && (
            <Card>
              <CardHeader>
                <CardTitle>Nueva Ciudad</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city_name">Nombre de la Ciudad</Label>
                      <Input
                        id="city_name"
                        value={cityForm.name}
                        onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Select
                        value={cityForm.country_id}
                        onValueChange={(value) => setCityForm({ ...cityForm, country_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar país" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Crear</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCityForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {cities.map((city) => {
              const country = countries.find(c => c.id === city.country_id);
              return (
                <Card key={city.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{city.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          País: {country?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};