/**
 * Media Entity Types
 * 
 * Types for media items including videos, photos, galleries,
 * and related content.
 */

import type { Database } from '@/integrations/supabase/types';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type MediaItemRow = Database['public']['Tables']['media_items']['Row'];
export type MediaItemInsert = Database['public']['Tables']['media_items']['Insert'];
export type MediaItemUpdate = Database['public']['Tables']['media_items']['Update'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Media Item entity with author
 */
export interface MediaItem extends MediaItemRow {
  profiles?: {
    username: string | null;
  } | null;
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Media item for gallery display
 */
export interface MediaItemDisplay {
  id: string;
  title: string;
  type: MediaType;
  media_url: string | null;
  thumbnail_url: string | null;
  embed_code: string | null;
  summary: string | null;
  featured: boolean | null;
  position: number | null;
}

/**
 * Featured video for homepage
 */
export interface FeaturedVideo {
  id: string;
  title: string;
  embed_code: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  summary: string | null;
}

/**
 * Featured photo for gallery carousel
 */
export interface FeaturedPhoto {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url: string | null;
  summary: string | null;
}

// =============================================================================
// Type Options
// =============================================================================

/**
 * Media type options
 */
export type MediaType = 'video' | 'photo' | 'audio' | 'gallery';

/**
 * Media status options
 */
export type MediaStatus = 'draft' | 'published' | 'archived';

// =============================================================================
// Form Types
// =============================================================================

/**
 * Media item form data for admin
 */
export interface MediaItemFormData {
  title: string;
  type: MediaType;
  media_url: string;
  thumbnail_url: string;
  embed_code: string;
  summary: string;
  status: MediaStatus;
  featured: boolean;
  position: number;
  expires_at: string;
}

/**
 * Default values for media item form
 */
export const MEDIA_ITEM_FORM_DEFAULTS: MediaItemFormData = {
  title: '',
  type: 'photo',
  media_url: '',
  thumbnail_url: '',
  embed_code: '',
  summary: '',
  status: 'draft',
  featured: false,
  position: 0,
  expires_at: '',
};

// =============================================================================
// Ad/Campaign Types
// =============================================================================

export type AdCampaignRow = Database['public']['Tables']['ad_campaigns']['Row'];
export type AdItemRow = Database['public']['Tables']['ad_items']['Row'];

/**
 * Ad campaign with items
 */
export interface AdCampaign extends AdCampaignRow {
  ad_items?: AdItem[];
}

/**
 * Ad item
 */
export interface AdItem extends AdItemRow {}

/**
 * Ad position options
 */
export type AdPosition = Database['public']['Enums']['ad_position'];

/**
 * Ad format options
 */
export type AdFormat = Database['public']['Enums']['ad_format'];

/**
 * Ad campaign status
 */
export type AdCampaignStatus = Database['public']['Enums']['ad_campaign_status'];

// =============================================================================
// Social Network Types
// =============================================================================

export type SocialNetworkRow = Database['public']['Tables']['social_networks']['Row'];

/**
 * Social network for sharing
 */
export interface SocialNetwork extends SocialNetworkRow {}

/**
 * Active social network for share buttons
 */
export interface ActiveSocialNetwork {
  id: string;
  name: string;
  icon_name: string;
  url_template: string;
  display_order: number;
}

// =============================================================================
// PWA Settings Types
// =============================================================================

export type PWASettingsRow = Database['public']['Tables']['pwa_settings']['Row'];

/**
 * PWA settings
 */
export interface PWASettings extends PWASettingsRow {}

// =============================================================================
// SEO Settings Types
// =============================================================================

export type SEOSettingsRow = Database['public']['Tables']['seo_settings']['Row'];

/**
 * SEO settings
 */
export interface SEOSettings extends SEOSettingsRow {}
