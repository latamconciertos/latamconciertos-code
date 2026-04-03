/**
 * Concert Entity Types
 * 
 * Types for concerts/events including base database types,
 * extended types with relationships, and UI-specific variants.
 */

import type { Database } from '@/integrations/supabase/types';
import type { ArtistForConcert, ArtistBasic } from './artist';
import type { VenueForConcert, VenueBasic } from './venue';
import type { PromoterBasic } from './common';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type ConcertRow = Database['public']['Tables']['concerts']['Row'];
export type ConcertInsert = Database['public']['Tables']['concerts']['Insert'];
export type ConcertUpdate = Database['public']['Tables']['concerts']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Concert entity with all possible relations
 * This is the most complete type, used when all data is fetched
 */
export interface Concert extends ConcertRow {
  artists?: ArtistForConcert | null;
  venues?: VenueForConcert | null;
  promoters?: PromoterBasic | null;
  // Runtime computed field from Spotify
  artist_image_url?: string;
}

/**
 * Concert with minimal artist/venue info for listings
 */
export interface ConcertWithBasicRelations {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  ticket_url: string | null;
  description: string | null;
  event_type: string;
  is_featured: boolean | null;
  created_at: string;
  artist_image_url?: string;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  venues?: {
    name: string;
    location: string | null;
    city_id?: string;
    cities?: {
      name: string;
      country_id?: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

/**
 * Concert for setlist pages with artist/venue slug info
 */
export interface ConcertForSetlist {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  artist: {
    name: string;
    slug: string;
  } | null;
  venue: {
    name: string;
    location: string | null;
    city: {
      slug: string;
    } | null;
  } | null;
}

/**
 * Concert with setlist count for setlists listing page
 */
export interface ConcertWithSetlistCount extends ConcertWithBasicRelations {
  setlist_count: number;
}

/**
 * Featured concert for homepage carousel
 */
export interface FeaturedConcert extends ConcertWithBasicRelations {
  position?: number;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal concert info for references and small cards
 */
export interface ConcertBasic {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
}

/**
 * Concert card data for grid displays
 */
export interface ConcertCardData {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  ticket_url: string | null;
  artist_name: string | null;
  artist_image_url: string | null;
  venue_name: string | null;
  city_name: string | null;
  country_name: string | null;
  is_upcoming: boolean;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Concert form data for admin create/edit
 */
export interface ConcertFormData {
  title: string;
  slug: string;
  date: string;
  description: string;
  image_url: string;
  ticket_url: string;
  ticket_prices_html: string;
  artist_id: string;
  venue_id: string;
  promoter_id: string;
  event_type: string;
  is_featured: boolean;
}

/**
 * Default values for concert form
 */
export const CONCERT_FORM_DEFAULTS: ConcertFormData = {
  title: '',
  slug: '',
  date: '',
  description: '',
  image_url: '',
  ticket_url: '',
  ticket_prices_html: '',
  artist_id: '',
  venue_id: '',
  promoter_id: '',
  event_type: 'concert',
  is_featured: false,
};

// =============================================================================
// Festival Types
// =============================================================================

export type FestivalArtistRow = Database['public']['Tables']['festival_artists']['Row'];

/**
 * Festival artist lineup item
 */
export interface FestivalArtist extends FestivalArtistRow {
  artists?: ArtistBasic | null;
}

// =============================================================================
// Favorite/Attendance Types
// =============================================================================

export type FavoriteConcertRow = Database['public']['Tables']['favorite_concerts']['Row'];

/**
 * User's favorite concert with attendance type
 */
export interface FavoriteConcert extends FavoriteConcertRow {
  concerts?: ConcertBasic | null;
}

/**
 * Attendance type options (separated from favorite status)
 * - 'attending': User confirms they will attend
 * - 'tentative': User might attend
 * - null: No attendance status set
 */
export type AttendanceType = 'attending' | 'tentative' | null;

/**
 * User's interaction with a concert (separated concerns)
 */
export interface ConcertUserInteraction {
  isFavorite: boolean;
  attendanceType: AttendanceType;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Concert event type options
 */
export type ConcertEventType = 'concert' | 'festival' | 'tour';

/**
 * Date formatting result for concert cards
 */
export interface FormattedConcertDate {
  day: string;
  month: string;
  year: string;
  fullDate: string;
}
