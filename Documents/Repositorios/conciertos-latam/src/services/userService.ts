/**
 * User Service
 * 
 * Handles all user and profile-related database operations including
 * profiles, roles, badges, and authentication helpers.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Profile,
  ProfileWithRoles,
  ProfileUpdate,
  UserRole,
  Badge,
  UserBadge,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray } from './base';

class UserServiceClass {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ServiceResponse<{ id: string; email: string } | null>> {
    return handleServiceCall(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { data: null, error };
      }
      
      return { 
        data: { id: user.id, email: user.email! }, 
        error: null 
      };
    }, 'UserService.getCurrentUser');
  }

  /**
   * Get a user's profile
   */
  async getProfile(userId: string): Promise<ServiceResponse<Profile>> {
    return handleServiceCall(async () => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    }, 'UserService.getProfile');
  }

  /**
   * Get a user's profile with roles
   */
  async getProfileWithRoles(userId: string): Promise<ServiceResponse<ProfileWithRoles>> {
    return handleServiceCall(async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) return { data: null, error: profileError };

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) return { data: null, error: rolesError };

      return {
        data: {
          ...profile,
          roles: roles?.map(r => r.role) || [],
        },
        error: null,
      };
    }, 'UserService.getProfileWithRoles');
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, data: ProfileUpdate): Promise<ServiceResponse<Profile>> {
    return handleServiceCall(async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select('*')
        .single();
      
      return { data: profile, error };
    }, 'UserService.updateProfile');
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: UserRole): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: role });
      
      return { data: data ?? false, error };
    }, 'UserService.hasRole');
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<ServiceResponse<boolean>> {
    return this.hasRole(userId, 'admin');
  }

  /**
   * Get user's roles
   */
  async getRoles(userId: string): Promise<ServiceResponse<UserRole[]>> {
    return handleServiceCallArray(async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) return { data: null, error };

      return { data: data?.map(r => r.role) || [], error: null };
    }, 'UserService.getRoles');
  }

  /**
   * Add a role to a user (admin only)
   */
  async addRole(userId: string, role: UserRole): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      return { data: !error, error };
    }, 'UserService.addRole');
  }

  /**
   * Remove a role from a user (admin only)
   */
  async removeRole(userId: string, role: UserRole): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      return { data: !error, error };
    }, 'UserService.removeRole');
  }

  // ==========================================================================
  // Badge Operations
  // ==========================================================================

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<ServiceResponse<Badge[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('badges')
        .select('*')
        .order('name', { ascending: true });
    }, 'UserService.getAllBadges');
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<ServiceResponse<UserBadge[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
    }, 'UserService.getUserBadges');
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeId: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId });
      
      return { data: !error, error };
    }, 'UserService.awardBadge');
  }

  // ==========================================================================
  // Admin Operations
  // ==========================================================================

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<ServiceResponse<Profile[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (options?.search) {
        query = query.or(`username.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'UserService.getAllUsers');
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<ServiceResponse<number>> {
    return handleServiceCall(async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      return { data: count ?? 0, error };
    }, 'UserService.getUserCount');
  }
}

export const userService = new UserServiceClass();
