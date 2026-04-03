/**
 * Festival Query Hooks (Public)
 * 
 * React Query hooks for fetching festival data in public views.
 */

import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import type { FestivalFilterOptions } from '@/types/entities/festival';
import { queryKeys } from './queryKeys';

/**
 * Query keys for festivals
 */
export const festivalQueryKeys = {
  all: ['festivals'] as const,
  lists: () => [...festivalQueryKeys.all, 'list'] as const,
  list: (filters?: FestivalFilterOptions) => [...festivalQueryKeys.lists(), filters] as const,
  details: () => [...festivalQueryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...festivalQueryKeys.details(), slug] as const,
  upcoming: (limit?: number) => [...festivalQueryKeys.all, 'upcoming', limit] as const,
  past: (limit?: number) => [...festivalQueryKeys.all, 'past', limit] as const,
  featured: (limit?: number) => [...festivalQueryKeys.all, 'featured', limit] as const,
  lineup: (festivalId: string) => [...festivalQueryKeys.all, 'lineup', festivalId] as const,
};

/**
 * Fetch festivals with optional filtering
 */
export function useFestivals(options?: FestivalFilterOptions) {
  return useQuery({
    queryKey: festivalQueryKeys.list(options),
    queryFn: async () => {
      const result = await festivalService.getAll(options);
      if (!result.success) throw new Error(result.error || 'Error fetching festivals');
      return { data: result.data, count: result.count };
    },
  });
}

/**
 * Fetch a single festival by slug
 */
export function useFestival(slug: string | undefined) {
  return useQuery({
    queryKey: festivalQueryKeys.detail(slug || ''),
    queryFn: async () => {
      if (!slug) return null;
      const result = await festivalService.getBySlug(slug);
      if (!result.success) throw new Error(result.error || 'Festival not found');
      return result.data;
    },
    enabled: !!slug,
  });
}

/**
 * Fetch upcoming festivals
 */
export function useUpcomingFestivals(limit?: number) {
  return useQuery({
    queryKey: festivalQueryKeys.upcoming(limit),
    queryFn: async () => {
      const result = await festivalService.getUpcoming(limit);
      if (!result.success) throw new Error(result.error || 'Error fetching upcoming festivals');
      return result.data;
    },
  });
}

/**
 * Fetch past festivals
 */
export function usePastFestivals(limit?: number) {
  return useQuery({
    queryKey: festivalQueryKeys.past(limit),
    queryFn: async () => {
      const result = await festivalService.getPast(limit);
      if (!result.success) throw new Error(result.error || 'Error fetching past festivals');
      return result.data;
    },
  });
}

/**
 * Fetch featured festivals
 */
export function useFeaturedFestivals(limit?: number) {
  return useQuery({
    queryKey: festivalQueryKeys.featured(limit),
    queryFn: async () => {
      const result = await festivalService.getFeatured(limit);
      if (!result.success) throw new Error(result.error || 'Error fetching featured festivals');
      return result.data;
    },
  });
}

/**
 * Fetch festival lineup
 */
export function useFestivalLineup(festivalId: string | undefined) {
  return useQuery({
    queryKey: festivalQueryKeys.lineup(festivalId || ''),
    queryFn: async () => {
      if (!festivalId) return [];
      const result = await festivalService.getLineup(festivalId);
      if (!result.success) throw new Error(result.error || 'Error fetching lineup');
      return result.data;
    },
    enabled: !!festivalId,
  });
}
