/**
 * Friendship Entity Types
 * 
 * Types for friendship relationships and concert invitations
 */

// =============================================================================
// Friendship Types
// =============================================================================

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendshipWithProfile extends Friendship {
  requester?: FriendProfile | null;
  addressee?: FriendProfile | null;
}

export interface FriendProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  country_id: string | null;
  city_id: string | null;
  countries?: {
    name: string;
    iso_code: string;
  } | null;
  cities?: {
    name: string;
  } | null;
}

export interface Friend {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  country_name: string | null;
  country_code: string | null;
  city_name: string | null;
  friendship_id: string;
  common_concerts: number;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  requester: FriendProfile;
}

// =============================================================================
// Concert Invitation Types
// =============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface ConcertInvitation {
  id: string;
  sender_id: string;
  receiver_id: string;
  concert_id: string;
  status: InvitationStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConcertInvitationWithDetails extends ConcertInvitation {
  sender?: FriendProfile | null;
  receiver?: FriendProfile | null;
  concerts?: {
    id: string;
    title: string;
    slug: string;
    date: string | null;
    image_url: string | null;
    venues?: {
      name: string;
      cities?: {
        name: string;
      } | null;
    } | null;
    artists?: {
      name: string;
      photo_url: string | null;
    } | null;
  } | null;
}

// =============================================================================
// Search Types
// =============================================================================

export interface UserSearchResult {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  country_name: string | null;
  country_code: string | null;
  friendship_status: FriendshipStatus | 'none' | 'sent' | 'received';
  friendship_id?: string;
}

// =============================================================================
// Friend Stats
// =============================================================================

export interface FriendStats {
  total_concerts: number;
  common_concerts: number;
  upcoming_concerts: number;
}

export interface FriendConcert {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  venue_name: string | null;
  city_name: string | null;
  artist_name: string | null;
  is_common: boolean;
}
