/**
 * Genre Query Hooks
 * 
 * React Query hooks for genre data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { genreService } from '@/services/genreService';

/**
 * Hook to fetch all main (curated) genres
 */
export function useMainGenres() {
    return useQuery({
        queryKey: ['genres', 'main'],
        queryFn: async () => {
            const result = await genreService.getMainGenres();
            if (!result.success) throw new Error(result.error || 'Failed to fetch genres');
            return result.data;
        },
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    });
}

/**
 * Hook to fetch Spotify genres that map to a main genre
 */
export function useSpotifyGenresForMainGenre(mainGenre: string | null) {
    return useQuery({
        queryKey: ['genres', 'spotify', mainGenre],
        queryFn: async () => {
            if (!mainGenre) return [];
            const result = await genreService.getSpotifyGenresForMainGenre(mainGenre);
            if (!result.success) throw new Error(result.error || 'Failed to fetch Spotify genres');
            return result.data;
        },
        enabled: !!mainGenre,
        staleTime: 10 * 60 * 1000,
    });
}
