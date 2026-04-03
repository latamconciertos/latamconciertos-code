/**
 * Festival Service
 * 
 * Handles all festival-related database operations including
 * CRUD operations, filtering, and lineup management.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Festival, 
  FestivalWithRelations,
  FestivalInsert, 
  FestivalUpdate,
  FestivalLineupItem,
  FestivalLineupInsert,
  FestivalFilterOptions,
} from '@/types/entities/festival';
import type { ServiceResponse } from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, getTodayDate } from './base';

/**
 * Select queries for festivals
 */
const SELECT_QUERIES = {
  festivalWithRelations: `
    *,
    venues (
      id, name, location, slug,
      cities (
        name, slug,
        countries (name, iso_code)
      )
    ),
    promoters (id, name)
  `,
  
  festivalBasic: `
    id, name, slug, start_date, end_date, image_url, is_featured, edition,
    venues (id, name, location, cities (name, countries (name))),
    promoters (id, name)
  `,

  lineupWithArtist: `
    *,
    artists (id, name, slug, photo_url)
  `,
};

class FestivalServiceClass {
  /**
   * Get all festivals with optional filtering
   */
  async getAll(options?: FestivalFilterOptions): Promise<ServiceResponse<FestivalWithRelations[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalWithRelations, { count: 'exact' });

      const today = getTodayDate();

      // Apply status filter
      if (options?.status === 'upcoming') {
        query = query.gte('start_date', today).order('start_date', { ascending: true });
      } else if (options?.status === 'past') {
        query = query.lt('start_date', today).order('start_date', { ascending: false });
      } else {
        query = query.order('start_date', { ascending: false });
      }

      // Apply additional filters
      if (options?.venueId) {
        query = query.eq('venue_id', options.venueId);
      }
      if (options?.promoterId) {
        query = query.eq('promoter_id', options.promoterId);
      }
      if (options?.featured !== undefined) {
        query = query.eq('is_featured', options.featured);
      }
      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      // Apply pagination
      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'FestivalService.getAll');
  }

  /**
   * Get upcoming festivals
   */
  async getUpcoming(limit?: number): Promise<ServiceResponse<FestivalWithRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalBasic)
        .gte('start_date', getTodayDate())
        .order('start_date', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'FestivalService.getUpcoming');
  }

  /**
   * Get past festivals
   */
  async getPast(limit?: number): Promise<ServiceResponse<FestivalWithRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalBasic)
        .lt('start_date', getTodayDate())
        .order('start_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'FestivalService.getPast');
  }

  /**
   * Get featured festivals
   */
  async getFeatured(limit?: number): Promise<ServiceResponse<FestivalWithRelations[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalBasic)
        .eq('is_featured', true)
        .gte('start_date', getTodayDate())
        .order('start_date', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'FestivalService.getFeatured');
  }

  /**
   * Get a single festival by ID
   */
  async getById(id: string): Promise<ServiceResponse<Festival>> {
    return handleServiceCall(async () => {
      return supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalWithRelations)
        .eq('id', id)
        .single();
    }, 'FestivalService.getById');
  }

  /**
   * Get a single festival by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Festival>> {
    return handleServiceCall(async () => {
      return supabase
        .from('festivals')
        .select(SELECT_QUERIES.festivalWithRelations)
        .eq('slug', slug)
        .single();
    }, 'FestivalService.getBySlug');
  }

  /**
   * Create a new festival
   */
  async create(data: FestivalInsert): Promise<ServiceResponse<Festival>> {
    return handleServiceCall(async () => {
      const { data: festival, error } = await supabase
        .from('festivals')
        .insert(data)
        .select(SELECT_QUERIES.festivalWithRelations)
        .single();
      
      return { data: festival, error };
    }, 'FestivalService.create');
  }

  /**
   * Update an existing festival
   */
  async update(id: string, data: FestivalUpdate): Promise<ServiceResponse<Festival>> {
    return handleServiceCall(async () => {
      const { data: festival, error } = await supabase
        .from('festivals')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.festivalWithRelations)
        .single();
      
      return { data: festival, error };
    }, 'FestivalService.update');
  }

  /**
   * Delete a festival
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('festivals')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'FestivalService.delete');
  }

  /**
   * Toggle featured status of a festival
   */
  async toggleFeatured(id: string, isFeatured: boolean): Promise<ServiceResponse<Festival>> {
    return this.update(id, { is_featured: isFeatured });
  }

  // =========================================================================
  // Lineup Management
  // =========================================================================

  /**
   * Get lineup for a festival
   */
  async getLineup(festivalId: string): Promise<ServiceResponse<FestivalLineupItem[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('festival_lineup')
        .select(SELECT_QUERIES.lineupWithArtist)
        .eq('festival_id', festivalId)
        .order('performance_date', { ascending: true })
        .order('position', { ascending: true });
    }, 'FestivalService.getLineup');
  }

  /**
   * Add artist to lineup
   */
  async addToLineup(data: FestivalLineupInsert): Promise<ServiceResponse<FestivalLineupItem>> {
    return handleServiceCall(async () => {
      const { data: lineupItem, error } = await supabase
        .from('festival_lineup')
        .insert(data)
        .select(SELECT_QUERIES.lineupWithArtist)
        .single();
      
      return { data: lineupItem, error };
    }, 'FestivalService.addToLineup');
  }

  /**
   * Update lineup item (date, stage, position)
   */
  async updateLineupItem(id: string, data: Partial<FestivalLineupInsert>): Promise<ServiceResponse<FestivalLineupItem>> {
    return handleServiceCall(async () => {
      const { data: lineupItem, error } = await supabase
        .from('festival_lineup')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.lineupWithArtist)
        .single();
      
      return { data: lineupItem, error };
    }, 'FestivalService.updateLineupItem');
  }

  /**
   * Remove artist from lineup
   */
  async removeFromLineup(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('festival_lineup')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'FestivalService.removeFromLineup');
  }

  /**
   * Bulk update lineup positions
   */
  async reorderLineup(festivalId: string, items: { id: string; position: number }[]): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      // Update each item's position
      for (const item of items) {
        const { error } = await supabase
          .from('festival_lineup')
          .update({ position: item.position })
          .eq('id', item.id)
          .eq('festival_id', festivalId);
        
        if (error) {
          return { data: false, error };
        }
      }
      
      return { data: true, error: null };
    }, 'FestivalService.reorderLineup');
  }
}

export const festivalService = new FestivalServiceClass();
