/**
 * Admin News Hooks
 * 
 * React Query hooks for news article CRUD operations in admin panel.
 * Uses centralized services and provides automatic cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { newsService, type NewsFilterOptions } from '@/services/newsService';
import type { NewsArticleInsert, NewsArticleUpdate } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all news articles for admin list view
 */
export const useAdminNews = (options?: NewsFilterOptions) => {
  return useQuery({
    queryKey: [...queryKeys.news.all, 'admin', options || {}],
    queryFn: async () => {
      const result = await newsService.getAll(options);
      if (result.error) throw result.error;
      return result.data;
    },
  });
};

/**
 * Fetch a single news article by ID for editing
 */
export const useAdminNewsArticle = (id: string) => {
  return useQuery({
    queryKey: ['news', 'admin', id],
    queryFn: async () => {
      const result = await newsService.getById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Create a new news article
 */
export const useCreateNewsArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewsArticleInsert) => {
      const result = await newsService.create(data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      toast.success('Artículo creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear artículo: ${error.message}`);
    },
  });
};

/**
 * Update an existing news article
 */
export const useUpdateNewsArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewsArticleUpdate }) => {
      const result = await newsService.update(id, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      toast.success('Artículo actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar artículo: ${error.message}`);
    },
  });
};

/**
 * Delete a news article
 */
export const useDeleteNewsArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await newsService.delete(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      toast.success('Artículo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar artículo: ${error.message}`);
    },
  });
};

/**
 * Publish a news article
 */
export const usePublishNewsArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await newsService.update(id, { 
        status: 'published',
        published_at: new Date().toISOString(),
      });
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      toast.success('Artículo publicado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al publicar artículo: ${error.message}`);
    },
  });
};

/**
 * Archive a news article
 */
export const useArchiveNewsArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await newsService.update(id, { status: 'archived' });
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      toast.success('Artículo archivado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al archivar artículo: ${error.message}`);
    },
  });
};
