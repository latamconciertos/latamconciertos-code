/**
 * Venue Detail Query Hook
 * 
 * Provides data fetching for the Venue detail page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VenueDetail {
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

export interface VenueDetailConcert {
    id: string;
    title: string;
    date: string;
    image_url: string | null;
    slug: string;
    artists?: {
        id: string;
        name: string;
        slug: string;
        photo_url: string | null;
    };
}

/**
 * Fetch venue details by slug
 */
export function useVenueDetail(slug: string | undefined) {
    return useQuery({
        queryKey: ['venues', 'detail', slug],
        queryFn: async () => {
            if (!slug) return null;

            const { data, error } = await supabase
                .from('venues')
                .select(`
          *,
          cities (
            id, name, slug,
            countries (id, name, iso_code)
          )
        `)
                .eq('slug', slug)
                .single();

            if (error) throw error;
            console.log('Venue detail loaded:', { slug, venueId: data?.id, venueName: data?.name });
            return data as VenueDetail;
        },
        enabled: !!slug,
    });
}

/**
 * Fetch concerts for a venue (for detail page)
 */
export function useVenueDetailConcerts(venueId: string | undefined) {
    return useQuery({
        queryKey: ['venues', 'detail-concerts', venueId],
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
          venue_id,
          artists (
            id,
            name,
            slug,
            photo_url
          )
        `)
                .eq('venue_id', venueId)
                .order('date', { ascending: true });


            console.log('Venue detail concerts query:', {
                venueId,
                dataLength: data?.length || 0,
                data,
                error,
                query: `SELECT * FROM concerts WHERE venue_id = '${venueId}'`
            });
            if (error) throw error;
            return (data || []) as VenueDetailConcert[];
        },
        enabled: !!venueId,
    });
}
