/**
 * Artist Entity Types
 * 
 * Types for music artists/performers including base database types
 * and extended types with relationships.
 */

import type { Database } from '@/integrations/supabase/types';
import type { SocialLinks } from './common';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type ArtistRow = Database['public']['Tables']['artists']['Row'];
export type ArtistInsert = Database['public']['Tables']['artists']['Insert'];
export type ArtistUpdate = Database['public']['Tables']['artists']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Artist entity with typed social links
 */
export interface Artist extends Omit<ArtistRow, 'social_links'> {
  social_links: SocialLinks | null;
}

/**
 * Artist with concert count (for listings)
 */
export interface ArtistWithConcertCount extends Artist {
  concert_count?: number;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal artist info for concert cards and references
 */
export interface ArtistBasic {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
}

/**
 * Artist info as returned from concert queries with joins
 */
export interface ArtistForConcert {
  name: string;
  photo_url: string | null;
  slug?: string;
}

/**
 * Artist reference for news articles
 */
export interface ArtistForNews {
  id: string;
  name: string;
  photo_url: string | null;
}

/**
 * Featured artist for homepage display
 */
export interface FeaturedArtist {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  upcoming_concerts_count?: number;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Artist form data for admin create/edit
 */
export interface ArtistFormData {
  name: string;
  slug: string;
  bio: string;
  photo_url: string;
  social_links: SocialLinks;
}

/**
 * Default values for artist form
 */
export const ARTIST_FORM_DEFAULTS: ArtistFormData = {
  name: '',
  slug: '',
  bio: '',
  photo_url: '',
  social_links: {},
};
