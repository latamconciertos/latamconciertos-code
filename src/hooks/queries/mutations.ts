/**
 * Mutation Hooks
 * 
 * React Query mutations for data modification with automatic cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { concertService } from '@/services/concertService';
import { newsService } from '@/services/newsService';
import { artistService } from '@/services/artistService';
import { setlistService } from '@/services/setlistService';
import { queryKeys } from './queryKeys';
import type { ConcertInsert, ConcertUpdate, NewsArticleInsert, NewsArticleUpdate } from '@/types/entities';

// ==========================================================================
// Concert Mutations
// ==========================================================================

export function useCreateConcert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ConcertInsert) => {
      const result = await concertService.create(data);
      if (!result.success) throw new Error(result.error || 'Failed to create concert');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
    },
  });
}

export function useUpdateConcert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConcertUpdate }) => {
      const result = await concertService.update(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update concert');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
      // Also invalidate specific concert if we have the slug
      if (variables.data.slug) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.concerts.detail(variables.data.slug) 
        });
      }
    },
  });
}

export function useDeleteConcert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await concertService.delete(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete concert');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all });
    },
  });
}

export function useToggleConcertFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ concertId, userId, isFavorite }: { 
      concertId: string; 
      userId: string; 
      isFavorite: boolean 
    }) => {
      const result = isFavorite 
        ? await concertService.removeFavorite(concertId, userId)
        : await concertService.addFavorite(concertId, userId);
      if (!result.success) throw new Error(result.error || 'Failed to toggle favorite');
      return !isFavorite;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.favorites.concerts(variables.userId) 
      });
    },
  });
}

// ==========================================================================
// News Mutations
// ==========================================================================

export function useCreateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: NewsArticleInsert) => {
      const result = await newsService.create(data);
      if (!result.success) throw new Error(result.error || 'Failed to create article');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewsArticleUpdate }) => {
      const result = await newsService.update(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update article');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
      if (variables.data.slug) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.news.detail(variables.data.slug) 
        });
      }
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await newsService.delete(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete article');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    },
  });
}

export function usePublishNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await newsService.publish(id);
      if (!result.success) throw new Error(result.error || 'Failed to publish article');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    },
  });
}

// ==========================================================================
// Artist Mutations
// ==========================================================================

export function useToggleArtistFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ artistId, userId, isFavorite }: { 
      artistId: string; 
      userId: string; 
      isFavorite: boolean 
    }) => {
      const result = isFavorite 
        ? await artistService.removeFavorite(artistId, userId)
        : await artistService.addFavorite(artistId, userId);
      if (!result.success) throw new Error(result.error || 'Failed to toggle favorite');
      return !isFavorite;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.artists.favorites(variables.userId) 
      });
    },
  });
}

// ==========================================================================
// Setlist Mutations
// ==========================================================================

export function useContributeSetlistSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      concert_id: string; 
      song_name: string; 
      artist_name?: string; 
      position: number; 
      contributed_by: string 
    }) => {
      const result = await setlistService.contributeSong(data);
      if (!result.success) throw new Error(result.error || 'Failed to contribute song');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.setlists.byConcert(variables.concert_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.setlists.pendingContributions() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.setlists.pendingCount() 
      });
    },
  });
}

export function useApproveSetlistContribution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await setlistService.approveContribution(id);
      if (!result.success) throw new Error(result.error || 'Failed to approve contribution');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.setlists.all });
    },
  });
}

export function useRejectSetlistContribution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await setlistService.rejectContribution(id);
      if (!result.success) throw new Error(result.error || 'Failed to reject contribution');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.setlists.all });
    },
  });
}

export function useDeleteSetlistSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, concertId }: { id: string; concertId: string }) => {
      const result = await setlistService.deleteSong(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete song');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.setlists.byConcert(variables.concertId) 
      });
    },
  });
}
