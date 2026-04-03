/**
 * Friend Service
 * Handles all friendship-related database operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Friendship, 
  FriendshipWithProfile, 
  Friend, 
  FriendRequest,
  ConcertInvitation,
  ConcertInvitationWithDetails,
  UserSearchResult,
  FriendStats,
  FriendConcert
} from '@/types/entities/friendship';

class FriendServiceClass {
  // =========================================================================
  // Friendship Operations
  // =========================================================================

  /**
   * Get all accepted friends for a user
   */
  async getFriends(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        requester:profiles!friendships_requester_id_fkey(
          id, username, first_name, last_name,
          countries(name, iso_code),
          cities(name)
        ),
        addressee:profiles!friendships_addressee_id_fkey(
          id, username, first_name, last_name,
          countries(name, iso_code),
          cities(name)
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw error;

    // Transform to Friend array
    return (data || []).map((f: any) => {
      const friend = f.requester_id === userId ? f.addressee : f.requester;
      return {
        id: friend.id,
        username: friend.username,
        first_name: friend.first_name,
        last_name: friend.last_name,
        country_name: friend.countries?.name || null,
        country_code: friend.countries?.iso_code || null,
        city_name: friend.cities?.name || null,
        friendship_id: f.id,
        common_concerts: 0 // Will be calculated separately if needed
      };
    });
  }

  /**
   * Get pending friend requests received by user
   */
  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(
          id, username, first_name, last_name,
          countries(name, iso_code),
          cities(name)
        )
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status,
      created_at: r.created_at,
      requester: {
        id: r.requester.id,
        username: r.requester.username,
        first_name: r.requester.first_name,
        last_name: r.requester.last_name,
        country_id: null,
        city_id: null,
        countries: r.requester.countries,
        cities: r.requester.cities
      }
    }));
  }

  /**
   * Get count of pending requests
   */
  async getPendingRequestsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('addressee_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as Friendship['status'] };

  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as Friendship['status'] };
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) throw error;
  }

  /**
   * Remove a friendship
   */
  async removeFriend(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  }

  /**
   * Check friendship status between two users
   */
  async getFriendshipStatus(userId: string, otherUserId: string): Promise<{status: string, friendshipId?: string}> {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, status')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) return { status: 'none' };
    
    if (data.status === 'pending') {
      return {
        status: data.requester_id === userId ? 'sent' : 'received',
        friendshipId: data.id
      };
    }
    
    return { status: data.status, friendshipId: data.id };
  }

  // =========================================================================
  // User Search
  // =========================================================================

  /**
   * Search users by username or name
   */
  async searchUsers(userId: string, query: string): Promise<UserSearchResult[]> {
    const searchTerm = `%${query}%`;
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, username, first_name, last_name,
        countries(name, iso_code)
      `)
      .neq('id', userId)
      .or(`username.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      .limit(20);

    if (error) throw error;

    // Get friendship status for each user
    const results: UserSearchResult[] = [];
    
    for (const user of data || []) {
      const friendshipStatus = await this.getFriendshipStatus(userId, user.id);
      results.push({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        country_name: (user.countries as any)?.name || null,
        country_code: (user.countries as any)?.iso_code || null,
        friendship_status: friendshipStatus.status as any,
        friendship_id: friendshipStatus.friendshipId
      });
    }

    return results;
  }

  // =========================================================================
  // Friend Profile & Stats
  // =========================================================================

  /**
   * Verify if two users are friends using the database function
   */
  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('are_friends', { user_a: userId, user_b: otherUserId });
    
    if (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
    return data === true;
  }

  /**
   * Check if user can view full profile (own, friend, or admin)
   */
  async canViewFullProfile(viewerId: string, targetId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_view_full_profile', { viewer_id: viewerId, target_id: targetId });
    
    if (error) {
      console.error('Error checking profile access:', error);
      return false;
    }
    return data === true;
  }

  /**
   * Get friend profile with stats - VALIDATES FRIENDSHIP FIRST
   */
  async getFriendProfile(userId: string, friendId: string): Promise<{profile: any, stats: FriendStats, concerts: FriendConcert[]}> {
    // SECURITY: Verify friendship before returning full profile data
    const canView = await this.canViewFullProfile(userId, friendId);
    
    if (!canView) {
      throw new Error('ACCESS_DENIED: No tienes permiso para ver este perfil');
    }

    // Get profile - only basic info exposed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, username, first_name, last_name,
        countries(name, iso_code),
        cities(name)
      `)
      .eq('id', friendId)
      .single();

    if (profileError) throw profileError;

    // Get friend's concerts
    const { data: friendConcerts, error: fcError } = await supabase
      .from('favorite_concerts')
      .select(`
        concert_id,
        concerts(
          id, title, slug, date, image_url,
          venues(name, cities(name)),
          artists(name)
        )
      `)
      .eq('user_id', friendId)
      .eq('attendance_type', 'going');

    if (fcError) throw fcError;

    // Get user's concerts to find common ones
    const { data: userConcerts } = await supabase
      .from('favorite_concerts')
      .select('concert_id')
      .eq('user_id', userId)
      .eq('attendance_type', 'going');

    const userConcertIds = new Set((userConcerts || []).map(c => c.concert_id));
    const today = new Date().toISOString().split('T')[0];

    const concerts: FriendConcert[] = (friendConcerts || [])
      .filter((fc: any) => fc.concerts)
      .map((fc: any) => ({
        id: fc.concerts.id,
        title: fc.concerts.title,
        slug: fc.concerts.slug,
        date: fc.concerts.date,
        image_url: fc.concerts.image_url,
        venue_name: fc.concerts.venues?.name || null,
        city_name: fc.concerts.venues?.cities?.name || null,
        artist_name: fc.concerts.artists?.name || null,
        is_common: userConcertIds.has(fc.concert_id)
      }))
      .sort((a: FriendConcert, b: FriendConcert) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    const stats: FriendStats = {
      total_concerts: concerts.length,
      common_concerts: concerts.filter(c => c.is_common).length,
      upcoming_concerts: concerts.filter(c => c.date && c.date >= today).length
    };

    return { profile, stats, concerts };
  }

  // =========================================================================
  // Concert Invitations
  // =========================================================================

  /**
   * Get pending concert invitations for user
   */
  async getConcertInvitations(userId: string): Promise<ConcertInvitationWithDetails[]> {
    const { data, error } = await supabase
      .from('concert_invitations')
      .select(`
        *,
        concerts(
          id, title, slug, date, image_url,
          venues(name, cities(name)),
          artists(name, photo_url)
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Fetch sender profiles separately
    const results = data || [];
    for (const item of results) {
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name')
        .eq('id', item.sender_id)
        .single();
      (item as any).sender = sender;
    }
    
    return results as any;
  }

  /**
   * Get pending invitations count
   */
  async getConcertInvitationsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('concert_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Send a concert invitation
   */
  async sendConcertInvitation(senderId: string, receiverId: string, concertId: string, message?: string): Promise<ConcertInvitation> {
    const { data, error } = await supabase
      .from('concert_invitations')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        concert_id: concertId,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as ConcertInvitation['status'] };
  }

  /**
   * Respond to concert invitation
   */
  async respondToConcertInvitation(invitationId: string, accept: boolean): Promise<void> {
    const { error } = await supabase
      .from('concert_invitations')
      .update({ 
        status: accept ? 'accepted' : 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) throw error;
  }

  /**
   * Get user's upcoming concerts (for invitation selector)
   */
  async getUserUpcomingConcerts(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('favorite_concerts')
      .select(`
        concert_id,
        concerts(
          id, title, slug, date, image_url,
          venues(name, cities(name)),
          artists(name)
        )
      `)
      .eq('user_id', userId)
      .eq('attendance_type', 'going');

    if (error) throw error;

    return (data || [])
      .filter((fc: any) => fc.concerts && fc.concerts.date && fc.concerts.date >= today)
      .map((fc: any) => fc.concerts)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const friendService = new FriendServiceClass();
