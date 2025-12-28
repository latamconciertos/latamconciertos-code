/**
 * Concert Query Hooks
 * 
 * React Query hooks for concert data fetching with automatic caching,
 * loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { concertService, type ConcertFilterOptions } from '@/services/concertService';
import { queryKeys } from './queryKeys';
import type { Concert, ConcertWithBasicRelations, FeaturedConcert, ConcertFilterStatus } from '@/types/entities';

/**
 * Hook to fetch all concerts with optional filters
 */
export function useConcerts(options?: ConcertFilterOptions) {
  return useQuery({
    queryKey: queryKeys.concerts.list(options || {}),
    queryFn: async () => {
      const result = await concertService.getAll(options);
      if (!result.success) throw new Error(result.error || 'Failed to fetch concerts');
      return { data: result.data, count: result.count };
    },
  });
}

/**
 * Hook to fetch upcoming concerts
 */
export function useUpcomingConcerts(limit?: number) {
  return useQuery({
    queryKey: queryKeys.concerts.upcoming(limit),
    queryFn: async () => {
      const result = await concertService.getUpcoming(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch upcoming concerts');
      return result.data as ConcertWithBasicRelations[];
    },
  });
}

/**
 * Hook to fetch past concerts
 */
export function usePastConcerts(limit?: number) {
  return useQuery({
    queryKey: queryKeys.concerts.past(limit),
    queryFn: async () => {
      const result = await concertService.getPast(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch past concerts');
      return result.data as ConcertWithBasicRelations[];
    },
  });
}

/**
 * Hook to fetch featured concerts for carousel
 */
export function useFeaturedConcerts() {
  return useQuery({
    queryKey: queryKeys.concerts.featured(),
    queryFn: async () => {
      const result = await concertService.getFeatured();
      if (!result.success) throw new Error(result.error || 'Failed to fetch featured concerts');
      return result.data as FeaturedConcert[];
    },
  });
}

/**
 * Hook to fetch a single concert by slug
 */
export function useConcertBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.concerts.detail(slug),
    queryFn: async () => {
      const result = await concertService.getBySlug(slug);
      if (!result.success) throw new Error(result.error || 'Failed to fetch concert');
      return result.data as Concert;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to fetch concerts by artist
 */
export function useConcertsByArtist(artistId: string, status?: ConcertFilterStatus) {
  return useQuery({
    queryKey: queryKeys.concerts.byArtist(artistId, status),
    queryFn: async () => {
      const result = await concertService.getByArtist(artistId, status);
      if (!result.success) throw new Error(result.error || 'Failed to fetch artist concerts');
      return result.data as ConcertWithBasicRelations[];
    },
    enabled: !!artistId,
  });
}

/**
 * Hook to check if user has favorited a concert
 */
export function useConcertFavorite(concertId: string, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.favorites.concerts(userId || ''),
    queryFn: async () => {
      if (!userId) return false;
      const result = await concertService.checkFavorite(concertId, userId);
      return result.success ? result.data : false;
    },
    enabled: !!concertId && !!userId,
  });
}
