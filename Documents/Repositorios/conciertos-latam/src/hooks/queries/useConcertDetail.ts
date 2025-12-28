/**
 * Concert Detail Query Hook
 * 
 * Provides data fetching for the Concert Detail page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService } from '@/lib/spotify';
import { queryKeys } from './queryKeys';

export interface ConcertDetail {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  ticket_url: string | null;
  ticket_prices_html: string | null;
  description: string | null;
  event_type: string;
  artist_id: string | null;
  artists?: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
  } | null;
  venues?: {
    name: string;
    location: string | null;
    cities?: {
      name: string;
      slug: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
  promoters?: {
    name: string;
  } | null;
}

export interface ConcertSetlistSong {
  id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  notes: string | null;
  is_official: boolean | null;
  status: string | null;
}

interface ConcertDetailResult {
  concert: ConcertDetail;
  artistImage: string | null;
  setlist: ConcertSetlistSong[];
}

/**
 * Fetch concert by slug with artist image and setlist
 */
export function useConcertDetail(slug: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.concerts.details(), slug || '', 'full'],
    queryFn: async (): Promise<ConcertDetailResult | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('concerts')
        .select(`
          *,
          artists (id, name, slug, photo_url),
          venues (
            name,
            location,
            cities (
              name,
              slug,
              countries (name)
            )
          ),
          promoters (name)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch artist image from Spotify
      let artistImage: string | null = null;
      if (data.artists?.name) {
        artistImage = await spotifyService.getArtistImage(
          data.artists.name,
          data.artists.photo_url
        );
      }

      // Fetch setlist
      const { data: setlistData } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('concert_id', data.id)
        .eq('status', 'approved')
        .order('position', { ascending: true });

      return {
        concert: data as ConcertDetail,
        artistImage,
        setlist: (setlistData || []) as ConcertSetlistSong[],
      };
    },
    enabled: !!slug,
  });
}
