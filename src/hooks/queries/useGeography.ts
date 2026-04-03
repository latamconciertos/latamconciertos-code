/**
 * Geography Query Hooks
 * 
 * React Query hooks for country and city data fetching with automatic caching,
 * loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { geographyService } from '@/services/geographyService';
import { queryKeys } from './queryKeys';
import type { Country, CountryBasic, City, CityBasic } from '@/types/entities';

// ==========================================================================
// Country Hooks
// ==========================================================================

/**
 * Hook to fetch all countries
 */
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.geography.countries.list(),
    queryFn: async () => {
      const result = await geographyService.getCountries();
      if (!result.success) throw new Error(result.error || 'Failed to fetch countries');
      return result.data as Country[];
    },
    staleTime: 1000 * 60 * 60, // Countries rarely change, cache for 1 hour
  });
}

/**
 * Hook to fetch countries for dropdown selectors
 */
export function useCountryOptions() {
  return useQuery({
    queryKey: queryKeys.geography.countries.options(),
    queryFn: async () => {
      const result = await geographyService.getCountryOptions();
      if (!result.success) throw new Error(result.error || 'Failed to fetch country options');
      return result.data as CountryBasic[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook to fetch a single country by ID
 */
export function useCountryById(id: string) {
  return useQuery({
    queryKey: queryKeys.geography.countries.detail(id),
    queryFn: async () => {
      const result = await geographyService.getCountryById(id);
      if (!result.success) throw new Error(result.error || 'Failed to fetch country');
      return result.data as Country;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook to fetch a country by ISO code
 */
export function useCountryByIsoCode(isoCode: string) {
  return useQuery({
    queryKey: queryKeys.geography.countries.byIsoCode(isoCode),
    queryFn: async () => {
      const result = await geographyService.getCountryByIsoCode(isoCode);
      if (!result.success) throw new Error(result.error || 'Failed to fetch country');
      return result.data as Country;
    },
    enabled: !!isoCode,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook to detect user's country via IP geolocation
 */
export function useUserCountry() {
  return useQuery({
    queryKey: queryKeys.geography.userCountry(),
    queryFn: async () => {
      const result = await geographyService.detectUserCountry();
      if (!result.success) return null;
      return result.data as Country | null;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 1,
  });
}

// ==========================================================================
// City Hooks
// ==========================================================================

/**
 * Hook to fetch all cities
 */
export function useCities() {
  return useQuery({
    queryKey: queryKeys.geography.cities.list(),
    queryFn: async () => {
      const result = await geographyService.getCities();
      if (!result.success) throw new Error(result.error || 'Failed to fetch cities');
      return result.data as City[];
    },
  });
}

/**
 * Hook to fetch cities by country
 */
export function useCitiesByCountry(countryId: string) {
  return useQuery({
    queryKey: queryKeys.geography.cities.byCountry(countryId),
    queryFn: async () => {
      const result = await geographyService.getCitiesByCountry(countryId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch cities');
      return result.data as CityBasic[];
    },
    enabled: !!countryId,
  });
}

/**
 * Hook to fetch a single city by ID
 */
export function useCityById(id: string) {
  return useQuery({
    queryKey: queryKeys.geography.cities.detail(id),
    queryFn: async () => {
      const result = await geographyService.getCityById(id);
      if (!result.success) throw new Error(result.error || 'Failed to fetch city');
      return result.data as City;
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch a city by slug
 */
export function useCityBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.geography.cities.bySlug(slug),
    queryFn: async () => {
      const result = await geographyService.getCityBySlug(slug);
      if (!result.success) throw new Error(result.error || 'Failed to fetch city');
      return result.data as City;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to search cities by name
 */
export function useCitySearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.geography.cities.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const result = await geographyService.searchCities(query, limit);
      if (!result.success) throw new Error(result.error || 'Failed to search cities');
      return result.data as CityBasic[];
    },
    enabled: query.length >= 2,
  });
}
