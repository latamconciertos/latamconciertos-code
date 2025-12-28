/**
 * Setlist Query Hooks
 * 
 * React Query hooks for setlist data fetching with automatic caching,
 * loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { setlistService } from '@/services/setlistService';
import { queryKeys } from './queryKeys';
import type { SetlistWithConcert } from '@/types/entities';

/**
 * Hook to fetch setlist songs by concert
 */
export function useSetlistByConcert(concertId: string) {
  return useQuery({
    queryKey: queryKeys.setlists.byConcert(concertId),
    queryFn: async () => {
      const result = await setlistService.getSongsByConcert(concertId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch setlist');
      return result.data;
    },
    enabled: !!concertId,
  });
}

/**
 * Hook to fetch all songs for a concert including user's pending contributions
 */
export function useAllSetlistSongsByConcert(concertId: string, userId?: string) {
  return useQuery({
    queryKey: [...queryKeys.setlists.byConcert(concertId), 'all', userId],
    queryFn: async () => {
      const result = await setlistService.getAllSongsByConcert(concertId, userId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch setlist');
      return result.data;
    },
    enabled: !!concertId,
  });
}

/**
 * Hook to fetch concerts with setlists
 */
export function useSetlistsWithConcerts(options?: { status?: 'upcoming' | 'past' | 'all'; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.setlists.withConcerts(options?.status, options?.limit),
    queryFn: async () => {
      const result = await setlistService.getConcertsWithSetlists(options);
      if (!result.success) throw new Error(result.error || 'Failed to fetch setlists');
      return result.data as SetlistWithConcert[];
    },
  });
}

/**
 * Hook to fetch pending setlist contributions (admin)
 */
export function usePendingSetlistContributions() {
  return useQuery({
    queryKey: queryKeys.setlists.pendingContributions(),
    queryFn: async () => {
      const result = await setlistService.getPendingContributions();
      if (!result.success) throw new Error(result.error || 'Failed to fetch pending contributions');
      return result.data;
    },
  });
}

/**
 * Hook to fetch pending contributions count (admin badge)
 */
export function usePendingSetlistCount() {
  return useQuery({
    queryKey: queryKeys.setlists.pendingCount(),
    queryFn: async () => {
      const result = await setlistService.getPendingCount();
      if (!result.success) throw new Error(result.error || 'Failed to fetch pending count');
      return result.data as number;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
