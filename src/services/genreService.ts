/**
 * Genre Service
 * 
 * Handles genre mapping queries from the database
 */

import { supabase } from '@/integrations/supabase/client';
import type { ServiceResponse } from '@/types/entities';
import { handleServiceCall } from './base';

export interface MainGenre {
    name: string;
    count: number;
}

class GenreServiceClass {
    /**
     * Get all main (curated) genres with concert count
     */
    async getMainGenres(): Promise<ServiceResponse<MainGenre[]>> {
        return handleServiceCall(async () => {
            const { data, error } = await supabase
                .from('genre_mappings')
                .select('main_genre')
                .order('main_genre');

            if (error) return { data: [], error };

            // Get unique main genres
            const uniqueGenres = [...new Set(data.map((g: any) => g.main_genre))].sort();

            return {
                data: uniqueGenres.map(name => ({ name, count: 0 })),
                error: null
            };
        }, 'GenreService.getMainGenres');
    }

    /**
     * Get all Spotify genres that map to a main genre
     */
    async getSpotifyGenresForMainGenre(mainGenre: string): Promise<ServiceResponse<string[]>> {
        return handleServiceCall(async () => {
            const { data, error } = await supabase
                .from('genre_mappings')
                .select('spotify_genre')
                .eq('main_genre', mainGenre);

            if (error) return { data: [], error };

            return {
                data: data.map((g: any) => g.spotify_genre),
                error: null
            };
        }, 'GenreService.getSpotifyGenresForMainGenre');
    }
}

export const genreService = new GenreServiceClass();
