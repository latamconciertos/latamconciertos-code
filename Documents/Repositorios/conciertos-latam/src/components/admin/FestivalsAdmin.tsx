/**
 * Festivals Admin Component
 * 
 * Main admin panel for festival management.
 * Orchestrates the festival form, list, filters, and lineup manager.
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  useAdminFestivals,
  useCreateFestival,
  useUpdateFestival,
  useDeleteFestival,
  useToggleFeaturedFestival,
} from '@/hooks/queries/useAdminFestivals';
import { 
  FestivalForm,
  FestivalCard,
  FestivalFilters,
  FestivalLineupManager,
  DEFAULT_FILTERS,
} from './festivals';
import type { FestivalFiltersState } from './festivals';
import type { Festival, FestivalWithRelations, FestivalFormData } from '@/types/entities/festival';
import { festivalSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
  cities?: { name: string } | null;
}

interface Promoter {
  id: string;
  name: string;
}

export function FestivalsAdmin() {
  // Query hooks
  const { data: festivals = [], isLoading: festivalsLoading } = useAdminFestivals();
  const createFestival = useCreateFestival();
  const updateFestival = useUpdateFestival();
  const deleteFestival = useDeleteFestival();
  const toggleFeatured = useToggleFeaturedFestival();

  // Local state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFestival, setEditingFestival] = useState<FestivalWithRelations | null>(null);
  const [lineupFestival, setLineupFestival] = useState<FestivalWithRelations | null>(null);
  const [filters, setFilters] = useState<FestivalFiltersState>(DEFAULT_FILTERS);

  useEffect(() => {
    fetchVenues();
    fetchPromoters();
  }, []);

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

  // Filter festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter((festival) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!festival.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && festival.start_date) {
        const today = new Date().toISOString().split('T')[0];
        if (filters.status === 'upcoming' && festival.start_date < today) return false;
        if (filters.status === 'past' && festival.start_date >= today) return false;
      }

      // Venue filter
      if (filters.venueId !== 'all' && festival.venue_id !== filters.venueId) {
        return false;
      }

      // Promoter filter
      if (filters.promoterId !== 'all' && festival.promoter_id !== filters.promoterId) {
        return false;
      }

      // Featured filter
      if (filters.featured !== 'all') {
        const isFeatured = filters.featured === 'true';
        if (festival.is_featured !== isFeatured) return false;
      }

      return true;
    });
  }, [festivals, filters]);

  const handleSubmit = async (formData: FestivalFormData) => {
    // Validate with Zod
    const validation = festivalSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      toast.error(`Error de validación: ${errors}`);
      return;
    }

    const data = {
      name: validation.data.name,
      slug: validation.data.slug || '',
      description: validation.data.description || null,
      start_date: validation.data.start_date,
      end_date: validation.data.end_date || null,
      venue_id: validation.data.venue_id || null,
      promoter_id: validation.data.promoter_id || null,
      image_url: validation.data.image_url || null,
      ticket_url: validation.data.ticket_url || null,
      edition: validation.data.edition || null,
      is_featured: validation.data.is_featured || false,
    };

    try {
      if (editingFestival) {
        await updateFestival.mutateAsync({ id: editingFestival.id, data });
      } else {
        await createFestival.mutateAsync(data);
      }
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (festival: FestivalWithRelations) => {
    setEditingFestival(festival);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este festival? Esta acción también eliminará todo el lineup.')) return;
    
    try {
      await deleteFestival.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleFeatured.mutateAsync({ id, isFeatured });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingFestival(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Gestión de Festivales</h2>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Festival
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <FestivalForm
          festival={editingFestival}
          venues={venues}
          promoters={promoters}
          isLoading={createFestival.isPending || updateFestival.isPending}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      {/* Filters */}
      {!showForm && (
        <FestivalFilters
          filters={filters}
          venues={venues}
          promoters={promoters}
          totalCount={festivals.length}
          filteredCount={filteredFestivals.length}
          onFiltersChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      {/* List */}
      {!showForm && (
        <div className="space-y-4">
          {festivalsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFestivals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron festivales</p>
              {festivals.length === 0 && (
                <Button 
                  className="mt-4" 
                  onClick={() => setShowForm(true)}
                >
                  Crear el primer festival
                </Button>
              )}
            </div>
          ) : (
            filteredFestivals.map((festival) => (
              <FestivalCard
                key={festival.id}
                festival={festival}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
                onManageLineup={setLineupFestival}
                isDeleting={deleteFestival.isPending}
                isTogglingFeatured={toggleFeatured.isPending}
              />
            ))
          )}
        </div>
      )}

      {/* Lineup Manager Dialog */}
      <FestivalLineupManager
        festival={lineupFestival}
        open={!!lineupFestival}
        onClose={() => setLineupFestival(null)}
      />
    </div>
  );
}

export default FestivalsAdmin;
