/**
 * Featured Artists Hook
 * 
 * React Query hook for fetching featured artists based on user's country.
 * Uses geolocation detection with fallback to top artists.
 */

import { useQuery } from '@tanstack/react-query';
import { artistService } from '@/services/artistService';
import { queryKeys, useUserCountry } from './queries';
import type { FeaturedArtist } from '@/types/entities';

export type { FeaturedArtist as Artist };

export const useFeaturedArtists = () => {
  const { data: userCountry, isLoading: isLoadingCountry } = useUserCountry();

  const { data: artists = [], isLoading: isLoadingArtists } = useQuery({
    queryKey: queryKeys.artists.featured(userCountry?.id),
    queryFn: async (): Promise<FeaturedArtist[]> => {
      // If we have a country, try to get featured artists for it
      if (userCountry?.id) {
        const result = await artistService.getFeaturedByCountry(userCountry.id, 12);
        if (result.success && result.data && result.data.length > 0) {
          return result.data;
        }
      }
      
      // Fallback to top artists
      const fallbackResult = await artistService.getTopArtists(12);
      return fallbackResult.success ? (fallbackResult.data || []) : [];
    },
    enabled: !isLoadingCountry, // Wait for country detection
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    artists,
    loading: isLoadingCountry || isLoadingArtists,
    countryName: userCountry?.name || null,
  };
};
