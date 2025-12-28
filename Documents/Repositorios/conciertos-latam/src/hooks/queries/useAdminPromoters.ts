/**
 * Admin Promoters Hooks
 * 
 * React Query hooks for promoter CRUD operations in admin panel.
 * Uses centralized services and provides automatic cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { promoterService, type PromoterFilterOptions } from '@/services/promoterService';
import type { PromoterInsert, PromoterUpdate } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all promoters for admin list view
 */
export const useAdminPromoters = (options?: PromoterFilterOptions) => {
  return useQuery({
    queryKey: [...queryKeys.promoters.all, 'admin', options || {}],
    queryFn: async () => {
      const result = await promoterService.getAll(options);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Fetch a single promoter by ID for editing
 */
export const useAdminPromoter = (id: string) => {
  return useQuery({
    queryKey: ['promoters', 'admin', id],
    queryFn: async () => {
      const result = await promoterService.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Create a new promoter
 */
export const useCreatePromoter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PromoterInsert) => {
      const result = await promoterService.create(data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoters.all });
      toast.success('Promotora creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear promotora: ${error.message}`);
    },
  });
};

/**
 * Update an existing promoter
 */
export const useUpdatePromoter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromoterUpdate }) => {
      const result = await promoterService.update(id, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoters.all });
      toast.success('Promotora actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar promotora: ${error.message}`);
    },
  });
};

/**
 * Delete a promoter
 */
export const useDeletePromoter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await promoterService.delete(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoters.all });
      toast.success('Promotora eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar promotora: ${error.message}`);
    },
  });
};
