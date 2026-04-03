/**
 * User/Profile Entity Types
 * 
 * Types for user profiles, authentication, roles,
 * and user-related entities.
 */

import type { Database } from '@/integrations/supabase/types';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];

// =============================================================================
// Enums and Constants
// =============================================================================

/**
 * User role options from database enum
 */
export type UserRole = Database['public']['Enums']['user_role'];

/**
 * Available user roles (must match database enum)
 */
export const USER_ROLES: UserRole[] = ['admin', 'moderator', 'user'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full Profile entity with computed fields
 */
export interface Profile extends ProfileRow {
  email?: string; // From auth.users
  roles?: UserRole[];
}

/**
 * Profile with user roles
 */
export interface ProfileWithRoles extends Profile {
  user_roles?: {
    role: UserRole;
  }[];
}

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal profile info for author display
 */
export interface AuthorProfile {
  id: string;
  username: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Profile for comment/contribution attribution
 */
export interface ContributorProfile {
  username: string | null;
}

/**
 * Current user session info
 */
export interface CurrentUser {
  id: string;
  email: string;
  username: string | null;
  is_admin: boolean;
  roles: UserRole[];
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Profile form data for user settings
 */
export interface ProfileFormData {
  username: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  country_id: string;
  city_id: string;
}

/**
 * Default values for profile form
 */
export const PROFILE_FORM_DEFAULTS: ProfileFormData = {
  username: '',
  first_name: '',
  last_name: '',
  birth_date: '',
  country_id: '',
  city_id: '',
};

// =============================================================================
// Badge Types
// =============================================================================

export type BadgeRow = Database['public']['Tables']['badges']['Row'];

/**
 * User badge/achievement
 */
export interface Badge extends BadgeRow {}

/**
 * User's earned badge
 */
export interface UserBadge {
  id: string;
  badge: Badge;
  earned_at: string;
}

// =============================================================================
// Favorite Types
// =============================================================================

export type FavoriteArtistRow = Database['public']['Tables']['favorite_artists']['Row'];

/**
 * User's favorite artist
 */
export interface FavoriteArtist extends FavoriteArtistRow {
  artists?: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
  } | null;
}

// =============================================================================
// Community Types
// =============================================================================

export type CommunityMemberRow = Database['public']['Tables']['community_members']['Row'];
export type CommunityMessageRow = Database['public']['Tables']['community_messages']['Row'];

/**
 * Community member with profile
 */
export interface CommunityMember extends CommunityMemberRow {
  profiles?: {
    username: string | null;
  } | null;
}

/**
 * Community message with sender info
 */
export interface CommunityMessage extends CommunityMessageRow {
  profiles?: {
    username: string | null;
  } | null;
}

// =============================================================================
// Push Notification Types
// =============================================================================

export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];

/**
 * Push notification subscription
 */
export interface PushSubscription extends PushSubscriptionRow {}

// =============================================================================
// AI Conversation Types
// =============================================================================

export type AIConversationRow = Database['public']['Tables']['ai_conversations']['Row'];
export type AIMessageRow = Database['public']['Tables']['ai_messages']['Row'];

/**
 * AI conversation with messages
 */
export interface AIConversation extends AIConversationRow {
  messages?: AIMessage[];
}

/**
 * AI message
 */
export interface AIMessage extends AIMessageRow {}
