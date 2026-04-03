import { supabase } from '@/integrations/supabase/client';
import type { CDNProjectSequences } from '@/types/cdnSequence';

/**
 * Service for uploading CDN sequence files to Supabase Storage
 * 
 * This eliminates the need for manual git commits by automatically
 * uploading generated JSON files to Supabase Storage CDN
 */
export class CDNStorageUploader {
    private static readonly BUCKET_NAME = 'fan-project-cdn';

    /**
     * Upload a CDN sequence file to Supabase Storage
     * @param projectId - Fan project ID
     * @param sectionId - Venue section ID
     * @param data - CDN sequence data
     * @returns URL to the uploaded file
     */
    static async uploadSequenceFile(
        projectId: string,
        sectionId: string,
        data: CDNProjectSequences
    ): Promise<string | null> {
        try {
            const filePath = `${projectId}/${sectionId}.json`;
            const fileContent = JSON.stringify(data);
            const blob = new Blob([fileContent], { type: 'application/json' });

            // Upload to Supabase Storage (upsert = overwrite if exists)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, blob, {
                    contentType: 'application/json',
                    cacheControl: '3600', // Cache for 1 hour
                    upsert: true, // Overwrite if exists
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading to Storage:', error);
            return null;
        }
    }

    /**
     * Upload all sequences for a fan project
     * @param sequences - Array of CDN sequences to upload
     * @returns Object with uploaded URLs
     */
    static async uploadProjectSequences(
        sequences: CDNProjectSequences[]
    ): Promise<{ [sectionId: string]: string }> {
        const uploadedUrls: { [sectionId: string]: string } = {};

        for (const sequence of sequences) {
            const url = await this.uploadSequenceFile(
                sequence.project_id,
                sequence.section_id,
                sequence
            );

            if (url) {
                uploadedUrls[sequence.section_id] = url;
            }
        }

        return uploadedUrls;
    }

    /**
     * Get public URL for a CDN sequence file
     * @param projectId - Fan project ID
     * @param sectionId - Venue section ID
     * @returns Public URL to the file
     */
    static getPublicUrl(projectId: string, sectionId: string): string {
        const filePath = `${projectId}/${sectionId}.json`;
        const { data } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Delete CDN files for a project
     * @param projectId - Fan project ID
     */
    static async deleteProjectFiles(projectId: string): Promise<boolean> {
        try {
            // List all files for this project
            const { data: files, error: listError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list(projectId);

            if (listError || !files) {
                console.error('Error listing files:', listError);
                return false;
            }

            if (files.length === 0) {
                return true; // No files to delete
            }

            // Delete all files
            const filePaths = files.map(file => `${projectId}/${file.name}`);
            const { error: deleteError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove(filePaths);

            if (deleteError) {
                console.error('Error deleting files:', deleteError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteProjectFiles:', error);
            return false;
        }
    }
}
