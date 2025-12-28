/**
 * Venue Service
 * 
 * Handles all venue-related database operations including
 * CRUD operations and location-based queries.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Venue,
  VenueBasic,
  VenueWithLocation,
  VenueInsert,
  VenueUpdate,
  VenueSection,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, SELECT_QUERIES } from './base';

export interface VenueFilterOptions {
  cityId?: string;
  countryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class VenueServiceClass {
  /**
   * Get all venues with optional filtering
   */
  async getAll(options?: VenueFilterOptions): Promise<ServiceResponse<VenueWithLocation[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('venues')
        .select(SELECT_QUERIES.venueWithLocation, { count: 'exact' })
        .order('name', { ascending: true });

      if (options?.cityId) {
        query = query.eq('city_id', options.cityId);
      }

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'VenueService.getAll');
  }

  /**
   * Get a single venue by ID
   */
  async getById(id: string): Promise<ServiceResponse<VenueWithLocation>> {
    return handleServiceCall(async () => {
      return supabase
        .from('venues')
        .select(SELECT_QUERIES.venueWithLocation)
        .eq('id', id)
        .single();
    }, 'VenueService.getById');
  }

  /**
   * Get a single venue by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<VenueWithLocation>> {
    return handleServiceCall(async () => {
      return supabase
        .from('venues')
        .select(SELECT_QUERIES.venueWithLocation)
        .eq('slug', slug)
        .single();
    }, 'VenueService.getBySlug');
  }

  /**
   * Get venues by city
   */
  async getByCity(cityId: string): Promise<ServiceResponse<VenueBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('venues')
        .select('id, name, slug, location, capacity')
        .eq('city_id', cityId)
        .order('name', { ascending: true });
    }, 'VenueService.getByCity');
  }

  /**
   * Search venues by name
   */
  async search(query: string, limit: number = 10): Promise<ServiceResponse<VenueBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('venues')
        .select('id, name, slug, location, capacity')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);
    }, 'VenueService.search');
  }

  /**
   * Create a new venue
   */
  async create(data: VenueInsert): Promise<ServiceResponse<Venue>> {
    return handleServiceCall(async () => {
      const { data: venue, error } = await supabase
        .from('venues')
        .insert(data)
        .select(SELECT_QUERIES.venueWithLocation)
        .single();
      
      return { data: venue, error };
    }, 'VenueService.create');
  }

  /**
   * Update an existing venue
   */
  async update(id: string, data: VenueUpdate): Promise<ServiceResponse<Venue>> {
    return handleServiceCall(async () => {
      const { data: venue, error } = await supabase
        .from('venues')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.venueWithLocation)
        .single();
      
      return { data: venue, error };
    }, 'VenueService.update');
  }

  /**
   * Delete a venue
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'VenueService.delete');
  }

  /**
   * Get venue sections for a fan project
   */
  async getSections(fanProjectId: string): Promise<ServiceResponse<VenueSection[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('venue_sections')
        .select('*')
        .eq('fan_project_id', fanProjectId)
        .order('display_order', { ascending: true });
    }, 'VenueService.getSections');
  }

  /**
   * Create a venue section
   */
  async createSection(data: {
    fan_project_id: string;
    name: string;
    code: string;
    display_order?: number;
  }): Promise<ServiceResponse<VenueSection>> {
    return handleServiceCall(async () => {
      const { data: section, error } = await supabase
        .from('venue_sections')
        .insert(data)
        .select('*')
        .single();
      
      return { data: section, error };
    }, 'VenueService.createSection');
  }

  /**
   * Delete a venue section
   */
  async deleteSection(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('venue_sections')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'VenueService.deleteSection');
  }
}

export const venueService = new VenueServiceClass();
