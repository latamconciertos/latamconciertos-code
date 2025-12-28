/**
 * Setlists Page Query Hook
 * 
 * Provides data fetching for the Setlists listing page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

export interface ConcertWithSetlist {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  artist: {
    name: string;
    slug: string;
    photo_url?: string | null;
  } | null;
  venue: {
    name: string;
    location: string | null;
    city: {
      slug: string;
    } | null;
  } | null;
  setlist_count: number;
}

type SetlistFilter = 'all' | 'past' | 'upcoming' | 'no-setlist';

/**
 * Fetch concerts with their setlist counts
 */
export function useSetlistsPage(filter: SetlistFilter = 'all') {
  return useQuery({
    queryKey: [...queryKeys.setlists.all, 'page', filter],
    queryFn: async () => {
      if (filter === 'no-setlist') {
        // Fetch concerts without approved setlist songs
        const { data: allConcerts, error: allError } = await supabase
          .from('concerts')
          .select(`
            id,
            title,
            slug,
            date,
            image_url,
            artist:artists(name, slug, photo_url),
            venue:venues(name, location, city:cities(slug))
          `)
          .order('date', { ascending: false });

        if (allError) throw allError;

        // Get concert IDs that have approved setlist songs
        const { data: concertsWithSetlists, error: setlistError } = await supabase
          .from('setlist_songs')
          .select('concert_id')
          .eq('status', 'approved');

        if (setlistError) throw setlistError;

        const concertIdsWithSetlists = new Set(concertsWithSetlists?.map(s => s.concert_id) || []);
        const concertsWithoutSetlists = allConcerts?.filter(c => !concertIdsWithSetlists.has(c.id)) || [];

        return concertsWithoutSetlists.map(c => ({ ...c, setlist_count: 0 })) as ConcertWithSetlist[];
      }

      // Fetch concerts with filter
      let query = supabase
        .from('concerts')
        .select(`
          id,
          title,
          slug,
          date,
          image_url,
          artist:artists(name, slug, photo_url),
          venue:venues(name, location, city:cities(slug))
        `);

      if (filter === 'past') {
        query = query.lt('date', new Date().toISOString());
      } else if (filter === 'upcoming') {
        query = query.gte('date', new Date().toISOString());
      }

      const { data: concertsData, error: concertsError } = await query.order('date', { ascending: false });

      if (concertsError) throw concertsError;

      // Count setlist songs for each concert
      const concertsWithCounts = await Promise.all(
        (concertsData || []).map(async (concert) => {
          const { count } = await supabase
            .from('setlist_songs')
            .select('*', { count: 'exact', head: true })
            .eq('concert_id', concert.id)
            .eq('status', 'approved');

          return { ...concert, setlist_count: count || 0 };
        })
      );

      // Filter out concerts with no setlist songs (unless showing all)
      return concertsWithCounts.filter(c => c.setlist_count > 0) as ConcertWithSetlist[];
    },
  });
}
