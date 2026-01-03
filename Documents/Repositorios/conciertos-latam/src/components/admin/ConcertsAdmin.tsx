import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminConcerts,
  useCreateConcert,
  useUpdateConcert,
  useDeleteConcert,
  useToggleFeaturedConcert
} from '@/hooks/queries/useAdminConcerts';
import { concertSchema } from '@/lib/validation';
import { ConcertsTable } from './concerts/ConcertsTable';
import { ConcertsFilters } from './concerts/ConcertsFilters';
import { ConcertFormDialog, type ConcertFormData } from './concerts/ConcertFormDialog';
import type { Concert, Artist, Venue, Promoter, ConcertFilters } from './concerts/types';

export const ConcertsAdmin = () => {
  // React Query hooks for concerts
  const { data: concerts = [], isLoading: concertsLoading } = useAdminConcerts();
  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const deleteConcert = useDeleteConcert();
  const toggleFeaturedConcert = useToggleFeaturedConcert();

  // Local state for related entities
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFestivalArtists, setSelectedFestivalArtists] = useState<string[]>([]);

  // Filters state
  const [filters, setFilters] = useState<ConcertFilters>({
    search: '',
    eventType: 'all',
    status: 'all',
    artistId: 'all',
    venueId: 'all',
    promoterId: 'all',
    featured: null,
  });

  useEffect(() => {
    fetchArtists();
    fetchVenues();
    fetchPromoters();
    fetchCities();
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

  const fetchCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('id, name')
      .order('name');
    if (data) setCities(data);
  };

  const generateSlug = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  };

  const handleSubmit = async (formData: ConcertFormData) => {
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
    try {
      await deleteConcert.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const resetForm = () => {
    setSelectedFestivalArtists([]);
    setEditingConcert(null);
    setShowForm(false);
  };

  const toggleFeatured = async (concertId: string, currentStatus: boolean) => {
    try {
      await toggleFeaturedConcert.mutateAsync({ id: concertId, isFeatured: !currentStatus });
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleFilterChange = (newFilters: Partial<ConcertFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      eventType: 'all',
      status: 'all',
      artistId: 'all',
      venueId: 'all',
      promoterId: 'all',
      featured: null,
    });
  };

  const getArtistName = (artistId: string | null) => {
    if (!artistId) return 'N/A';
    const artist = artists.find(a => a.id === artistId);
    return artist ? artist.name : 'N/A';
  };

  // Filter concerts
  const filteredConcerts = concerts.filter(concert => {
    // Search
    const matchesSearch = concert.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      concert.slug.toLowerCase().includes(filters.search.toLowerCase()) ||
      getArtistName(concert.artist_id).toLowerCase().includes(filters.search.toLowerCase());

    // Event type
    const matchesEventType = filters.eventType === 'all' || concert.event_type === filters.eventType;

    // Status
    let matchesStatus = true;
    if (filters.status !== 'all' && concert.date) {
      const concertDate = new Date(concert.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.status === 'upcoming') {
        matchesStatus = concertDate >= today;
      } else if (filters.status === 'past') {
        matchesStatus = concertDate < today;
      }
    }

    // Artist
    const matchesArtist = filters.artistId === 'all' || concert.artist_id === filters.artistId;

    // Venue
    const matchesVenue = filters.venueId === 'all' || concert.venue_id === filters.venueId;

    // Promoter
    const matchesPromoter = filters.promoterId === 'all' || concert.promoter_id === filters.promoterId;

    // Featured
    const matchesFeatured = filters.featured === null || concert.is_featured === filters.featured;

    return matchesSearch && matchesEventType && matchesStatus && matchesArtist &&
      matchesVenue && matchesPromoter && matchesFeatured;
  });

  if (concertsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando conciertos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Conciertos</h2>
          <p className="text-muted-foreground mt-1">
            Administra eventos, conciertos y festivales
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Concierto
        </Button>
      </div>

      {/* Filters */}
      <ConcertsFilters
        filters={filters}
        artists={artists}
        venues={venues}
        promoters={promoters}
        totalConcerts={concerts.length}
        filteredCount={filteredConcerts.length}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      {/* Table */}
      <ConcertsTable
        concerts={filteredConcerts as Concert[]}
        artists={artists}
        venues={venues}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleFeatured={toggleFeatured}
      />

      {/* Form Dialog */}
      <ConcertFormDialog
        open={showForm}
        onClose={resetForm}
        concert={editingConcert}
        artists={artists}
        venues={venues}
        promoters={promoters}
        cities={cities}
        onSubmit={handleSubmit}
        selectedFestivalArtists={selectedFestivalArtists}
        onFestivalArtistsChange={setSelectedFestivalArtists}
        onRefetchArtists={fetchArtists}
        onRefetchVenues={fetchVenues}
        onRefetchPromoters={fetchPromoters}
      />
    </div>
  );
};
