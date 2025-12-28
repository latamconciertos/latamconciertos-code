/**
 * Concert Service
 * 
 * Handles all concert-related database operations including
 * CRUD operations, filtering, and related queries.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Concert, 
  ConcertWithBasicRelations,
  FeaturedConcert,
  ConcertInsert, 
  ConcertUpdate,
  ServiceResponse,
  ConcertFilterStatus,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, getTodayDate, SELECT_QUERIES } from './base';

export interface ConcertFilterOptions {
  status?: ConcertFilterStatus;
  artistId?: string;
  venueId?: string;
  countryId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

class ConcertServiceClass {
  /**
   * Get all concerts with optional filtering
   */
  async getAll(options?: ConcertFilterOptions): Promise<ServiceResponse<Concert[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertWithRelations, { count: 'exact' });

      const today = getTodayDate();

      // Apply status filter
      if (options?.status === 'upcoming') {
        query = query.gte('date', today).order('date', { ascending: true });
      } else if (options?.status === 'past') {
        query = query.lt('date', today).order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: false });
      }

      // Apply additional filters
      if (options?.artistId) {
        query = query.eq('artist_id', options.artistId);
      }
      if (options?.venueId) {
        query = query.eq('venue_id', options.venueId);
      }
      if (options?.search) {
        query = query.ilike('title', `%${options.search}%`);
      }

      // Apply pagination
      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'ConcertService.getAll');
  }

  /**
   * Get upcoming concerts
   */
  async getUpcoming(limit?: number): Promise<ServiceResponse<ConcertWithBasicRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertBasic)
        .gte('date', getTodayDate())
        .order('date', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'ConcertService.getUpcoming');
  }

  /**
   * Get past concerts
   */
  async getPast(limit?: number): Promise<ServiceResponse<ConcertWithBasicRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertBasic)
        .lt('date', getTodayDate())
        .order('date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'ConcertService.getPast');
  }

  /**
   * Get featured concerts for homepage carousel
   */
  async getFeatured(): Promise<ServiceResponse<FeaturedConcert[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('featured_concerts')
        .select(`
          id, position,
          concerts (
            ${SELECT_QUERIES.concertBasic}
          )
        `)
        .order('position', { ascending: true });
    }, 'ConcertService.getFeatured');
  }

  /**
   * Get a single concert by ID
   */
  async getById(id: string): Promise<ServiceResponse<Concert>> {
    return handleServiceCall(async () => {
      return supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertWithRelations)
        .eq('id', id)
        .single();
    }, 'ConcertService.getById');
  }

  /**
   * Get a single concert by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Concert>> {
    return handleServiceCall(async () => {
      return supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertWithRelations)
        .eq('slug', slug)
        .single();
    }, 'ConcertService.getBySlug');
  }

  /**
   * Get concerts for a specific artist
   */
  async getByArtist(artistId: string, status?: ConcertFilterStatus): Promise<ServiceResponse<ConcertWithBasicRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('concerts')
        .select(SELECT_QUERIES.concertBasic)
        .eq('artist_id', artistId);

      const today = getTodayDate();

      if (status === 'upcoming') {
        query = query.gte('date', today).order('date', { ascending: true });
      } else if (status === 'past') {
        query = query.lt('date', today).order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: false });
      }

      return query;
    }, 'ConcertService.getByArtist');
  }

  /**
   * Create a new concert
   */
  async create(data: ConcertInsert): Promise<ServiceResponse<Concert>> {
    return handleServiceCall(async () => {
      const { data: concert, error } = await supabase
        .from('concerts')
        .insert(data)
        .select(SELECT_QUERIES.concertWithRelations)
        .single();
      
      return { data: concert, error };
    }, 'ConcertService.create');
  }

  /**
   * Update an existing concert
   */
  async update(id: string, data: ConcertUpdate): Promise<ServiceResponse<Concert>> {
    return handleServiceCall(async () => {
      const { data: concert, error } = await supabase
        .from('concerts')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.concertWithRelations)
        .single();
      
      return { data: concert, error };
    }, 'ConcertService.update');
  }

  /**
   * Delete a concert
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('concerts')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'ConcertService.delete');
  }

  /**
   * Toggle featured status of a concert
   */
  async toggleFeatured(id: string, isFeatured: boolean): Promise<ServiceResponse<Concert>> {
    return this.update(id, { is_featured: isFeatured });
  }

  /**
   * Check if user has favorited a concert
   */
  async checkFavorite(concertId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { data, error } = await supabase
        .rpc('check_favorite_concert', { 
          p_concert_id: concertId, 
          p_user_id: userId 
        });
      
      return { data: data ?? false, error };
    }, 'ConcertService.checkFavorite');
  }

  /**
   * Add concert to user favorites
   */
  async addFavorite(concertId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .rpc('add_favorite_concert', { 
          p_concert_id: concertId, 
          p_user_id: userId 
        });
      
      return { data: !error, error };
    }, 'ConcertService.addFavorite');
  }

  /**
   * Remove concert from user favorites
   */
  async removeFavorite(concertId: string, userId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .rpc('remove_favorite_concert', { 
          p_concert_id: concertId, 
          p_user_id: userId 
        });
      
      return { data: !error, error };
    }, 'ConcertService.removeFavorite');
  }
}

export const concertService = new ConcertServiceClass();
