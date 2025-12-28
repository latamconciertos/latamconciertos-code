/**
 * Admin Venues Hooks
 * 
 * React Query hooks for venue CRUD operations in admin panel.
 * Uses centralized services and provides automatic cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { venueService, type VenueFilterOptions } from '@/services/venueService';
import type { VenueInsert, VenueUpdate } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all venues for admin list view
 */
export const useAdminVenues = (options?: VenueFilterOptions) => {
  return useQuery({
    queryKey: [...queryKeys.venues.all, 'admin', options || {}],
    queryFn: async () => {
      const result = await venueService.getAll(options);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Fetch a single venue by ID for editing
 */
export const useAdminVenue = (id: string) => {
  return useQuery({
    queryKey: ['venues', 'admin', id],
    queryFn: async () => {
      const result = await venueService.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Create a new venue
 */
export const useCreateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VenueInsert) => {
      const result = await venueService.create(data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      toast.success('Venue creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear venue: ${error.message}`);
    },
  });
};

/**
 * Update an existing venue
 */
export const useUpdateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VenueUpdate }) => {
      const result = await venueService.update(id, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      toast.success('Venue actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar venue: ${error.message}`);
    },
  });
};

/**
 * Delete a venue
 */
export const useDeleteVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await venueService.delete(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      toast.success('Venue eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar venue: ${error.message}`);
    },
  });
};
