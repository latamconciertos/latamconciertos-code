/**
 * Common/Shared Entity Types
 * 
 * Types used across multiple domains including geographic entities,
 * timestamps, and utility types.
 */

import type { Database } from '@/integrations/supabase/types';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type CountryRow = Database['public']['Tables']['countries']['Row'];
export type CountryInsert = Database['public']['Tables']['countries']['Insert'];
export type CountryUpdate = Database['public']['Tables']['countries']['Update'];

export type CityRow = Database['public']['Tables']['cities']['Row'];
export type CityInsert = Database['public']['Tables']['cities']['Insert'];
export type CityUpdate = Database['public']['Tables']['cities']['Update'];

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type PromoterRow = Database['public']['Tables']['promoters']['Row'];
export type PromoterInsert = Database['public']['Tables']['promoters']['Insert'];
export type PromoterUpdate = Database['public']['Tables']['promoters']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Country entity with optional nested relations
 */
export interface Country extends CountryRow {
  cities?: City[];
}

/**
 * City entity with optional nested relations
 */
export interface City extends CityRow {
  countries?: Country | null;
}

/**
 * Category for news articles and content classification
 */
export interface Category extends CategoryRow {}

/**
 * Promoter/Event organizer entity with optional relations
 */
export interface Promoter extends PromoterRow {
  countries?: Country | null;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal country info for dropdowns and selectors
 */
export interface CountryBasic {
  id: string;
  name: string;
  iso_code: string;
}

/**
 * Minimal city info for dropdowns and selectors
 */
export interface CityBasic {
  id: string;
  name: string;
  country_id: string;
  slug?: string;
}

/**
 * Minimal category info for badges and tags
 */
export interface CategoryBasic {
  id: string;
  name: string;
  slug: string;
}

/**
 * Minimal promoter info for display
 */
export interface PromoterBasic {
  id: string;
  name: string;
  website?: string | null;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic service response
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Filter status for concert listings
 */
export type ConcertFilterStatus = 'all' | 'upcoming' | 'past';

/**
 * Article/Content status
 */
export type ArticleStatus = 'draft' | 'published' | 'archived';

/**
 * Setlist song contribution status
 */
export type SetlistContributionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Base timestamp fields
 */
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

/**
 * Social links structure (used in artists, venues)
 */
export interface SocialLinks {
  spotify?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  [key: string]: string | undefined;
}
