/**
 * Promoters Page Query Hook
 * 
 * Provides data fetching for the Promoters listing page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoterWithCountry {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  country_id: string | null;
  countries?: {
    name: string;
    iso_code: string;
  };
}

export interface PromoterConcert {
  id: string;
  title: string;
  date: string;
  image_url: string | null;
  slug: string;
  venues?: {
    name: string;
    location: string;
  };
  artists?: {
    name: string;
    photo_url: string | null;
  };
}

/**
 * Fetch all promoters with optional country filter
 */
export function usePromotersPage(selectedCountry: string = 'all') {
  return useQuery({
    queryKey: ['promoters', 'page', selectedCountry],
    queryFn: async () => {
      let query = supabase
        .from('promoters')
        .select(`
          *,
          countries (
            name,
            iso_code
          )
        `)
        .order('name');

      if (selectedCountry !== 'all') {
        query = query.eq('country_id', selectedCountry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PromoterWithCountry[];
    },
  });
}

/**
 * Fetch concerts for a specific promoter
 */
export function usePromoterConcerts(promoterId: string | null) {
  return useQuery({
    queryKey: ['promoters', 'concerts', promoterId],
    queryFn: async () => {
      if (!promoterId) return [];

      const { data, error } = await supabase
        .from('concerts')
        .select(`
          id,
          title,
          date,
          image_url,
          slug,
          venues (
            name,
            location
          ),
          artists (
            name,
            photo_url
          )
        `)
        .eq('promoter_id', promoterId)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as PromoterConcert[];
    },
    enabled: !!promoterId,
  });
}
