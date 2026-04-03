/**
 * Artist Detail Query Hook
 * 
 * Provides data fetching for the Artist Detail page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService, SpotifyTrack } from '@/lib/spotify';
import { queryKeys } from './queryKeys';

export interface ArtistDetail {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  social_links: any;
}

export interface ArtistConcert {
  id: string;
  title: string;
  date: string;
  image_url: string | null;
  slug: string;
  venues: {
    name: string;
    location: string;
  } | null;
}

export interface ArtistNewsArticle {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  published_at: string;
  meta_description: string | null;
}

/**
 * Fetch artist by slug
 */
export function useArtistDetail(slug: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.artists.details(), slug || '', 'full'],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as ArtistDetail;
    },
    enabled: !!slug,
  });
}

/**
 * Fetch upcoming concerts for an artist
 */
export function useArtistConcerts(artistId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.concerts.all, 'by-artist', artistId],
    queryFn: async () => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('concerts')
        .select(`
          id,
          title,
          date,
          image_url,
          slug,
          venues (
            name,
            location
          )
        `)
        .eq('artist_id', artistId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(6);

      if (error) throw error;
      return (data || []) as ArtistConcert[];
    },
    enabled: !!artistId,
  });
}

/**
 * Fetch news articles for an artist
 */
export function useArtistNews(artistId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.news.all, 'by-artist', artistId],
    queryFn: async () => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, slug, featured_image, published_at, meta_description')
        .eq('artist_id', artistId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []) as ArtistNewsArticle[];
    },
    enabled: !!artistId,
  });
}

/**
 * Fetch Spotify top tracks for an artist
 */
export function useArtistSpotifyTracks(artistName: string | undefined) {
  return useQuery({
    queryKey: ['spotify', 'tracks', artistName],
    queryFn: async () => {
      if (!artistName) return [];

      const tracks = await spotifyService.searchTrack(artistName, artistName);
      return tracks.slice(0, 5) as SpotifyTrack[];
    },
    enabled: !!artistName,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
