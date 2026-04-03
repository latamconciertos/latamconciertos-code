/**
 * Category Service
 * 
 * Handles all category-related database operations for news articles.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Category,
  CategoryBasic,
  CategoryInsert,
  CategoryUpdate,
  ServiceResponse,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray } from './base';

class CategoryServiceClass {
  /**
   * Get all categories
   */
  async getAll(): Promise<ServiceResponse<Category[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
    }, 'CategoryService.getAll');
  }

  /**
   * Get categories for dropdown selectors
   */
  async getOptions(): Promise<ServiceResponse<CategoryBasic[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('categories')
        .select('id, name, slug')
        .order('name', { ascending: true });
    }, 'CategoryService.getOptions');
  }

  /**
   * Get a single category by ID
   */
  async getById(id: string): Promise<ServiceResponse<Category>> {
    return handleServiceCall(async () => {
      return supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
    }, 'CategoryService.getById');
  }

  /**
   * Get a category by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<Category>> {
    return handleServiceCall(async () => {
      return supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
    }, 'CategoryService.getBySlug');
  }

  /**
   * Create a new category
   */
  async create(data: CategoryInsert): Promise<ServiceResponse<Category>> {
    return handleServiceCall(async () => {
      const { data: category, error } = await supabase
        .from('categories')
        .insert(data)
        .select('*')
        .single();
      
      return { data: category, error };
    }, 'CategoryService.create');
  }

  /**
   * Update an existing category
   */
  async update(id: string, data: CategoryUpdate): Promise<ServiceResponse<Category>> {
    return handleServiceCall(async () => {
      const { data: category, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      return { data: category, error };
    }, 'CategoryService.update');
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'CategoryService.delete');
  }

  /**
   * Get article count by category
   */
  async getArticleCount(categoryId: string): Promise<ServiceResponse<number>> {
    return handleServiceCall(async () => {
      const { count, error } = await supabase
        .from('news_articles')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('status', 'published');
      
      return { data: count ?? 0, error };
    }, 'CategoryService.getArticleCount');
  }
}

export const categoryService = new CategoryServiceClass();
