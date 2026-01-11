import { supabase } from '@/integrations/supabase/client';
import type { CDNProjectSequences, CDNSongSequence } from '@/types/cdnSequence';
import { CDNStorageUploader } from './cdnStorageUploader';

/**
 * Service for generating CDN-ready sequence files
 * 
 * This service generates static JSON files that can be served from a CDN
 * to reduce database load during high-traffic events
 */
export class CDNSequenceGenerator {
    private static readonly CDN_VERSION = '1.0.0';

    /**
     * Generate CDN sequences for all sections of a fan project
     * @param projectId - The fan project ID
     * @returns Array of CDN sequence objects ready to be saved to files
     */
    static async generateProjectSequences(
        projectId: string
    ): Promise<CDNProjectSequences[]> {
        try {
            // 1. Get project details
            const { data: project, error: projectError } = await supabase
                .from('fan_projects')
                .select(`
          id,
          name,
          concert_id,
          concert:concerts (id)
        `)
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;
            if (!project) throw new Error('Project not found');

            // 2. Get all venue sections for this project
            const { data: sections, error: sectionsError } = await supabase
                .from('venue_sections')
                .select('id, name')
                .eq('fan_project_id', projectId)
                .order('display_order');

            if (sectionsError) throw sectionsError;
            if (!sections || sections.length === 0) {
                throw new Error('No venue sections found for this project');
            }

            // 3. Get all songs for this project
            const { data: songs, error: songsError } = await supabase
                .from('fan_project_songs')
                .select('*')
                .eq('fan_project_id', projectId)
                .order('position');

            if (songsError) throw songsError;
            if (!songs || songs.length === 0) {
                throw new Error('No songs found for this project');
            }

            // 4. For each section, generate a complete sequence file
            const cdnSequences: CDNProjectSequences[] = [];

            for (const section of sections) {
                const songSequences: CDNSongSequence[] = [];

                // Get sequences for all songs in this section
                for (const song of songs) {
                    const { data: colorSeq, error: colorSeqError } = await supabase
                        .from('fan_project_color_sequences')
                        .select('sequence, mode')
                        .eq('fan_project_song_id', song.id)
                        .eq('venue_section_id', section.id)
                        .single();

                    if (colorSeqError) {
                        console.warn(
                            `No sequence found for song ${song.id} in section ${section.id}:`,
                            colorSeqError
                        );
                        continue;
                    }

                    songSequences.push({
                        song_id: song.id,
                        song_name: song.song_name,
                        artist_name: song.artist_name,
                        duration_seconds: song.duration_seconds,
                        mode: colorSeq.mode as 'fixed' | 'strobe',
                        sequence: colorSeq.sequence as any,
                    });
                }

                // Only include sections that have at least one sequence
                if (songSequences.length > 0) {
                    cdnSequences.push({
                        project_id: projectId,
                        project_name: project.name,
                        section_id: section.id,
                        section_name: section.name,
                        concert_id: project.concert_id,
                        generated_at: new Date().toISOString(),
                        version: this.CDN_VERSION,
                        songs: songSequences,
                    });
                }
            }

            return cdnSequences;
        } catch (error) {
            console.error('Error generating CDN sequences:', error);
            throw error;
        }
    }

    /**
     * Generate sequences and automatically upload to Supabase Storage
     * @param projectId - The fan project ID
     * @returns Object with uploaded URLs for each section
     */
    static async generateAndUploadProjectSequences(
        projectId: string
    ): Promise<{ [sectionId: string]: string }> {
        try {
            // Generate sequences
            const sequences = await this.generateProjectSequences(projectId);

            // Upload to Supabase Storage
            const uploadedUrls = await CDNStorageUploader.uploadProjectSequences(sequences);

            console.log(`✅ Generated and uploaded ${sequences.length} sections for project ${projectId}`);

            return uploadedUrls;
        } catch (error) {
            console.error('Error in generateAndUploadProjectSequences:', error);
            throw error;
        }
    }

    /**
     * Get CDN file path for a specific section
     * @param projectId - Project ID
     * @param sectionId - Section ID
     * @returns Relative path to CDN file
     */
    static getCDNPath(projectId: string, sectionId: string): string {
        return `/cdn/sequences/${projectId}/${sectionId}.json`;
    }

    /**
     * Get public URL for CDN sequence file
     * Prioritizes Supabase Storage, falls back to local path
     * @param projectId - Project ID
     * @param sectionId - Section ID
     * @returns Full URL to CDN file
     */
    static getCDNUrl(projectId: string, sectionId: string): string {
        // Try Supabase Storage first (automatic uploads)
        const storageUrl = CDNStorageUploader.getPublicUrl(projectId, sectionId);
        if (storageUrl) {
            return storageUrl;
        }

        // Fallback to local path (manual commit/deploy)
        const path = this.getCDNPath(projectId, sectionId);
        return path;
    }
}
