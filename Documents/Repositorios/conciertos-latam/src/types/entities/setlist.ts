/**
 * Setlist Entity Types
 * 
 * Types for concert setlists including songs, contributions,
 * and related entities.
 */

import type { Database } from '@/integrations/supabase/types';
import type { SetlistContributionStatus } from './common';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type SetlistSongRow = Database['public']['Tables']['setlist_songs']['Row'];
export type SetlistSongInsert = Database['public']['Tables']['setlist_songs']['Insert'];
export type SetlistSongUpdate = Database['public']['Tables']['setlist_songs']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Setlist Song entity
 */
export interface SetlistSong extends SetlistSongRow {}

/**
 * Setlist song with contributor info
 */
export interface SetlistSongWithContributor extends SetlistSong {
  contributor?: {
    username: string | null;
  } | null;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Setlist song for display in setlist view
 */
export interface SetlistSongDisplay {
  id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  duration_seconds: number | null;
  notes: string | null;
  spotify_url: string | null;
  is_official: boolean | null;
  contributed_by: string | null;
}

/**
 * Minimal setlist song for concert cards
 */
export interface SetlistSongBasic {
  id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  notes: string | null;
  spotify_url: string | null;
}

/**
 * Song for setlist image generation
 */
export interface SetlistSongForImage {
  song_name: string;
  artist_name?: string;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Setlist song contribution form data
 */
export interface SetlistContributionFormData {
  song_name: string;
  artist_name: string;
  notes: string;
}

/**
 * Default values for setlist contribution form
 */
export const SETLIST_CONTRIBUTION_FORM_DEFAULTS: SetlistContributionFormData = {
  song_name: '',
  artist_name: '',
  notes: '',
};

/**
 * Admin setlist song form data
 */
export interface SetlistSongFormData {
  song_name: string;
  artist_name: string;
  position: number;
  duration_seconds: number | null;
  notes: string;
  spotify_url: string;
  is_official: boolean;
  status: SetlistContributionStatus;
}

// =============================================================================
// Setlist Page Types
// =============================================================================

/**
 * Complete setlist data for sharing
 */
export interface SetlistData {
  concertTitle: string;
  artistName?: string;
  date?: string;
  concertImage?: string;
  songs: SetlistSongForImage[];
}

/**
 * Setlist with concert info for listings
 */
export interface SetlistWithConcert {
  concert_id: string;
  concert_title: string;
  concert_slug: string;
  concert_date: string | null;
  artist_name: string | null;
  artist_slug: string | null;
  venue_name: string | null;
  city_slug: string | null;
  song_count: number;
  has_official: boolean;
}

// =============================================================================
// Admin Types
// =============================================================================

/**
 * Pending setlist contribution for admin review
 */
export interface PendingSetlistContribution {
  id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  notes: string | null;
  status: SetlistContributionStatus;
  contributed_by: string | null;
  created_at: string;
  concert: {
    id: string;
    title: string;
    slug: string;
    date: string | null;
  } | null;
  contributor?: {
    username: string | null;
    email?: string;
  } | null;
}

/**
 * Admin notification for setlist contribution
 */
export interface SetlistContributionNotification {
  id: string;
  type: 'setlist_contribution';
  title: string;
  message: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}
