/**
 * Setlist Detail Query Hook
 * 
 * Provides data fetching for the Setlist Detail page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService } from '@/lib/spotify';
import { queryKeys } from './queryKeys';

export interface SetlistSong {
  id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  duration_seconds: number | null;
  notes: string | null;
  spotify_url: string | null;
  spotify_track_id: string | null;
  is_official: boolean | null;
  contributed_by: string | null;
}

export interface SetlistConcert {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  artist: {
    name: string;
    slug: string;
  } | null;
  venue: {
    name: string;
    location: string | null;
    city: {
      slug: string;
    } | null;
  } | null;
}

interface SetlistContribution {
  concert_id: string;
  song_name: string;
  artist_name?: string | null;
  notes?: string | null;
  user_id: string;
  position: number;
}

/**
 * Fetch concert by slug with validation
 */
export function useSetlistConcert(
  concertSlug: string | undefined,
  artistSlug: string | undefined,
  city: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: [...queryKeys.setlists.all, 'concert', concertSlug],
    queryFn: async () => {
      if (!concertSlug) return null;

      const { data, error } = await supabase
        .from('concerts')
        .select(`
          id,
          title,
          slug,
          date,
          image_url,
          artist:artists(name, slug),
          venue:venues(name, location, city:cities(slug))
        `)
        .eq('slug', concertSlug)
        .single();

      if (error) throw error;

      // Validate URL parameters match the concert data
      const expectedArtistSlug = data.artist?.slug;
      const expectedCitySlug = data.venue?.city?.slug;
      const expectedDate = data.date?.split('T')[0];

      if (
        artistSlug !== expectedArtistSlug ||
        city !== expectedCitySlug ||
        date !== expectedDate
      ) {
        return null;
      }

      return data as SetlistConcert;
    },
    enabled: !!concertSlug,
  });
}

/**
 * Fetch approved setlist songs for a concert
 */
export function useSetlistSongs(concertId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.setlists.byConcert(concertId || ''), 'songs'],
    queryFn: async () => {
      if (!concertId) return [];

      const { data, error } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('concert_id', concertId)
        .eq('status', 'approved')
        .order('position');

      if (error) throw error;
      return (data || []) as SetlistSong[];
    },
    enabled: !!concertId,
  });
}

/**
 * Fetch Spotify album cover images for a list of track IDs.
 * Returns a map of trackId -> album image URL. Batched into a single
 * Spotify request (up to 50 IDs each) via the spotify-api edge function.
 */
export function useSpotifyTrackImages(trackIds: (string | null | undefined)[]) {
  const ids = Array.from(
    new Set(trackIds.filter((id): id is string => !!id))
  ).sort();

  return useQuery({
    queryKey: ['spotify', 'track-images', ids],
    queryFn: async () => {
      if (ids.length === 0) return {} as Record<string, string>;

      const tracks = await spotifyService.getTracksByIds(ids);
      const map: Record<string, string> = {};
      for (const track of tracks) {
        const images = track.album?.images;
        const url = images?.[1]?.url || images?.[0]?.url;
        if (track.id && url) map[track.id] = url;
      }
      return map;
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // album art rarely changes
  });
}

/**
 * Contribute a song to a setlist
 */
export function useContributeToSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contribution: SetlistContribution) => {
      const { error } = await supabase
        .from('setlist_songs')
        .insert({
          concert_id: contribution.concert_id,
          song_name: contribution.song_name,
          artist_name: contribution.artist_name || null,
          position: contribution.position,
          notes: contribution.notes || null,
          is_official: false,
          status: 'pending',
          contributed_by: contribution.user_id
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.setlists.byConcert(variables.concert_id)] 
      });
    },
  });
}
