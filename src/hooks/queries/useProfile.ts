/**
 * Profile Query Hook
 * 
 * Provides data fetching for the user Profile page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  country_id: string | null;
  city_id: string | null;
  birth_date: string | null;
  favorite_artists: any;
}

export interface Country {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
}

export interface Artist {
  id: string;
  name: string;
}

/**
 * Fetch current user profile
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch all countries
 */
export function useProfileCountries() {
  return useQuery({
    queryKey: ['profile', 'countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return (data || []) as Country[];
    },
  });
}

/**
 * Fetch cities by country
 */
export function useProfileCities(countryId: string | null) {
  return useQuery({
    queryKey: ['profile', 'cities', countryId],
    queryFn: async () => {
      if (!countryId) return [];

      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      return (data || []) as City[];
    },
    enabled: !!countryId,
  });
}

/**
 * Fetch all artists for favorites
 */
export function useProfileArtists() {
  return useQuery({
    queryKey: ['profile', 'artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return (data || []) as Artist[];
    },
  });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      profileData, 
      favoriteArtists 
    }: { 
      userId: string; 
      profileData: Partial<UserProfile>; 
      favoriteArtists: string[]; 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          favorite_artists: favoriteArtists,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}
