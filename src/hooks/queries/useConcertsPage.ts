/**
 * Concerts Page Query Hook
 * 
 * Specialized hook for the Concerts listing page with pagination,
 * filtering, search, and Spotify image enrichment.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService } from '@/lib/spotify';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch a single concert by slug directly (bypasses pagination)
 */
export function useConcertBySlugDirect(slug: string | null) {
  return useQuery({
    queryKey: [...queryKeys.concerts.all, 'direct', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('concerts')
        .select(`
          *,
          artists (name, photo_url),
          venues (
            name, 
            location,
            city_id,
            cities (
              name,
              country_id,
              countries (name)
            )
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      if (!data) return null;

      // Enrich with Spotify image
      let artistImage = data.artists?.photo_url || null;
      if (data.artists?.name) {
        artistImage = await spotifyService.getArtistImage(
          data.artists.name,
          data.artists.photo_url
        );
      }

      return { ...data, artist_image_url: artistImage } as ConcertPageItem;
    },
    enabled: !!slug,
  });
}

export interface ConcertPageFilters {
  status: 'all' | 'upcoming' | 'past';
  search: string;
  countryId: string;
  cityId: string;
  genre?: string | null; // Main genre name (e.g., 'Pop', 'Reggaeton')
  page: number;
  itemsPerPage: number;
}

export interface ConcertPageItem {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  ticket_url: string | null;
  spotify_embed_url?: string | null;
  description: string | null;
  created_at: string;
  artist_image_url?: string;
  artists?: {
    name: string;
    photo_url: string;
  } | null;
  venues?: {
    name: string;
    location: string | null;
    city_id?: string;
    cities?: {
      name: string;
      country_id?: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

/**
 * Hook to fetch concerts for the listing page with all filters and enrichment
 */
export function useConcertsPage(filters: ConcertPageFilters) {
  const { status, search, countryId, cityId, genre, page, itemsPerPage } = filters;

  return useQuery({
    queryKey: [
      ...queryKeys.concerts.all,
      'page',
      { status, search, countryId, cityId, genre, page, itemsPerPage }
    ],
    queryFn: async () => {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // First, get venue IDs if filtering by city or country
      let venueIds: string[] | null = null;

      if (cityId !== 'all') {
        // Get venues in the selected city
        const { data: venues } = await supabase
          .from('venues')
          .select('id')
          .eq('city_id', cityId);
        venueIds = venues?.map(v => v.id) || [];
      } else if (countryId !== 'all') {
        // Get cities in the country, then venues in those cities
        const { data: cities } = await supabase
          .from('cities')
          .select('id')
          .eq('country_id', countryId);

        if (cities && cities.length > 0) {
          const cityIds = cities.map(c => c.id);
          const { data: venues } = await supabase
            .from('venues')
            .select('id')
            .in('city_id', cityIds);
          venueIds = venues?.map(v => v.id) || [];
        } else {
          venueIds = [];
        }
      }

      // Get artist IDs if filtering by genre
      let artistIds: string[] | null = null;

      if (genre) {
        // First, get spotify genres that map to this main genre
        const { data: genreMappings } = await supabase
          .from('genre_mappings')
          .select('spotify_genre')
          .eq('main_genre', genre);

        if (genreMappings && genreMappings.length > 0) {
          const spotifyGenres = genreMappings.map(g => g.spotify_genre.toLowerCase());

          // Get artists that have any of these genres
          const { data: artists } = await supabase
            .from('artists')
            .select('id, genres')
            .not('genres', 'is', null);

          if (artists) {
            artistIds = artists
              .filter((a: any) => {
                if (!a.genres) return false;

                // Handle both array and string representations
                let genresArray: string[] = [];
                if (Array.isArray(a.genres)) {
                  genresArray = a.genres;
                } else if (typeof a.genres === 'string') {
                  try {
                    genresArray = JSON.parse(a.genres);
                  } catch {
                    genresArray = [];
                  }
                }

                // Check if any artist genre matches any mapped spotify genre
                return genresArray.some((g: string) =>
                  spotifyGenres.includes(g.toLowerCase())
                );
              })
              .map((a: any) => a.id);
          } else {
            artistIds = [];
          }
        } else {
          artistIds = [];
        }

        // If no artists match the genre, return empty result
        if (artistIds.length === 0) {
          return { concerts: [], totalCount: 0 };
        }
      }

      let query = supabase
        .from('concerts')
        .select(`
          *,
          artists (name, photo_url),
          venues (
            name, 
            location,
            city_id,
            cities (
              name,
              country_id,
              countries (name)
            )
          )
        `, { count: 'exact' });

      // Apply venue filter BEFORE pagination
      if (venueIds !== null) {
        if (venueIds.length === 0) {
          // No venues match the filter, return empty result
          return { concerts: [], totalCount: 0 };
        }
        query = query.in('venue_id', venueIds);
      }

      // Apply artist filter for genre
      if (artistIds !== null) {
        query = query.in('artist_id', artistIds);
      }

      // Apply date filter
      const today = new Date().toISOString().split('T')[0];
      if (status === 'upcoming') {
        query = query.gte('date', today).order('date', { ascending: true });
      } else if (status === 'past') {
        query = query.lt('date', today).order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: true });
      }

      // Apply search filter if exists
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const filteredData = data || [];

      // Fetch artist images for each concert
      const concertsWithImages = await Promise.all(
        filteredData.map(async (concert) => {
          if (concert.artists?.name) {
            const artistImage = await spotifyService.getArtistImage(
              concert.artists.name,
              concert.artists.photo_url
            );
            return { ...concert, artist_image_url: artistImage };
          }
          return concert;
        })
      );

      return {
        concerts: concertsWithImages as ConcertPageItem[],
        totalCount: count || 0
      };
    },
    placeholderData: keepPreviousData,
  });
}
