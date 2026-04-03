/**
 * Festival Entity Types
 * 
 * Types for festivals including base database types,
 * extended types with relationships, and lineup management.
 */

import type { Database } from '@/integrations/supabase/types';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type FestivalRow = Database['public']['Tables']['festivals']['Row'];
export type FestivalInsert = Database['public']['Tables']['festivals']['Insert'];
export type FestivalUpdate = Database['public']['Tables']['festivals']['Update'];

export type FestivalLineupRow = Database['public']['Tables']['festival_lineup']['Row'];
export type FestivalLineupInsert = Database['public']['Tables']['festival_lineup']['Insert'];
export type FestivalLineupUpdate = Database['public']['Tables']['festival_lineup']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Basic venue info for festival queries
 */
export interface FestivalVenue {
  id: string;
  name: string;
  location: string | null;
  slug?: string;
  cities?: {
    name: string;
    slug?: string;
    countries?: {
      name: string;
      iso_code?: string;
    } | null;
  } | null;
}

/**
 * Basic promoter info for festival queries
 */
export interface FestivalPromoter {
  id: string;
  name: string;
}

/**
 * Basic artist info for lineup
 */
export interface LineupArtist {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
}

/**
 * Lineup item with artist data
 */
export interface FestivalLineupItem extends FestivalLineupRow {
  artists?: LineupArtist | null;
}

/**
 * Full Festival entity with all relations
 */
export interface Festival extends FestivalRow {
  venues?: FestivalVenue | null;
  promoters?: FestivalPromoter | null;
  festival_lineup?: FestivalLineupItem[];
}

/**
 * Festival with basic relations for list views
 */
export interface FestivalWithRelations extends FestivalRow {
  venues?: {
    id: string;
    name: string;
    location: string | null;
    cities?: {
      name: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
  promoters?: {
    id: string;
    name: string;
  } | null;
  lineup_count?: number;
  lineup_artists?: string[]; // Array of artist names for the lineup
  website_url?: string | null; // Official festival website
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Festival form data for admin create/edit
 */
export interface FestivalFormData {
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  venue_id: string;
  promoter_id: string;
  image_url: string;
  ticket_url: string;
  ticket_prices_html: string;
  edition: number | null;
  is_featured: boolean;
}

/**
 * Default values for festival form
 */
export const FESTIVAL_FORM_DEFAULTS: FestivalFormData = {
  name: '',
  slug: '',
  description: '',
  start_date: '',
  end_date: '',
  venue_id: '',
  promoter_id: '',
  image_url: '',
  ticket_url: '',
  ticket_prices_html: '',
  edition: null,
  is_featured: false,
};

/**
 * Lineup item form data
 */
export interface FestivalLineupFormData {
  artist_id: string;
  performance_date: string;
  stage: string;
  position: number;
}

// =============================================================================
// Filter Types
// =============================================================================

export type FestivalFilterStatus = 'all' | 'upcoming' | 'past';

export interface FestivalFilterOptions {
  status?: FestivalFilterStatus;
  venueId?: string;
  promoterId?: string;
  limit?: number;
  offset?: number;
  search?: string;
  featured?: boolean;
}
