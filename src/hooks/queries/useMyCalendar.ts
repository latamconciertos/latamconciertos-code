/**
 * My Calendar Query Hook
 * 
 * Provides data fetching for the user's calendar page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarConcert {
  id: string;
  slug: string;
  title: string;
  date: string;
  image_url: string;
  ticket_url: string;
  artists: { name: string; photo_url: string } | null;
  venues: { name: string; location: string } | null;
  attendance_type: string;
}

type AttendanceType = 'attending' | 'tentative' | 'favorite';

/**
 * Fetch user's calendar concerts by attendance type
 */
export function useMyCalendarConcerts(userId: string | undefined, attendanceType: AttendanceType = 'attending') {
  return useQuery({
    queryKey: ['my-calendar', userId, attendanceType],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('favorite_concerts')
        .select(`
          concert_id,
          attendance_type,
          concerts (
            id,
            slug,
            title,
            date,
            image_url,
            ticket_url,
            artists (name, photo_url),
            venues (name, location)
          )
        `)
        .eq('user_id', userId)
        .eq('attendance_type', attendanceType);

      if (error) throw error;

      const concertsData = data
        .map(item => ({
          ...item.concerts,
          attendance_type: item.attendance_type
        }))
        .filter(concert => concert.id) as CalendarConcert[];

      // Sort by date
      concertsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return concertsData;
    },
    enabled: !!userId,
  });
}
