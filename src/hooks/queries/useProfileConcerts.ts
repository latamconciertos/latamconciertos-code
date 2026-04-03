/**
 * Profile Concerts Query Hook
 * 
 * Fetches user's concerts categorized by attendance status
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileConcert {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  attendance_type: string | null;
  is_favorite: boolean | null;
  artist?: {
    name: string;
    photo_url: string | null;
  } | null;
  venue?: {
    name: string;
    city?: {
      name: string;
    } | null;
  } | null;
}

interface ProfileConcertsData {
  upcoming: ProfileConcert[];
  attended: ProfileConcert[];
  favorites: ProfileConcert[];
  stats: {
    totalConcerts: number;
    upcomingCount: number;
    attendedCount: number;
    favoritesCount: number;
  };
}

export function useProfileConcerts(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'concerts', userId],
    queryFn: async (): Promise<ProfileConcertsData> => {
      if (!userId) {
        return {
          upcoming: [],
          attended: [],
          favorites: [],
          stats: { totalConcerts: 0, upcomingCount: 0, attendedCount: 0, favoritesCount: 0 }
        };
      }

      // Fetch user's favorite concerts with concert details
      const { data: favoriteConcerts, error } = await supabase
        .from('favorite_concerts')
        .select(`
          attendance_type,
          is_favorite,
          concerts (
            id,
            title,
            slug,
            date,
            image_url,
            artists (
              name,
              photo_url
            ),
            venues (
              name,
              cities (
                name
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      const upcoming: ProfileConcert[] = [];
      const attended: ProfileConcert[] = [];
      const favorites: ProfileConcert[] = [];

      (favoriteConcerts || []).forEach((fc: any) => {
        if (!fc.concerts) return;
        
        const concert: ProfileConcert = {
          id: fc.concerts.id,
          title: fc.concerts.title,
          slug: fc.concerts.slug,
          date: fc.concerts.date,
          image_url: fc.concerts.image_url,
          attendance_type: fc.attendance_type,
          is_favorite: fc.is_favorite,
          artist: fc.concerts.artists,
          venue: fc.concerts.venues ? {
            name: fc.concerts.venues.name,
            city: fc.concerts.venues.cities
          } : null
        };

        // Categorize
        if (fc.is_favorite) {
          favorites.push(concert);
        }

        const isAttending = fc.attendance_type === 'attending' || fc.attendance_type === 'tentative';
        
        if (isAttending && fc.concerts.date) {
          if (fc.concerts.date >= today) {
            upcoming.push(concert);
          } else {
            attended.push(concert);
          }
        }
      });

      // Sort by date
      upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      attended.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      favorites.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      return {
        upcoming,
        attended,
        favorites,
        stats: {
          totalConcerts: upcoming.length + attended.length,
          upcomingCount: upcoming.length,
          attendedCount: attended.length,
          favoritesCount: favorites.length
        }
      };
    },
    enabled: !!userId,
  });
}

/**
 * Fetch friends count for user
 */
export function useFriendsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'friendsCount', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}
