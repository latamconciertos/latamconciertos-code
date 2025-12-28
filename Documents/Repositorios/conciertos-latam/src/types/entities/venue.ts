/**
 * Venue Entity Types
 * 
 * Types for concert venues/locations including base database types
 * and extended types with geographic relationships.
 */

import type { Database } from '@/integrations/supabase/types';
import type { City, Country } from './common';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type VenueRow = Database['public']['Tables']['venues']['Row'];
export type VenueInsert = Database['public']['Tables']['venues']['Insert'];
export type VenueUpdate = Database['public']['Tables']['venues']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Venue entity with geographic relations
 */
export interface Venue extends VenueRow {
  cities?: VenueCityRelation | null;
}

/**
 * City relation as nested in venue queries
 */
export interface VenueCityRelation {
  id: string;
  name: string;
  slug: string;
  country_id: string;
  countries?: {
    id: string;
    name: string;
    iso_code?: string;
  } | null;
}

/**
 * Venue with full geographic hierarchy
 */
export interface VenueWithLocation extends VenueRow {
  cities?: {
    id: string;
    name: string;
    slug: string;
    country_id: string;
    countries?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal venue info for concert cards
 */
export interface VenueBasic {
  id: string;
  name: string;
  location: string | null;
}

/**
 * Venue info as returned from concert queries with joins
 */
export interface VenueForConcert {
  name: string;
  location: string | null;
  city_id?: string;
  cities?: {
    name: string;
    slug?: string;
    country_id?: string;
    countries?: {
      name: string;
    } | null;
  } | null;
}

/**
 * Venue with formatted address for display
 */
export interface VenueWithAddress extends VenueBasic {
  city_name?: string;
  country_name?: string;
  full_address?: string;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Venue form data for admin create/edit
 */
export interface VenueFormData {
  name: string;
  slug: string;
  location: string;
  capacity: number;
  website: string;
  country: string;
  city_id: string;
}

/**
 * Default values for venue form
 */
export const VENUE_FORM_DEFAULTS: VenueFormData = {
  name: '',
  slug: '',
  location: '',
  capacity: 0,
  website: '',
  country: '',
  city_id: '',
};

// =============================================================================
// Venue Section Types (for Fan Projects)
// =============================================================================

export type VenueSectionRow = Database['public']['Tables']['venue_sections']['Row'];
export type VenueSectionInsert = Database['public']['Tables']['venue_sections']['Insert'];
export type VenueSectionUpdate = Database['public']['Tables']['venue_sections']['Update'];

/**
 * Venue section for fan projects
 */
export interface VenueSection extends VenueSectionRow {}

/**
 * Venue section basic info for selectors
 */
export interface VenueSectionBasic {
  id: string;
  name: string;
  color: string | null;
}
