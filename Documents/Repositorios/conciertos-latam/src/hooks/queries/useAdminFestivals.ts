/**
 * Admin Festival Hooks
 * 
 * React Query hooks for festival management in admin panel.
 * Includes CRUD operations and lineup management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { festivalQueryKeys } from './useFestivals';
import type { 
  FestivalFilterOptions, 
  FestivalInsert, 
  FestivalUpdate,
  FestivalLineupInsert,
} from '@/types/entities/festival';
import { toast } from 'sonner';

/**
 * Fetch all festivals for admin (includes all statuses)
 */
export function useAdminFestivals(options?: FestivalFilterOptions) {
  return useQuery({
    queryKey: festivalQueryKeys.list({ ...options, status: options?.status || 'all' }),
    queryFn: async () => {
      const result = await festivalService.getAll(options);
      if (!result.success) throw new Error(result.error || 'Error fetching festivals');
      return result.data;
    },
  });
}

/**
 * Fetch a single festival by ID for editing
 */
export function useAdminFestival(id: string | undefined) {
  return useQuery({
    queryKey: [...festivalQueryKeys.all, 'admin', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await festivalService.getById(id);
      if (!result.success) throw new Error(result.error || 'Festival not found');
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new festival
 */
export function useCreateFestival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FestivalInsert) => {
      const result = await festivalService.create(data);
      if (!result.success) throw new Error(result.error || 'Error creating festival');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.all });
      toast.success('Festival creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear festival: ${error.message}`);
    },
  });
}

/**
 * Update an existing festival
 */
export function useUpdateFestival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FestivalUpdate }) => {
      const result = await festivalService.update(id, data);
      if (!result.success) throw new Error(result.error || 'Error updating festival');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.all });
      toast.success('Festival actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar festival: ${error.message}`);
    },
  });
}

/**
 * Delete a festival
 */
export function useDeleteFestival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await festivalService.delete(id);
      if (!result.success) throw new Error(result.error || 'Error deleting festival');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.all });
      toast.success('Festival eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar festival: ${error.message}`);
    },
  });
}

/**
 * Toggle featured status
 */
export function useToggleFeaturedFestival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const result = await festivalService.toggleFeatured(id, isFeatured);
      if (!result.success) throw new Error(result.error || 'Error updating featured status');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.all });
      toast.success(variables.isFeatured ? 'Festival marcado como destacado' : 'Festival removido de destacados');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// =========================================================================
// Lineup Management Hooks
// =========================================================================

/**
 * Fetch festival lineup for admin
 */
export function useAdminFestivalLineup(festivalId: string | undefined) {
  return useQuery({
    queryKey: festivalQueryKeys.lineup(festivalId || ''),
    queryFn: async () => {
      if (!festivalId) return [];
      const result = await festivalService.getLineup(festivalId);
      if (!result.success) throw new Error(result.error || 'Error fetching lineup');
      return result.data;
    },
    enabled: !!festivalId,
  });
}

/**
 * Add artist to lineup
 */
export function useAddToLineup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FestivalLineupInsert) => {
      const result = await festivalService.addToLineup(data);
      if (!result.success) throw new Error(result.error || 'Error adding to lineup');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.lineup(variables.festival_id) });
      toast.success('Artista agregado al lineup');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Update lineup item
 */
export function useUpdateLineupItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, festivalId, data }: { id: string; festivalId: string; data: Partial<FestivalLineupInsert> }) => {
      const result = await festivalService.updateLineupItem(id, data);
      if (!result.success) throw new Error(result.error || 'Error updating lineup item');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.lineup(variables.festivalId) });
      toast.success('Lineup actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Remove artist from lineup
 */
export function useRemoveFromLineup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, festivalId }: { id: string; festivalId: string }) => {
      const result = await festivalService.removeFromLineup(id);
      if (!result.success) throw new Error(result.error || 'Error removing from lineup');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.lineup(variables.festivalId) });
      toast.success('Artista removido del lineup');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Reorder lineup
 */
export function useReorderLineup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ festivalId, items }: { festivalId: string; items: { id: string; position: number }[] }) => {
      const result = await festivalService.reorderLineup(festivalId, items);
      if (!result.success) throw new Error(result.error || 'Error reordering lineup');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: festivalQueryKeys.lineup(variables.festivalId) });
      toast.success('Orden actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
