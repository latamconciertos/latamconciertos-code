/**
 * Admin Concerts Hooks
 * 
 * React Query hooks for concert CRUD operations in admin panel.
 * Uses centralized services and provides automatic cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { concertService, type ConcertFilterOptions } from '@/services/concertService';
import type { ConcertInsert, ConcertUpdate } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all concerts for admin list view
 */
export const useAdminConcerts = (options?: ConcertFilterOptions) => {
  return useQuery({
    queryKey: queryKeys.concerts.list(options || {}),
    queryFn: async () => {
      const result = await concertService.getAll(options);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Fetch a single concert by ID for editing
 */
export const useAdminConcert = (id: string) => {
  return useQuery({
    queryKey: ['concerts', 'admin', id],
    queryFn: async () => {
      const result = await concertService.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Create a new concert
 */
export const useCreateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConcertInsert) => {
      const result = await concertService.create(data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
      toast.success('Concierto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear concierto: ${error.message}`);
    },
  });
};

/**
 * Update an existing concert
 */
export const useUpdateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConcertUpdate }) => {
      const result = await concertService.update(id, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
      toast.success('Concierto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar concierto: ${error.message}`);
    },
  });
};

/**
 * Delete a concert
 */
export const useDeleteConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await concertService.delete(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
      toast.success('Concierto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar concierto: ${error.message}`);
    },
  });
};

/**
 * Toggle featured status of a concert
 */
export const useToggleFeaturedConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const result = await concertService.toggleFeatured(id, isFeatured);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, { isFeatured }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.featured() });
      toast.success(isFeatured ? 'Concierto marcado como destacado' : 'Concierto desmarcado como destacado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};
