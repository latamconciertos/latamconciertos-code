import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch Fan Project details with caching
 * 
 * @param projectId - The ID of the fan project
 * @returns Query result with project data
 */
export function useFanProjectDetail(projectId: string | undefined) {
    return useQuery({
        queryKey: ['fan-project', projectId],
        queryFn: async () => {
            if (!projectId) throw new Error('Project ID required');

            // 1. Fetch project
            const { data: projectData, error: projectError } = await supabase
                .from('fan_projects')
                .select(`
          id,
          name,
          description,
          instructions,
          concert:concerts (
            id,
            title,
            date,
            artist_id,
            venue:venues (id, name)
          )
        `)
                .eq('id', projectId)
                .eq('status', 'active')
                .single();

            if (projectError) throw projectError;

            // 2. Get artist data if exists
            let artistData = null;
            if (projectData.concert?.artist_id) {
                const { data: artist } = await supabase
                    .from('artists')
                    .select('name, photo_url')
                    .eq('id', projectData.concert.artist_id)
                    .single();

                artistData = artist;
            }

            return {
                ...projectData,
                concert: {
                    ...projectData.concert,
                    artist_name: artistData?.name || projectData.concert.title.split(' - ')[0] || 'Artista',
                    artist_image_url: artistData?.photo_url || null,
                }
            };
        },
        enabled: !!projectId, // Only run if projectId exists
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to fetch Fan Project songs with caching
 */
export function useFanProjectSongs(projectId: string | undefined) {
    return useQuery({
        queryKey: ['fan-project-songs', projectId],
        queryFn: async () => {
            if (!projectId) throw new Error('Project ID required');

            const { data, error } = await supabase
                .from('fan_project_songs')
                .select('*')
                .eq('fan_project_id', projectId)
                .order('position');

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch venue sections for a Fan Project
 */
export function useFanProjectSections(projectId: string | undefined) {
    return useQuery({
        queryKey: ['fan-project-sections', projectId],
        queryFn: async () => {
            if (!projectId) throw new Error('Project ID required');

            const { data, error } = await supabase
                .from('venue_sections')
                .select('*')
                .eq('fan_project_id', projectId)
                .order('display_order');

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000, // 10 minutes - sections rarely change
    });
}

/**
 * Hook to fetch user's participation in a Fan Project
 */
export function useFanProjectParticipant(projectId: string | undefined, userId: string) {
    return useQuery({
        queryKey: ['fan-project-participant', projectId, userId],
        queryFn: async () => {
            if (!projectId || !userId) return null;

            const { data } = await supabase
                .from('fan_project_participants')
                .select('venue_section_id')
                .eq('fan_project_id', projectId)
                .eq('user_id', userId)
                .single();

            return data;
        },
        enabled: !!projectId && !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute - can change frequently
    });
}

/**
 * Hook to fetch gradient colors from first song sequence
 */
export function useFanProjectGradientColors(projectId: string | undefined) {
    return useQuery({
        queryKey: ['fan-project-gradient', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            const { data: colorSeqData } = await supabase
                .from('fan_project_color_sequences')
                .select('sequence')
                .eq('fan_project_id', projectId)
                .limit(1)
                .single();

            if (colorSeqData?.sequence && Array.isArray(colorSeqData.sequence)) {
                const colors = colorSeqData.sequence.map((block: any) => block.color).filter(Boolean);
                return colors.slice(0, 3); // First 3 colors
            }

            return [];
        },
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
