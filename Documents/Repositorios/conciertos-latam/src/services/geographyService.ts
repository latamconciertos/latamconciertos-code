/**
 * Geography Service
 * 
 * Handles all geography-related database operations including
 * countries, cities, and location detection.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Country,
  CountryBasic,
  City,
  CityBasic,
  CountryInsert,
  CountryUpdate,
  CityInsert,
  CityUpdate,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray } from './base';

class GeographyServiceClass {
  // ==========================================================================
  // Country Operations
  // ==========================================================================

  /**
   * Get all countries
   */
  async getCountries(): Promise<ServiceResponse<Country[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });
    }, 'GeographyService.getCountries');
  }

  /**
   * Get countries for dropdown selectors
   */
  async getCountryOptions(): Promise<ServiceResponse<CountryBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('countries')
        .select('id, name, iso_code')
        .order('name', { ascending: true });
    }, 'GeographyService.getCountryOptions');
  }

  /**
   * Get a single country by ID
   */
  async getCountryById(id: string): Promise<ServiceResponse<Country>> {
    return handleServiceCall(async () => {
      return supabase
        .from('countries')
        .select('*')
        .eq('id', id)
        .single();
    }, 'GeographyService.getCountryById');
  }

  /**
   * Get a country by ISO code
   */
  async getCountryByIsoCode(isoCode: string): Promise<ServiceResponse<Country>> {
    return handleServiceCall(async () => {
      return supabase
        .from('countries')
        .select('*')
        .eq('iso_code', isoCode.toUpperCase())
        .single();
    }, 'GeographyService.getCountryByIsoCode');
  }

  /**
   * Create a new country (admin only)
   */
  async createCountry(data: CountryInsert): Promise<ServiceResponse<Country>> {
    return handleServiceCall(async () => {
      const { data: country, error } = await supabase
        .from('countries')
        .insert(data)
        .select('*')
        .single();
      
      return { data: country, error };
    }, 'GeographyService.createCountry');
  }

  /**
   * Update a country (admin only)
   */
  async updateCountry(id: string, data: CountryUpdate): Promise<ServiceResponse<Country>> {
    return handleServiceCall(async () => {
      const { data: country, error } = await supabase
        .from('countries')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      return { data: country, error };
    }, 'GeographyService.updateCountry');
  }

  /**
   * Delete a country (admin only)
   */
  async deleteCountry(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'GeographyService.deleteCountry');
  }

  // ==========================================================================
  // City Operations
  // ==========================================================================

  /**
   * Get all cities
   */
  async getCities(): Promise<ServiceResponse<City[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('cities')
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .order('name', { ascending: true });
    }, 'GeographyService.getCities');
  }

  /**
   * Get cities by country
   */
  async getCitiesByCountry(countryId: string): Promise<ServiceResponse<CityBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('cities')
        .select('id, name, slug')
        .eq('country_id', countryId)
        .order('name', { ascending: true });
    }, 'GeographyService.getCitiesByCountry');
  }

  /**
   * Get a single city by ID
   */
  async getCityById(id: string): Promise<ServiceResponse<City>> {
    return handleServiceCall(async () => {
      return supabase
        .from('cities')
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .eq('id', id)
        .single();
    }, 'GeographyService.getCityById');
  }

  /**
   * Get a city by slug
   */
  async getCityBySlug(slug: string): Promise<ServiceResponse<City>> {
    return handleServiceCall(async () => {
      return supabase
        .from('cities')
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .eq('slug', slug)
        .single();
    }, 'GeographyService.getCityBySlug');
  }

  /**
   * Search cities by name
   */
  async searchCities(query: string, limit: number = 10): Promise<ServiceResponse<CityBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('cities')
        .select('id, name, slug')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);
    }, 'GeographyService.searchCities');
  }

  /**
   * Create a new city (admin only)
   */
  async createCity(data: CityInsert): Promise<ServiceResponse<City>> {
    return handleServiceCall(async () => {
      const { data: city, error } = await supabase
        .from('cities')
        .insert(data)
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .single();
      
      return { data: city, error };
    }, 'GeographyService.createCity');
  }

  /**
   * Update a city (admin only)
   */
  async updateCity(id: string, data: CityUpdate): Promise<ServiceResponse<City>> {
    return handleServiceCall(async () => {
      const { data: city, error } = await supabase
        .from('cities')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          countries (id, name, iso_code)
        `)
        .single();
      
      return { data: city, error };
    }, 'GeographyService.updateCity');
  }

  /**
   * Delete a city (admin only)
   */
  async deleteCity(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'GeographyService.deleteCity');
  }

  // ==========================================================================
  // User Location Detection
  // ==========================================================================

  /**
   * Detect user's country based on IP (via edge function)
   */
  async detectUserCountry(): Promise<ServiceResponse<Country | null>> {
    return handleServiceCall(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('detect-user-country');
        
        if (error) return { data: null, error };
        
        if (data?.country_id) {
          const { data: country, error: countryError } = await supabase
            .from('countries')
            .select('*')
            .eq('id', data.country_id)
            .single();
          
          return { data: country, error: countryError };
        }
        
        return { data: null, error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    }, 'GeographyService.detectUserCountry');
  }
}

export const geographyService = new GeographyServiceClass();
