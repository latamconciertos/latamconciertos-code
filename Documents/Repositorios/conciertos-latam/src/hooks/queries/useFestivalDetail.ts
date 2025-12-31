/**
 * Festival Detail Query Hook
 * 
 * Provides data fetching for the Festival Detail page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService } from '@/lib/spotify';
import { queryKeys } from './queryKeys';

export interface FestivalLineupArtist {
    id: string;
    position: number;
    stage: string | null;
    performance_date: string | null;
    artists: {
        id: string;
        name: string;
        slug: string;
        photo_url: string | null;
    };
    artistImage?: string | null;
}

export interface FestivalDetail {
    id: string;
    name: string;
    slug: string;
    start_date: string | null;
    end_date: string | null;
    edition: number | null;
    image_url: string | null;
    ticket_url: string | null;
    description: string | null;
    venue_id: string | null;
    venues?: {
        name: string;
        location: string | null;
        cities?: {
            name: string;
            slug: string;
            countries?: {
                name: string;
            } | null;
        } | null;
    } | null;
    promoters?: {
        name: string;
    } | null;
}

interface FestivalDetailResult {
    festival: FestivalDetail;
    lineup: FestivalLineupArtist[];
}

/**
 * Fetch festival by slug with lineup from festival_lineup table
 */
export function useFestivalDetail(slug: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.festivals.details(), slug || '', 'full'],
        queryFn: async (): Promise<FestivalDetailResult | null> => {
            if (!slug) return null;

            // Fetch festival data
            const { data, error } = await supabase
                .from('festivals')
                .select(`
          *,
          venues (
            name,
            location,
            cities (
              name,
              slug,
              countries (name)
            )
          ),
          promoters (name)
        `)
                .eq('slug', slug)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            // Fetch lineup from festival_lineup table
            const { data: lineupData, error: lineupError } = await supabase
                .from('festival_lineup')
                .select(`
          id,
          position,
          stage,
          performance_date,
          artists (
            id,
            name,
            slug,
            photo_url
          )
        `)
                .eq('festival_id', data.id)
                .order('position', { ascending: true });

            if (lineupError) throw lineupError;

            // Fetch Spotify images for each artist
            const lineupWithImages = await Promise.all(
                (lineupData || []).map(async (item) => {
                    const artistImage = await spotifyService.getArtistImage(
                        item.artists.name,
                        item.artists.photo_url
                    );
                    return {
                        ...item,
                        artistImage,
                    } as FestivalLineupArtist;
                })
            );

            return {
                festival: data as FestivalDetail,
                lineup: lineupWithImages,
            };
        },
        enabled: !!slug,
    });
}
