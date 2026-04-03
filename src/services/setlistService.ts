/**
 * Setlist Service
 * 
 * Handles all setlist-related database operations including
 * songs, contributions, and approval workflow.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  SetlistSong,
  SetlistSongWithContributor,
  SetlistSongInsert,
  SetlistSongUpdate,
  SetlistWithConcert,
  PendingSetlistContribution,
  ServiceResponse,
  SetlistContributionStatus,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, SELECT_QUERIES } from './base';

class SetlistServiceClass {
  /**
   * Get all songs for a concert setlist
   */
  async getSongsByConcert(concertId: string): Promise<ServiceResponse<SetlistSongWithContributor[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('setlist_songs')
        .select(SELECT_QUERIES.setlistSongWithContributor)
        .eq('concert_id', concertId)
        .eq('status', 'approved')
        .order('position', { ascending: true });
    }, 'SetlistService.getSongsByConcert');
  }

  /**
   * Get all songs including pending (for contributors to see their own)
   */
  async getAllSongsByConcert(concertId: string, userId?: string): Promise<ServiceResponse<SetlistSongWithContributor[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('setlist_songs')
        .select(SELECT_QUERIES.setlistSongWithContributor)
        .eq('concert_id', concertId)
        .order('position', { ascending: true });

      // If user provided, also get their pending contributions
      if (userId) {
        query = query.or(`status.eq.approved,and(status.eq.pending,contributed_by.eq.${userId})`);
      } else {
        query = query.eq('status', 'approved');
      }

      return query;
    }, 'SetlistService.getAllSongsByConcert');
  }

  /**
   * Get concerts with setlists
   */
  async getConcertsWithSetlists(options?: {
    status?: 'upcoming' | 'past' | 'all';
    limit?: number;
  }): Promise<ServiceResponse<SetlistWithConcert[]>> {
    return handleServiceCallArray(async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // First get concert IDs that have setlist songs
      const { data: concertsWithSongs } = await supabase
        .from('setlist_songs')
        .select('concert_id')
        .eq('status', 'approved');

      if (!concertsWithSongs?.length) {
        return { data: [], error: null };
      }

      const concertIds = [...new Set(concertsWithSongs.map(s => s.concert_id))];

      let query = supabase
        .from('concerts')
        .select(`
          id, title, slug, date, image_url,
          artists (id, name, slug, photo_url),
          venues (
            id, name,
            cities (name, slug)
          )
        `)
        .in('id', concertIds);

      if (options?.status === 'upcoming') {
        query = query.gte('date', today).order('date', { ascending: true });
      } else if (options?.status === 'past') {
        query = query.lt('date', today).order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return query;
    }, 'SetlistService.getConcertsWithSetlists');
  }

  /**
   * Get a single song by ID
   */
  async getSongById(id: string): Promise<ServiceResponse<SetlistSong>> {
    return handleServiceCall(async () => {
      return supabase
        .from('setlist_songs')
        .select('*')
        .eq('id', id)
        .single();
    }, 'SetlistService.getSongById');
  }

  /**
   * Add a song to a setlist (user contribution)
   */
  async contributeSong(data: {
    concert_id: string;
    song_name: string;
    artist_name?: string;
    position: number;
    contributed_by: string;
  }): Promise<ServiceResponse<SetlistSong>> {
    return handleServiceCall(async () => {
      const { data: song, error } = await supabase
        .from('setlist_songs')
        .insert({
          ...data,
          status: 'pending',
          is_official: false,
        })
        .select('*')
        .single();
      
      return { data: song, error };
    }, 'SetlistService.contributeSong');
  }

  /**
   * Add an official song (admin only)
   */
  async addOfficialSong(data: SetlistSongInsert): Promise<ServiceResponse<SetlistSong>> {
    return handleServiceCall(async () => {
      const { data: song, error } = await supabase
        .from('setlist_songs')
        .insert({
          ...data,
          status: 'approved',
          is_official: true,
        })
        .select('*')
        .single();
      
      return { data: song, error };
    }, 'SetlistService.addOfficialSong');
  }

  /**
   * Update a song
   */
  async updateSong(id: string, data: SetlistSongUpdate): Promise<ServiceResponse<SetlistSong>> {
    return handleServiceCall(async () => {
      const { data: song, error } = await supabase
        .from('setlist_songs')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      return { data: song, error };
    }, 'SetlistService.updateSong');
  }

  /**
   * Delete a song
   */
  async deleteSong(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('setlist_songs')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'SetlistService.deleteSong');
  }

  /**
   * Approve a contribution
   */
  async approveContribution(id: string): Promise<ServiceResponse<SetlistSong>> {
    return this.updateSong(id, { status: 'approved' });
  }

  /**
   * Reject a contribution
   */
  async rejectContribution(id: string): Promise<ServiceResponse<SetlistSong>> {
    return this.updateSong(id, { status: 'rejected' });
  }

  /**
   * Get pending contributions (admin)
   */
  async getPendingContributions(): Promise<ServiceResponse<PendingSetlistContribution[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('setlist_songs')
        .select(`
          *,
          concerts (
            id, title, slug, date,
            artists (name)
          ),
          profiles:contributed_by (username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    }, 'SetlistService.getPendingContributions');
  }

  /**
   * Get contribution count for admin badge
   */
  async getPendingCount(): Promise<ServiceResponse<number>> {
    return handleServiceCall(async () => {
      const { count, error } = await supabase
        .from('setlist_songs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      return { data: count ?? 0, error };
    }, 'SetlistService.getPendingCount');
  }

  /**
   * Reorder songs in a setlist
   */
  async reorderSongs(concertId: string, songIds: string[]): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      // Update each song's position
      const updates = songIds.map((id, index) => 
        supabase
          .from('setlist_songs')
          .update({ position: index + 1 })
          .eq('id', id)
          .eq('concert_id', concertId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);
      
      return { 
        data: !hasError, 
        error: hasError ? results.find(r => r.error)?.error : null 
      };
    }, 'SetlistService.reorderSongs');
  }
}

export const setlistService = new SetlistServiceClass();
