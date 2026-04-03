import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FanProject {
    id: string;
    name: string;
    description: string;
    concert: {
        id: string;
        title: string;
        date: string;
        image_url: string;
        artist_id: string;
        artist: {
            name: string;
            photo_url: string | null;
        } | null;
        venue: {
            name: string;
            location: string;
        } | null;
    };
    songs_count: number;
}

/**
 * Hook to fetch all active Fan Projects with caching
 * 
 * Caching strategy:
 * - staleTime: 10 minutes (projects don't change frequently)
 * - Reduces queries from N+2 to 1 on subsequent visits
 */
export function useFanProjects() {
    return useQuery({
        queryKey: ['fan-projects'],
        queryFn: async () => {
            // 1. Fetch projects
            const { data: projects, error } = await supabase
                .from('fan_projects')
                .select(`
          id,
          name,
          description,
          concert:concerts (
            id,
            title,
            date,
            image_url,
            artist_id,
            venue:venues (name, location)
          )
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Get unique artist IDs
            const artistIds = [...new Set(
                (projects || []).map((p: any) => p.concert?.artist_id).filter(Boolean)
            )];

            // 3. Fetch all artists in one query
            let artistsMap: Record<string, any> = {};
            if (artistIds.length > 0) {
                const { data: artistsData } = await supabase
                    .from('artists')
                    .select('id, name, photo_url')
                    .in('id', artistIds);

                if (artistsData) {
                    artistsMap = artistsData.reduce((acc: any, artist: any) => {
                        acc[artist.id] = artist;
                        return acc;
                    }, {});
                }
            }

            // 4. Get song counts for each project
            const projectsWithCounts = await Promise.all(
                (projects || []).map(async (project: any) => {
                    const { count } = await supabase
                        .from('fan_project_songs')
                        .select('*', { count: 'exact', head: true })
                        .eq('fan_project_id', project.id);

                    const artist = project.concert?.artist_id
                        ? artistsMap[project.concert.artist_id]
                        : null;

                    return {
                        ...project,
                        concert: {
                            ...project.concert,
                            artist: artist
                        },
                        songs_count: count || 0,
                    };
                })
            );

            return projectsWithCounts as FanProject[];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - projects don't change often
    });
}
