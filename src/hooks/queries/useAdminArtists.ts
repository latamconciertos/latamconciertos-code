/**
 * Admin Artists Hooks
 * 
 * React Query hooks for artist CRUD operations in admin panel.
 * Uses centralized services and provides automatic cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { artistService, type ArtistFilterOptions } from '@/services/artistService';
import type { ArtistInsert, ArtistUpdate } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all artists for admin list view
 */
export const useAdminArtists = (options?: ArtistFilterOptions) => {
  return useQuery({
    queryKey: queryKeys.artists.list(options || {}),
    queryFn: async () => {
      const result = await artistService.getAll(options);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Fetch a single artist by ID for editing
 */
export const useAdminArtist = (id: string) => {
  return useQuery({
    queryKey: ['artists', 'admin', id],
    queryFn: async () => {
      const result = await artistService.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Create a new artist
 */
export const useCreateArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ArtistInsert) => {
      const result = await artistService.create(data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      toast.success('Artista creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear artista: ${error.message}`);
    },
  });
};

/**
 * Update an existing artist
 */
export const useUpdateArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArtistUpdate }) => {
      const result = await artistService.update(id, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      toast.success('Artista actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar artista: ${error.message}`);
    },
  });
};

/**
 * Delete an artist
 */
export const useDeleteArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await artistService.delete(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      toast.success('Artista eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar artista: ${error.message}`);
    },
  });
};
