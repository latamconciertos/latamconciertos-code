/**
 * Media Query Hooks
 * 
 * React Query hooks for media items (videos, photos) with automatic caching.
 */

import { useQuery } from '@tanstack/react-query';
import { mediaService } from '@/services/mediaService';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch featured videos for homepage
 */
export function useFeaturedVideos(limit: number = 6) {
  return useQuery({
    queryKey: queryKeys.media.videos.featured(limit),
    queryFn: async () => {
      const result = await mediaService.getFeaturedVideos(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch featured videos');
      return result.data || [];
    },
  });
}

/**
 * Hook to fetch featured photos for homepage gallery
 */
export function useFeaturedPhotos(limit: number = 6) {
  return useQuery({
    queryKey: queryKeys.media.photos.featured(limit),
    queryFn: async () => {
      const result = await mediaService.getFeaturedPhotos(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch featured photos');
      return result.data || [];
    },
  });
}
