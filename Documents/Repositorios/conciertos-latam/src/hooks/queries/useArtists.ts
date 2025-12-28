/**
 * Artist Query Hooks
 * 
 * React Query hooks for artist data fetching with automatic caching,
 * loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { artistService } from '@/services/artistService';
import { queryKeys } from './queryKeys';
import type { Artist } from '@/types/entities';

interface ArtistFilterOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch all artists with optional filters
 */
export function useArtists(options?: ArtistFilterOptions) {
  return useQuery({
    queryKey: queryKeys.artists.list(options || {}),
    queryFn: async () => {
      const result = await artistService.getAll(options);
      if (!result.success) throw new Error(result.error || 'Failed to fetch artists');
      return { data: result.data, count: result.count };
    },
  });
}

/**
 * Hook to fetch a single artist by slug
 */
export function useArtistBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.artists.detail(slug),
    queryFn: async () => {
      const result = await artistService.getBySlug(slug);
      if (!result.success) throw new Error(result.error || 'Failed to fetch artist');
      return result.data as Artist;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to fetch featured artists by country
 */
export function useFeaturedArtistsByCountry(countryId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.artists.featured(countryId),
    queryFn: async () => {
      if (!countryId) return [];
      const result = await artistService.getFeaturedByCountry(countryId, limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch featured artists');
      return result.data;
    },
    enabled: !!countryId,
  });
}

/**
 * Hook to search artists by name
 */
export function useArtistSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.artists.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const result = await artistService.search(query, limit);
      if (!result.success) throw new Error(result.error || 'Failed to search artists');
      return result.data;
    },
    enabled: query.length >= 2,
  });
}

/**
 * Hook to fetch user's favorite artists
 */
export function useUserFavoriteArtists(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.artists.favorites(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const result = await artistService.getUserFavorites(userId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch favorite artists');
      return result.data;
    },
    enabled: !!userId,
  });
}
