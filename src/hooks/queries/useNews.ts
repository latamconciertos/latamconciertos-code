/**
 * News Query Hooks
 * 
 * React Query hooks for news article data fetching with automatic caching,
 * loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { newsService, type NewsFilterOptions } from '@/services/newsService';
import { queryKeys } from './queryKeys';
import type { 
  NewsArticle, 
  NewsArticleForList, 
  NewsArticleForHome, 
  FeaturedNewsArticle 
} from '@/types/entities';

/**
 * Hook to fetch all news articles with optional filters
 */
export function useNews(options?: NewsFilterOptions) {
  return useQuery({
    queryKey: queryKeys.news.list(options || {}),
    queryFn: async () => {
      const result = await newsService.getAll(options);
      if (!result.success) throw new Error(result.error || 'Failed to fetch news');
      return { data: result.data, count: result.count };
    },
  });
}

/**
 * Hook to fetch latest news for homepage
 */
export function useLatestNews(limit: number = 6) {
  return useQuery({
    queryKey: queryKeys.news.latest(limit),
    queryFn: async () => {
      const result = await newsService.getLatest(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch latest news');
      return result.data as NewsArticleForHome[];
    },
  });
}

/**
 * Hook to fetch published articles for public display
 */
export function usePublishedNews(limit?: number) {
  return useQuery({
    queryKey: queryKeys.news.published(limit),
    queryFn: async () => {
      const result = await newsService.getPublished(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch published news');
      return result.data as NewsArticleForList[];
    },
  });
}

/**
 * Hook to fetch featured articles for hero section
 */
export function useFeaturedNews(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.news.featured(limit),
    queryFn: async () => {
      const result = await newsService.getFeatured(limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch featured news');
      return result.data as FeaturedNewsArticle[];
    },
  });
}

/**
 * Hook to fetch a single article by slug
 */
export function useNewsBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.news.detail(slug),
    queryFn: async () => {
      const result = await newsService.getBySlug(slug);
      if (!result.success) throw new Error(result.error || 'Failed to fetch article');
      return result.data as NewsArticle;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to fetch articles by category
 */
export function useNewsByCategory(categoryId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.news.byCategory(categoryId, limit),
    queryFn: async () => {
      const result = await newsService.getByCategory(categoryId, limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch category news');
      return result.data as NewsArticleForList[];
    },
    enabled: !!categoryId,
  });
}

/**
 * Hook to fetch articles by artist
 */
export function useNewsByArtist(artistId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.news.byArtist(artistId, limit),
    queryFn: async () => {
      const result = await newsService.getByArtist(artistId, limit);
      if (!result.success) throw new Error(result.error || 'Failed to fetch artist news');
      return result.data as NewsArticleForList[];
    },
    enabled: !!artistId,
  });
}
