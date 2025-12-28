/**
 * Media Service
 * 
 * Handles all media-related database operations including
 * videos, photos, galleries, and ad campaigns.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  MediaItem,
  MediaItemInsert,
  MediaItemUpdate,
  FeaturedVideo,
  FeaturedPhoto,
  AdCampaign,
  AdItem,
  SocialNetwork,
  ActiveSocialNetwork,
  ServiceResponse,
  MediaType,
  MediaStatus,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray } from './base';

export interface MediaFilterOptions {
  type?: MediaType;
  status?: MediaStatus;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

class MediaServiceClass {
  /**
   * Get all media items with optional filtering
   */
  async getAll(options?: MediaFilterOptions): Promise<ServiceResponse<MediaItem[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('media_items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'MediaService.getAll');
  }

  /**
   * Get featured videos for homepage
   */
  async getFeaturedVideos(limit: number = 6): Promise<ServiceResponse<FeaturedVideo[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('media_items')
        .select('id, title, summary, media_url, embed_code, thumbnail_url')
        .eq('type', 'video')
        .eq('status', 'published')
        .eq('featured', true)
        .order('position', { ascending: true })
        .limit(limit);
    }, 'MediaService.getFeaturedVideos');
  }

  /**
   * Get featured photos for homepage gallery
   */
  async getFeaturedPhotos(limit: number = 10): Promise<ServiceResponse<FeaturedPhoto[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('media_items')
        .select('id, title, summary, media_url, thumbnail_url')
        .eq('type', 'image')
        .eq('status', 'published')
        .eq('featured', true)
        .order('position', { ascending: true })
        .limit(limit);
    }, 'MediaService.getFeaturedPhotos');
  }

  /**
   * Get a single media item by ID
   */
  async getById(id: string): Promise<ServiceResponse<MediaItem>> {
    return handleServiceCall(async () => {
      return supabase
        .from('media_items')
        .select('*')
        .eq('id', id)
        .single();
    }, 'MediaService.getById');
  }

  /**
   * Create a new media item
   */
  async create(data: MediaItemInsert): Promise<ServiceResponse<MediaItem>> {
    return handleServiceCall(async () => {
      const { data: item, error } = await supabase
        .from('media_items')
        .insert(data)
        .select('*')
        .single();
      
      return { data: item, error };
    }, 'MediaService.create');
  }

  /**
   * Update an existing media item
   */
  async update(id: string, data: MediaItemUpdate): Promise<ServiceResponse<MediaItem>> {
    return handleServiceCall(async () => {
      const { data: item, error } = await supabase
        .from('media_items')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      return { data: item, error };
    }, 'MediaService.update');
  }

  /**
   * Delete a media item
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'MediaService.delete');
  }

  // ==========================================================================
  // Ad Campaign Operations
  // ==========================================================================

  /**
   * Get all ad campaigns
   */
  async getCampaigns(): Promise<ServiceResponse<AdCampaign[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('ad_campaigns')
        .select(`
          *,
          ad_items (*)
        `)
        .order('created_at', { ascending: false });
    }, 'MediaService.getCampaigns');
  }

  /**
   * Get active ads for a specific location and position
   */
  async getActiveAds(location: string, position: string): Promise<ServiceResponse<AdItem[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('ad_items')
        .select('*')
        .eq('location', location)
        .eq('position', position as any)
        .eq('active', true)
        .order('display_order', { ascending: true });
    }, 'MediaService.getActiveAds');
  }

  /**
   * Record an ad impression (direct update without RPC)
   */
  async recordImpression(adId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { data: current } = await supabase
        .from('ad_items')
        .select('impressions')
        .eq('id', adId)
        .single();
      
      const { error } = await supabase
        .from('ad_items')
        .update({ impressions: (current?.impressions || 0) + 1 })
        .eq('id', adId);
      
      return { data: !error, error };
    }, 'MediaService.recordImpression');
  }

  /**
   * Record an ad click (direct update without RPC)
   */
  async recordClick(adId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { data: current } = await supabase
        .from('ad_items')
        .select('clicks')
        .eq('id', adId)
        .single();
      
      const { error } = await supabase
        .from('ad_items')
        .update({ clicks: (current?.clicks || 0) + 1 })
        .eq('id', adId);
      
      return { data: !error, error };
    }, 'MediaService.recordClick');
  }

  // ==========================================================================
  // Social Network Operations
  // ==========================================================================

  /**
   * Get all social networks
   */
  async getSocialNetworks(): Promise<ServiceResponse<SocialNetwork[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('social_networks')
        .select('*')
        .order('display_order', { ascending: true });
    }, 'MediaService.getSocialNetworks');
  }

  /**
   * Get active social networks for sharing
   */
  async getActiveSocialNetworks(): Promise<ServiceResponse<ActiveSocialNetwork[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('social_networks')
        .select('id, name, icon_name, url_template')
        .eq('active', true)
        .order('display_order', { ascending: true });
    }, 'MediaService.getActiveSocialNetworks');
  }

  /**
   * Update a social network
   */
  async updateSocialNetwork(id: string, data: Partial<SocialNetwork>): Promise<ServiceResponse<SocialNetwork>> {
    return handleServiceCall(async () => {
      const { data: network, error } = await supabase
        .from('social_networks')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      return { data: network, error };
    }, 'MediaService.updateSocialNetwork');
  }
}

export const mediaService = new MediaServiceClass();
