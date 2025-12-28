/**
 * Artist Service
 * 
 * Handles all artist-related database operations including
 * CRUD operations, search, and related queries.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Artist,
  ArtistBasic,
  ArtistWithConcertCount,
  FeaturedArtist,
  ArtistInsert,
  ArtistUpdate,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, getTodayDate, SELECT_QUERIES } from './base';

export interface ArtistFilterOptions {
  search?: string;
  limit?: number;
  offset?: number;
  withConcertCount?: boolean;
}

class ArtistServiceClass {
  /**
   * Get all artists with optional filtering
   */
  async getAll(options?: ArtistFilterOptions): Promise<ServiceResponse<Artist[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('artists')
        .select(SELECT_QUERIES.artistBasic, { count: 'exact' })
        .order('name', { ascending: true });

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'ArtistService.getAll');
  }

  /**
   * Get a single artist by ID
   */
  async getById(id: string): Promise<ServiceResponse<Artist>> {
    return handleServiceCall(async () => {
      return supabase
        .from('artists')
        .select(SELECT_QUERIES.artistBasic)
        .eq('id', id)
        .single();
    }, 'ArtistService.getById');
  }

  /**
   * Get a single artist by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Artist>> {
    return handleServiceCall(async () => {
      return supabase
        .from('artists')
        .select(SELECT_QUERIES.artistBasic)
        .eq('slug', slug)
        .single();
    }, 'ArtistService.getBySlug');
  }

  /**
   * Get featured artists with upcoming concerts in a specific country
   */
  async getFeaturedByCountry(countryId: string, limit: number = 10): Promise<ServiceResponse<FeaturedArtist[]>> {
    return handleServiceCallArray(async () => {
      const today = getTodayDate();
      
      // First get cities in the country
      const { data: cities } = await supabase
        .from('cities')
        .select('id')
        .eq('country_id', countryId);

      if (!cities?.length) {
        return { data: [], error: null };
      }

      const cityIds = cities.map(c => c.id);

      // Get venues in those cities
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .in('city_id', cityIds);

      if (!venues?.length) {
        return { data: [], error: null };
      }

      const venueIds = venues.map(v => v.id);

      // Get upcoming concerts at those venues with artists
      const { data: concerts, error } = await supabase
        .from('concerts')
        .select(`
          id, date, artist_id,
          artists (id, name, slug, photo_url)
        `)
        .gte('date', today)
        .in('venue_id', venueIds)
        .not('artist_id', 'is', null)
        .order('date', { ascending: true })
        .limit(limit * 3); // Get more to deduplicate

      if (error) return { data: null, error };

      // Deduplicate by artist and count upcoming concerts
      const artistMap = new Map<string, FeaturedArtist>();
      
      concerts?.forEach(concert => {
        if (concert.artists && concert.artist_id) {
          const existing = artistMap.get(concert.artist_id);
          if (existing) {
            existing.upcoming_concerts_count = (existing.upcoming_concerts_count || 0) + 1;
          } else {
            artistMap.set(concert.artist_id, {
              id: concert.artists.id,
              name: concert.artists.name,
              slug: concert.artists.slug,
              photo_url: concert.artists.photo_url,
              upcoming_concerts_count: 1,
            });
          }
        }
      });

      const featuredArtists = Array.from(artistMap.values()).slice(0, limit);
      return { data: featuredArtists, error: null };
    }, 'ArtistService.getFeaturedByCountry');
  }

  /**
   * Get top artists as fallback when no country-specific artists are found
   */
  async getTopArtists(limit: number = 12): Promise<ServiceResponse<FeaturedArtist[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('artists')
        .select('id, name, slug, photo_url')
        .limit(limit);
    }, 'ArtistService.getTopArtists');
  }

  /**
   * Search artists by name
   */
  async search(query: string, limit: number = 10): Promise<ServiceResponse<ArtistBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('artists')
        .select('id, name, slug, photo_url')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);
    }, 'ArtistService.search');
  }

  /**
   * Create a new artist
   */
  async create(data: ArtistInsert): Promise<ServiceResponse<Artist>> {
    return handleServiceCall(async () => {
      const { data: artist, error } = await supabase
        .from('artists')
        .insert(data)
        .select(SELECT_QUERIES.artistBasic)
        .single();
      
      return { data: artist, error };
    }, 'ArtistService.create');
  }

  /**
   * Update an existing artist
   */
  async update(id: string, data: ArtistUpdate): Promise<ServiceResponse<Artist>> {
    return handleServiceCall(async () => {
      const { data: artist, error } = await supabase
        .from('artists')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.artistBasic)
        .single();
      
      return { data: artist, error };
    }, 'ArtistService.update');
  }

  /**
   * Delete an artist
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'ArtistService.delete');
  }

  /**
   * Get user's favorite artists
   */
  async getUserFavorites(userId: string): Promise<ServiceResponse<Artist[]>> {
    return handleServiceCallArray(async () => {
      const { data, error } = await supabase
        .from('favorite_artists')
        .select(`
          artist_id,
          artists (${SELECT_QUERIES.artistBasic})
        `)
        .eq('user_id', userId);

      if (error) return { data: null, error };

      const artists = data?.map(f => f.artists).filter(Boolean) as Artist[];
      return { data: artists, error: null };
    }, 'ArtistService.getUserFavorites');
  }

  /**
   * Add artist to user favorites
   */
  async addFavorite(artistId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('favorite_artists')
        .insert({ artist_id: artistId, user_id: userId });
      
      return { data: !error, error };
    }, 'ArtistService.addFavorite');
  }

  /**
   * Remove artist from user favorites
   */
  async removeFavorite(artistId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('favorite_artists')
        .delete()
        .eq('artist_id', artistId)
        .eq('user_id', userId);
      
      return { data: !error, error };
    }, 'ArtistService.removeFavorite');
  }
}

export const artistService = new ArtistServiceClass();
