/**
 * Announcements Query Hook
 * 
 * React Query hook for fetching announcements (news by category).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

interface AnnouncementArticle {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  artist_id: string | null;
  featured_image: string | null;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
}

/**
 * Hook to fetch announcements (news from 'anuncios' category)
 */
export function useAnnouncements(limit: number = 3) {
  return useQuery({
    queryKey: queryKeys.announcements.list(limit),
    queryFn: async (): Promise<AnnouncementArticle[]> => {
      // Try to find category by slug first
      let { data: catBySlug } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', 'anuncios')
        .maybeSingle();

      // If not found by slug, search by name
      if (!catBySlug) {
        const { data: catList } = await supabase
          .from('categories')
          .select('id, name, slug')
          .ilike('name', '%anuncios%')
          .limit(1);
        catBySlug = catList?.[0] ?? null;
      }

      if (!catBySlug) {
        return [];
      }

      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          id, title, slug, meta_description, published_at, created_at, artist_id, featured_image,
          artists (name, photo_url)
        `)
        .eq('status', 'published')
        .eq('category_id', catBySlug.id)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as AnnouncementArticle[]) || [];
    },
  });
}
