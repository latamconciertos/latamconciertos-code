/**
 * Promoter Service
 * 
 * Handles all promoter-related database operations including
 * CRUD operations and country-based filtering.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Promoter,
  PromoterInsert,
  PromoterUpdate,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray } from './base';

export interface PromoterFilterOptions {
  countryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class PromoterServiceClass {
  /**
   * Get all promoters with optional filtering
   */
  async getAll(options?: PromoterFilterOptions): Promise<ServiceResponse<Promoter[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('promoters')
        .select(`
          *,
          countries (id, name, iso_code)
        `, { count: 'exact' })
        .order('name', { ascending: true });

      if (options?.countryId) {
        query = query.eq('country_id', options.countryId);
      }
      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'PromoterService.getAll');
  }

  /**
   * Get a single promoter by ID
   */
  async getById(id: string): Promise<ServiceResponse<Promoter>> {
    return handleServiceCall(async () => {
      return supabase
        .from('promoters')
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .eq('id', id)
        .single();
    }, 'PromoterService.getById');
  }

  /**
   * Get promoters by country
   */
  async getByCountry(countryId: string): Promise<ServiceResponse<Promoter[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('promoters')
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .eq('country_id', countryId)
        .order('name', { ascending: true });
    }, 'PromoterService.getByCountry');
  }

  /**
   * Get concerts by promoter
   */
  async getConcerts(promoterId: string): Promise<ServiceResponse<any[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('concerts')
        .select(`
          id, title, slug, date, image_url,
          artists (id, name, photo_url),
          venues (
            id, name,
            cities (name, countries (name))
          )
        `)
        .eq('promoter_id', promoterId)
        .order('date', { ascending: false });
    }, 'PromoterService.getConcerts');
  }

  /**
   * Search promoters by name
   */
  async search(query: string, limit: number = 10): Promise<ServiceResponse<Promoter[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('promoters')
        .select('id, name, description, website')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);
    }, 'PromoterService.search');
  }

  /**
   * Create a new promoter
   */
  async create(data: PromoterInsert): Promise<ServiceResponse<Promoter>> {
    return handleServiceCall(async () => {
      const { data: promoter, error } = await supabase
        .from('promoters')
        .insert(data)
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .single();
      
      return { data: promoter, error };
    }, 'PromoterService.create');
  }

  /**
   * Update an existing promoter
   */
  async update(id: string, data: PromoterUpdate): Promise<ServiceResponse<Promoter>> {
    return handleServiceCall(async () => {
      const { data: promoter, error } = await supabase
        .from('promoters')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .single();
      
      return { data: promoter, error };
    }, 'PromoterService.update');
  }

  /**
   * Delete a promoter
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('promoters')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'PromoterService.delete');
  }
}

export const promoterService = new PromoterServiceClass();
