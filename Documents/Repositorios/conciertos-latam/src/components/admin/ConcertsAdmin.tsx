import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Music, Search, X, Star, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { SetlistManager } from './SetlistManager';
import { TicketPriceExtractor } from './TicketPriceExtractor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  useAdminConcerts, 
  useCreateConcert, 
  useUpdateConcert, 
  useDeleteConcert,
  useToggleFeaturedConcert 
} from '@/hooks/queries/useAdminConcerts';
import { concertSchema } from '@/lib/validation';
import type { Concert } from '@/types/entities';

interface Artist {
  id: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
  cities?: {
    name: string;
  };
}

interface Promoter {
  id: string;
  name: string;
}

export const ConcertsAdmin = () => {
  // React Query hooks for concerts
  const { data: concerts = [], isLoading: concertsLoading } = useAdminConcerts();
  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const deleteConcert = useDeleteConcert();
  const toggleFeaturedConcert = useToggleFeaturedConcert();

  // Local state for related entities (keep manual fetch for now)
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFestivalArtists, setSelectedFestivalArtists] = useState<string[]>([]);

  // Filtros
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArtist, setFilterArtist] = useState<string>('all');
  const [filterVenue, setFilterVenue] = useState<string>('all');
  const [filterPromoter, setFilterPromoter] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    date: '',
    image_url: '',
    ticket_url: '',
    ticket_prices_html: '',
    artist_id: '',
    venue_id: '',
    promoter_id: '',
    event_type: 'concert',
  });

  useEffect(() => {
    fetchArtists();
    fetchVenues();
    fetchPromoters();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase
      .from('artists')
      .select('id, name')
      .order('name');
    if (data) setArtists(data);
  };

  const fetchVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('id, name, cities(name)')
      .order('name');
    if (data) setVenues(data);
  };

  const fetchPromoters = async () => {
    const { data } = await supabase
      .from('promoters')
      .select('id, name')
      .order('name');
    if (data) setPromoters(data);
  };

  const generateSlug = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add timestamp to ensure uniqueness for concerts with same name
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const concertData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
    };

    // Validate with Zod
    const validation = concertSchema.safeParse(concertData);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      toast.error(`Error de validación: ${errors}`);
      return;
    }

    try {
      if (editingConcert) {
        await updateConcert.mutateAsync({ 
          id: editingConcert.id, 
          data: {
            title: validation.data.title,
            slug: validation.data.slug,
            description: validation.data.description || null,
            date: validation.data.date || null,
            image_url: validation.data.image_url || null,
            ticket_url: validation.data.ticket_url || null,
            ticket_prices_html: formData.ticket_prices_html || null,
            artist_id: validation.data.artist_id || null,
            venue_id: validation.data.venue_id || null,
            promoter_id: validation.data.promoter_id || null,
            event_type: validation.data.event_type,
            is_featured: validation.data.is_featured,
          }
        });

        // Update festival artists if it's a festival
        if (formData.event_type === 'festival') {
          await supabase
            .from('festival_artists')
            .delete()
            .eq('concert_id', editingConcert.id);

          if (selectedFestivalArtists.length > 0) {
            const festivalArtistsData = selectedFestivalArtists.map((artistId, index) => ({
              concert_id: editingConcert.id,
              artist_id: artistId,
              position: index,
            }));
            await supabase.from('festival_artists').insert(festivalArtistsData);
          }
        }
        resetForm();
      } else {
        const result = await createConcert.mutateAsync({
          title: validation.data.title,
          slug: validation.data.slug,
          description: validation.data.description || null,
          date: validation.data.date || null,
          image_url: validation.data.image_url || null,
          ticket_url: validation.data.ticket_url || null,
          ticket_prices_html: formData.ticket_prices_html || null,
          artist_id: validation.data.artist_id || null,
          venue_id: validation.data.venue_id || null,
          promoter_id: validation.data.promoter_id || null,
          event_type: validation.data.event_type,
          is_featured: validation.data.is_featured,
        });

        // Insert festival artists if it's a festival
        if (formData.event_type === 'festival' && selectedFestivalArtists.length > 0 && result) {
          const festivalArtistsData = selectedFestivalArtists.map((artistId, index) => ({
            concert_id: result.id,
            artist_id: artistId,
            position: index,
          }));
          await supabase.from('festival_artists').insert(festivalArtistsData);
        }
        resetForm();
      }
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleEdit = async (concert: Concert) => {
    setEditingConcert(concert);
    setFormData({
      title: concert.title,
      slug: concert.slug,
      description: concert.description || '',
      date: concert.date || '',
      image_url: concert.image_url || '',
      ticket_url: concert.ticket_url || '',
      ticket_prices_html: (concert as any).ticket_prices_html || '',
      artist_id: concert.artist_id || '',
      venue_id: concert.venue_id || '',
      promoter_id: concert.promoter_id || '',
      event_type: concert.event_type || 'concert',
    });

    // Load festival artists if it's a festival
    if (concert.event_type === 'festival') {
      const { data: festivalArtists } = await supabase
        .from('festival_artists')
        .select('artist_id')
        .eq('concert_id', concert.id)
        .order('position');

      if (festivalArtists) {
        setSelectedFestivalArtists(festivalArtists.map(fa => fa.artist_id));
      }
    } else {
      setSelectedFestivalArtists([]);
    }

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este concierto?')) return;

    try {
      await deleteConcert.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      date: '',
      image_url: '',
      ticket_url: '',
      ticket_prices_html: '',
      artist_id: '',
      venue_id: '',
      promoter_id: '',
      event_type: 'concert',
    });
    setSelectedFestivalArtists([]);
    setEditingConcert(null);
    setShowForm(false);
  };

  const getArtistName = (artistId: string) => {
    const artist = artists.find(a => a.id === artistId);
    return artist ? artist.name : 'N/A';
  };

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return 'N/A';
    const cityName = venue.cities?.name || '';
    return cityName ? `${venue.name} (${cityName})` : venue.name;
  };

  const toggleFestivalArtist = (artistId: string) => {
    setSelectedFestivalArtists(prev => 
      prev.includes(artistId) 
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const removeFestivalArtist = (artistId: string) => {
    setSelectedFestivalArtists(prev => prev.filter(id => id !== artistId));
  };

  const toggleFeatured = async (concertId: string, currentStatus: boolean) => {
    try {
      await toggleFeaturedConcert.mutateAsync({ id: concertId, isFeatured: !currentStatus });
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterEventType('all');
    setFilterStatus('all');
    setFilterArtist('all');
    setFilterVenue('all');
    setFilterPromoter('all');
    setFilterFeatured(null);
  };

  const handlePricesExtracted = (html: string | null) => {
    setFormData(prev => ({
      ...prev,
      ticket_prices_html: html || '',
    }));
  };

  const filteredConcerts = concerts.filter(concert => {
    // Búsqueda por texto
    const matchesSearch = concert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concert.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getArtistName(concert.artist_id).toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tipo de evento
    const matchesEventType = filterEventType === 'all' || concert.event_type === filterEventType;

    // Filtro por estado temporal
    let matchesStatus = true;
    if (filterStatus !== 'all' && concert.date) {
      const concertDate = new Date(concert.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filterStatus === 'upcoming') {
        matchesStatus = concertDate >= today;
      } else if (filterStatus === 'past') {
        matchesStatus = concertDate < today;
      }
    }

    // Filtro por artista
    const matchesArtist = filterArtist === 'all' || concert.artist_id === filterArtist;

    // Filtro por venue
    const matchesVenue = filterVenue === 'all' || concert.venue_id === filterVenue;

    // Filtro por promotor
    const matchesPromoter = filterPromoter === 'all' || concert.promoter_id === filterPromoter;

    // Filtro por destacados
    const matchesFeatured = filterFeatured === null || concert.is_featured === filterFeatured;

    return matchesSearch && matchesEventType && matchesStatus && matchesArtist && 
           matchesVenue && matchesPromoter && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Conciertos</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Concierto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, slug o artista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs">Tipo de Evento</Label>
                <Select value={filterEventType} onValueChange={setFilterEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="concert">Conciertos</SelectItem>
                    <SelectItem value="festival">Festivales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="upcoming">Próximos</SelectItem>
                    <SelectItem value="past">Pasados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Artista</Label>
                <Select value={filterArtist} onValueChange={setFilterArtist}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Venue</Label>
                <Select value={filterVenue} onValueChange={setFilterVenue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Promotor</Label>
                <Select value={filterPromoter} onValueChange={setFilterPromoter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {promoters.map((promoter) => (
                      <SelectItem key={promoter.id} value={promoter.id}>
                        {promoter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Destacados</Label>
                <Select 
                  value={filterFeatured === null ? 'all' : filterFeatured.toString()} 
                  onValueChange={(value) => setFilterFeatured(value === 'all' ? null : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Destacados</SelectItem>
                    <SelectItem value="false">No destacados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </Button>
            </div>

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredConcerts.length} de {concerts.length} conciertos
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConcert ? 'Editar Concierto' : 'Nuevo Concierto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Evento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Se genera automáticamente"
                  />
                </div>
                <div>
                  <Label htmlFor="event_type">Tipo de Evento</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, event_type: value });
                      if (value === 'concert') {
                        setSelectedFestivalArtists([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concert">Concierto</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Fecha del Evento</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                {formData.event_type === 'concert' && (
                  <div>
                    <Label htmlFor="artist">Artista</Label>
                    <Select
                      value={formData.artist_id}
                      onValueChange={(value) => setFormData({ ...formData, artist_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar artista" />
                      </SelectTrigger>
                      <SelectContent>
                        {artists.map((artist) => (
                          <SelectItem key={artist.id} value={artist.id}>
                            {artist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Select
                    value={formData.venue_id}
                    onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.cities?.name ? `${venue.name} (${venue.cities.name})` : venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="promoter">Promotor</Label>
                  <Select
                    value={formData.promoter_id}
                    onValueChange={(value) => setFormData({ ...formData, promoter_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar promotor" />
                    </SelectTrigger>
                    <SelectContent>
                      {promoters.map((promoter) => (
                        <SelectItem key={promoter.id} value={promoter.id}>
                          {promoter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.event_type === 'festival' && (
                <div>
                  <Label>Artistas del Festival</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                    {artists.map((artist) => (
                      <div key={artist.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`artist-${artist.id}`}
                          checked={selectedFestivalArtists.includes(artist.id)}
                          onCheckedChange={() => toggleFestivalArtist(artist.id)}
                        />
                        <Label
                          htmlFor={`artist-${artist.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {artist.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedFestivalArtists.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Artistas seleccionados ({selectedFestivalArtists.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFestivalArtists.map((artistId) => {
                          const artist = artists.find(a => a.id === artistId);
                          return artist ? (
                            <div
                              key={artistId}
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                            >
                              {artist.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removeFestivalArtist(artistId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_url">URL de Imagen</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ticket_url">URL de Tickets</Label>
                  <Input
                    id="ticket_url"
                    value={formData.ticket_url}
                    onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Ticket Price Extractor */}
              <TicketPriceExtractor
                ticketUrl={formData.ticket_url}
                initialPricesHtml={formData.ticket_prices_html}
                onPricesExtracted={handlePricesExtracted}
                compact
              />

              <div className="flex gap-2">
                <Button type="submit">
                  {editingConcert ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredConcerts.map((concert) => (
          <Card key={concert.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  {concert.image_url && (
                    <img
                      src={concert.image_url}
                      alt={concert.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{concert.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {concert.event_type === 'festival' ? 'Festival' : 'Concierto'}
                      </span>
                      {(concert as any).ticket_prices_html && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          Precios
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {concert.event_type === 'concert' 
                        ? `Artista: ${getArtistName(concert.artist_id)}`
                        : 'Festival con múltiples artistas'
                      } | Venue: {getVenueName(concert.venue_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fecha: {concert.date ? concert.date.split('-').reverse().join('/') : 'N/A'}
                    </p>
                    {concert.description && (
                      <p className="text-sm mt-2 max-w-md">{concert.description.slice(0, 150)}...</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={concert.is_featured ? "default" : "outline"}
                    onClick={() => toggleFeatured(concert.id, concert.is_featured)}
                    title={concert.is_featured ? "Quitar de destacados" : "Marcar como destacado"}
                  >
                    <Star className={`w-4 h-4 ${concert.is_featured ? 'fill-current' : ''}`} />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Music className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Gestionar Setlist</DialogTitle>
                      </DialogHeader>
                      <SetlistManager concertId={concert.id} concertTitle={concert.title} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(concert)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(concert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
