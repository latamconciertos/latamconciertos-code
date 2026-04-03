/**
 * Venues Page Query Hook
 * 
 * Provides data fetching for the Venues listing page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VenueWithCity {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    address: string | null;
    capacity: number | null;
    image_url: string | null;
    city_id: string | null;
    cities?: {
        id: string;
        name: string;
        slug: string;
        countries?: {
            id: string;
            name: string;
            iso_code: string;
        };
    };
}

export interface VenueConcert {
    id: string;
    title: string;
    date: string;
    image_url: string | null;
    slug: string;
    status: string;
    artists?: {
        name: string;
        photo_url: string | null;
    };
}

/**
 * Fetch all venues with optional country and city filter
 */
export function useVenuesPage(selectedCountry: string = 'all', selectedCity: string = 'all') {
    return useQuery({
        queryKey: ['venues', 'page', selectedCountry, selectedCity],
        queryFn: async () => {
            // First, if we have a country filter, get the cities in that country
            let cityIds: string[] | null = null;

            if (selectedCountry !== 'all' && selectedCity === 'all') {
                const { data: cities } = await supabase
                    .from('cities')
                    .select('id')
                    .eq('country_id', selectedCountry);

                cityIds = cities?.map(c => c.id) || [];
            }

            let query = supabase
                .from('venues')
                .select(`
          *,
          cities (
            id, name, slug,
            countries (id, name, iso_code)
          )
        `)
                .order('name');

            // Apply city filter
            if (selectedCity !== 'all') {
                query = query.eq('city_id', selectedCity);
            } else if (cityIds !== null && cityIds.length > 0) {
                query = query.in('city_id', cityIds);
            } else if (cityIds !== null && cityIds.length === 0) {
                // No cities in this country, return empty
                return [];
            }

            const { data, error } = await query;
            console.log('Venues query result:', { data, error, selectedCountry, selectedCity });
            if (error) throw error;
            return (data || []) as VenueWithCity[];
        },
    });
}

/**
 * Fetch concerts for a specific venue
 */
export function useVenueConcerts(venueId: string | null) {
    return useQuery({
        queryKey: ['venues', 'concerts', venueId],
        queryFn: async () => {
            if (!venueId) return [];

            const { data, error } = await supabase
                .from('concerts')
                .select(`
          id,
          title,
          date,
          image_url,
          slug,
          status,
          artists (
            name,
            photo_url
          )
        `)
                .eq('venue_id', venueId)
                .order('date', { ascending: true });

            console.log('Venue concerts query result:', { venueId, data, error });
            if (error) throw error;
            return (data || []) as VenueConcert[];
        },
        enabled: !!venueId,
    });
}

/**
 * Fetch cities by country for the filter
 */
export function useCitiesByCountryForVenues(countryId: string | null) {
    return useQuery({
        queryKey: ['cities', 'byCountry', countryId],
        queryFn: async () => {
            if (!countryId || countryId === 'all') return [];

            const { data, error } = await supabase
                .from('cities')
                .select('id, name')
                .eq('country_id', countryId)
                .order('name');

            if (error) throw error;
            return data || [];
        },
        enabled: !!countryId && countryId !== 'all',
    });
}
