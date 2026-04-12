/**
 * News form entity hooks
 *
 * Cached fetchers for the entities the news article editor depends on:
 * categories, artists, authors (admin profiles) and recent concerts.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

export interface NewsFormCategory {
  id: string;
  name: string;
}

export interface NewsFormArtist {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface NewsFormAuthor {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface NewsFormConcert {
  id: string;
  title: string;
  date: string | null;
  ticket_url: string | null;
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const useNewsFormCategories = () =>
  useQuery({
    queryKey: queryKeys.categories.list(),
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<NewsFormCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

export const useNewsFormArtists = () =>
  useQuery({
    queryKey: [...queryKeys.artists.all, 'form-options'] as const,
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<NewsFormArtist[]> => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, photo_url')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

export const useNewsFormAuthors = () =>
  useQuery({
    queryKey: ['profiles', 'authors'] as const,
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<NewsFormAuthor[]> => {
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (rolesError) throw rolesError;

      const adminIds = (adminRoles ?? []).map((r) => r.user_id);
      if (adminIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name')
        .in('id', adminIds)
        .order('username');
      if (error) throw error;
      return (data ?? []) as NewsFormAuthor[];
    },
  });

export const useNewsFormConcerts = (limit = 100) =>
  useQuery({
    queryKey: [...queryKeys.concerts.all, 'form-options', limit] as const,
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<NewsFormConcert[]> => {
      const { data, error } = await supabase
        .from('concerts')
        .select('id, title, date, ticket_url')
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export interface AccreditationEventOption {
  id: string;
  title: string;
  date: string | null;
  type: 'concert' | 'festival';
  ticket_url: string | null;
}

export const useAccreditationEvents = () =>
  useQuery({
    queryKey: ['accreditation-events'] as const,
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<AccreditationEventOption[]> => {
      const [concertsRes, festivalsRes] = await Promise.all([
        supabase
          .from('concerts')
          .select('id, title, date, ticket_url')
          .order('date', { ascending: false })
          .limit(300),
        supabase
          .from('festivals')
          .select('id, name, start_date, ticket_url')
          .order('start_date', { ascending: false })
          .limit(100),
      ]);

      const concerts: AccreditationEventOption[] = (concertsRes.data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        date: c.date,
        type: 'concert' as const,
        ticket_url: c.ticket_url,
      }));

      const festivals: AccreditationEventOption[] = (festivalsRes.data ?? []).map((f) => ({
        id: f.id,
        title: f.name,
        date: f.start_date,
        type: 'festival' as const,
        ticket_url: f.ticket_url,
      }));

      return [...festivals, ...concerts].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    },
  });

/**
 * Convenience aggregator — returns the four entity lists at once.
 */
export const useNewsFormEntities = () => {
  const categories = useNewsFormCategories();
  const artists = useNewsFormArtists();
  const authors = useNewsFormAuthors();
  const concerts = useNewsFormConcerts();

  return {
    categories: categories.data ?? [],
    artists: artists.data ?? [],
    authors: authors.data ?? [],
    concerts: concerts.data ?? [],
    isLoading:
      categories.isLoading || artists.isLoading || authors.isLoading || concerts.isLoading,
  };
};
