/**
 * Blog Page Query Hook
 * 
 * Provides data fetching for the Blog page with filtering and sorting
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

export interface BlogArticle {
  id: string;
  title: string;
  content: string | null;
  slug: string;
  featured_image: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  status: string;
  category_id: string | null;
  author_id: string | null;
  artist_id: string | null;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  categories?: {
    name: string;
    slug: string;
  } | null;
  profiles?: {
    username: string | null;
  } | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetch published blog articles with category info
 */
export function useBlogArticles() {
  return useQuery({
    queryKey: [...queryKeys.news.all, 'blog-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          artists (name, photo_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BlogArticle[];
    },
  });
}

/**
 * Fetch all categories
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as BlogCategory[];
    },
  });
}
