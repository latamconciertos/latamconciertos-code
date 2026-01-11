import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CDNSequenceGenerator } from '@/services/cdnSequenceGenerator';
import type { CDNProjectSequences } from '@/types/cdnSequence';

interface ColorBlock {
  start: number;
  end: number;
  color: string;
}

interface StoredSequence {
  projectId: string;
  songId: string;
  sectionId: string;
  sequence: ColorBlock[];
  mode: 'fixed' | 'strobe';
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'fan_project_';
const STORAGE_KEY_CDN_PREFIX = 'fan_project_cdn_';
const EXPIRY_DAYS = 30;

/**
 * Hook for managing Fan Project sequences with CDN optimization
 * 
 * Features:
 * - CDN-first loading strategy
 * - Automatic fallback to Supabase if CDN fails
 * - localStorage caching for offline use
 * - Automatic cleanup of expired data
 */
export const useFanProjectStorage = () => {
  /**
   * Load sequences from CDN (optimized for high traffic)
   * Falls back to Supabase if CDN is unavailable
   */
  const loadSequencesFromCDN = async (
    projectId: string,
    sectionId: string
  ): Promise<CDNProjectSequences | null> => {
    try {
      const cdnUrl = CDNSequenceGenerator.getCDNUrl(projectId, sectionId);

      const response = await fetch(cdnUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add cache busting only in development
        cache: import.meta.env.DEV ? 'no-cache' : 'default',
      });

      if (!response.ok) {
        console.warn(`CDN fetch failed with status ${response.status}, falling back to Supabase`);
        return null;
      }

      const data: CDNProjectSequences = await response.json();

      // Validate data structure
      if (!data.songs || !Array.isArray(data.songs)) {
        console.error('Invalid CDN data structure');
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Error loading from CDN, will fallback to Supabase:', error);
      return null;
    }
  };

  /**
   * Load sequences from Supabase (fallback method)
   * This is the original implementation, kept for backward compatibility
   */
  const loadSequencesFromSupabase = async (
    projectId: string,
    songId: string,
    sectionId: string
  ): Promise<{ sequence: ColorBlock[]; mode: 'fixed' | 'strobe' } | null> => {
    try {
      const { data, error } = await supabase
        .from('fan_project_color_sequences')
        .select('sequence, mode')
        .eq('fan_project_song_id', songId)
        .eq('venue_section_id', sectionId)
        .single();

      if (error) throw error;

      return {
        sequence: data.sequence as ColorBlock[],
        mode: data.mode as 'fixed' | 'strobe',
      };
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      return null;
    }
  };

  /**
   * Preload all sequences for a project section (CDN-optimized)
   * This is the NEW optimized method that reduces database queries from N to 1
   */
  const preloadProjectSection = async (
    projectId: string,
    sectionId: string
  ): Promise<boolean> => {
    try {
      // Try CDN first
      let cdnData = await loadSequencesFromCDN(projectId, sectionId);

      if (!cdnData) {
        console.info('CDN not available, falling back to Supabase');
        // CDN not available - return false so caller can use individual song method
        return false;
      }

      // Save entire CDN data to localStorage for offline access
      const cdnKey = `${STORAGE_KEY_CDN_PREFIX}${projectId}_${sectionId}`;
      try {
        localStorage.setItem(cdnKey, JSON.stringify({
          ...cdnData,
          timestamp: Date.now(),
        }));
      } catch (storageError) {
        console.error('localStorage quota exceeded:', storageError);
        // Continue anyway, sequences will work but won't be cached
      }

      // Also save individual sequences for backward compatibility
      cdnData.songs.forEach((song) => {
        saveSequence(
          projectId,
          song.song_id,
          sectionId,
          song.sequence,
          song.mode
        );
      });

      return true;
    } catch (error) {
      console.error('Error in preloadProjectSection:', error);
      return false;
    }
  };

  /**
   * Preload single song sequence (Supabase fallback)
   * Used when CDN is not available
   */
  const preloadSongSequence = async (
    projectId: string,
    songId: string,
    sectionId: string
  ): Promise<boolean> => {
    try {
      const supabaseData = await loadSequencesFromSupabase(projectId, songId, sectionId);

      if (!supabaseData) {
        console.error('Failed to load sequence from Supabase');
        return false;
      }

      const success = saveSequence(
        projectId,
        songId,
        sectionId,
        supabaseData.sequence,
        supabaseData.mode
      );

      return success;
    } catch (error) {
      console.error('Error in preloadSongSequence:', error);
      return false;
    }
  };

  /**
   * Save individual sequence to localStorage
   * This is the original method, kept for backward compatibility
   */
  const saveSequence = (
    projectId: string,
    songId: string,
    sectionId: string,
    sequence: ColorBlock[],
    mode: 'fixed' | 'strobe' = 'fixed'
  ): boolean => {
    const key = `${STORAGE_KEY_PREFIX}${projectId}_${songId}_${sectionId}`;
    const data: StoredSequence = {
      projectId,
      songId,
      sectionId,
      sequence,
      mode,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving sequence to localStorage:', error);
      return false;
    }
  };

  /**
   * Get sequence from localStorage
   * Unchanged from original implementation
   */
  const getSequence = (
    projectId: string,
    songId: string,
    sectionId: string
  ): StoredSequence | null => {
    const key = `${STORAGE_KEY_PREFIX}${projectId}_${songId}_${sectionId}`;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data: StoredSequence = JSON.parse(stored);

      // Check if data is expired
      const daysSinceStored = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceStored > EXPIRY_DAYS) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading sequence from localStorage:', error);
      return null;
    }
  };

  /**
   * Check if sequence is preloaded
   * Unchanged from original implementation
   */
  const isPreloaded = (
    projectId: string,
    songId: string,
    sectionId: string
  ): boolean => {
    return getSequence(projectId, songId, sectionId) !== null;
  };

  /**
   * Check if entire project section is preloaded (CDN method)
   */
  const isProjectSectionPreloaded = (
    projectId: string,
    sectionId: string
  ): boolean => {
    const cdnKey = `${STORAGE_KEY_CDN_PREFIX}${projectId}_${sectionId}`;
    try {
      const stored = localStorage.getItem(cdnKey);
      if (!stored) return false;

      const data = JSON.parse(stored);
      const daysSinceStored = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);

      return daysSinceStored <= EXPIRY_DAYS;
    } catch {
      return false;
    }
  };

  /**
   * Clear old data from localStorage
   * Updated to also clear CDN data
   */
  const clearOldData = () => {
    try {
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(
        key => key.startsWith(STORAGE_KEY_PREFIX) || key.startsWith(STORAGE_KEY_CDN_PREFIX)
      );

      projectKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            const daysSinceStored = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);

            if (daysSinceStored > EXPIRY_DAYS) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  };

  /**
   * Clear all data for a specific project
   * Updated to also clear CDN data
   */
  const clearProjectData = (projectId: string) => {
    try {
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(
        key =>
          key.startsWith(`${STORAGE_KEY_PREFIX}${projectId}_`) ||
          key.startsWith(`${STORAGE_KEY_CDN_PREFIX}${projectId}_`)
      );
      projectKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing project data:', error);
    }
  };

  // Clear old data on mount
  useEffect(() => {
    clearOldData();
  }, []);

  return {
    // New CDN-optimized methods
    preloadProjectSection,
    preloadSongSequence, // NEW: Individual song fallback
    isProjectSectionPreloaded,
    loadSequencesFromCDN,
    loadSequencesFromSupabase,

    // Original methods (backward compatible)
    saveSequence,
    getSequence,
    isPreloaded,
    clearOldData,
    clearProjectData,
  };
};
