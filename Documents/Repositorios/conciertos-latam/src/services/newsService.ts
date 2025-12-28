/**
 * News Service
 * 
 * Handles all news article-related database operations including
 * CRUD operations, filtering, and media management.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  NewsArticle,
  NewsArticleForList,
  NewsArticleForHome,
  FeaturedNewsArticle,
  NewsArticleInsert,
  NewsArticleUpdate,
  NewsMedia,
  NewsMediaInsert,
  ServiceResponse,
  ArticleStatus,
} from '@/types/entities';
import { handleServiceCall, handleServiceCallArray, SELECT_QUERIES } from './base';

export interface NewsFilterOptions {
  status?: ArticleStatus;
  categoryId?: string;
  artistId?: string;
  authorId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class NewsServiceClass {
  /**
   * Get all news articles with optional filtering
   */
  async getAll(options?: NewsFilterOptions): Promise<ServiceResponse<NewsArticle[]> & { count?: number }> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsWithRelations, { count: 'exact' })
        .order('published_at', { ascending: false, nullsFirst: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options?.artistId) {
        query = query.eq('artist_id', options.artistId);
      }
      if (options?.authorId) {
        query = query.eq('author_id', options.authorId);
      }
      if (options?.search) {
        query = query.ilike('title', `%${options.search}%`);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      return query;
    }, 'NewsService.getAll');
  }

  /**
   * Get published articles for public display
   */
  async getPublished(limit?: number): Promise<ServiceResponse<NewsArticleForList[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsBasic)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'NewsService.getPublished');
  }

  /**
   * Get latest news for homepage
   */
  async getLatest(limit: number = 6): Promise<ServiceResponse<NewsArticleForHome[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('news_articles')
        .select(`
          id, title, slug, featured_image, meta_description, content,
          published_at, created_at,
          artists (name, photo_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);
    }, 'NewsService.getLatest');
  }

  /**
   * Get featured articles for hero section
   */
  async getFeatured(limit: number = 5): Promise<ServiceResponse<FeaturedNewsArticle[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('news_articles')
        .select(`
          id, title, slug, featured_image, meta_description, content,
          published_at, created_at,
          artists (name, photo_url),
          categories (name, slug)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);
    }, 'NewsService.getFeatured');
  }

  /**
   * Get a single article by ID
   */
  async getById(id: string): Promise<ServiceResponse<NewsArticle>> {
    return handleServiceCall(async () => {
      return supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsWithRelations)
        .eq('id', id)
        .single();
    }, 'NewsService.getById');
  }

  /**
   * Get a single article by slug
   */
  async getBySlug(slug: string): Promise<ServiceResponse<NewsArticle>> {
    return handleServiceCall(async () => {
      return supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsWithRelations)
        .eq('slug', slug)
        .single();
    }, 'NewsService.getBySlug');
  }

  /**
   * Get articles by category
   */
  async getByCategory(categoryId: string, limit?: number): Promise<ServiceResponse<NewsArticleForList[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsBasic)
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'NewsService.getByCategory');
  }

  /**
   * Get articles by artist
   */
  async getByArtist(artistId: string, limit?: number): Promise<ServiceResponse<NewsArticleForList[]>> {
    return handleServiceCallArray(async () => {
      let query = supabase
        .from('news_articles')
        .select(SELECT_QUERIES.newsBasic)
        .eq('status', 'published')
        .eq('artist_id', artistId)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      return query;
    }, 'NewsService.getByArtist');
  }

  /**
   * Create a new article
   */
  async create(data: NewsArticleInsert): Promise<ServiceResponse<NewsArticle>> {
    return handleServiceCall(async () => {
      const { data: article, error } = await supabase
        .from('news_articles')
        .insert(data)
        .select(SELECT_QUERIES.newsWithRelations)
        .single();
      
      return { data: article, error };
    }, 'NewsService.create');
  }

  /**
   * Update an existing article
   */
  async update(id: string, data: NewsArticleUpdate): Promise<ServiceResponse<NewsArticle>> {
    return handleServiceCall(async () => {
      const { data: article, error } = await supabase
        .from('news_articles')
        .update(data)
        .eq('id', id)
        .select(SELECT_QUERIES.newsWithRelations)
        .single();
      
      return { data: article, error };
    }, 'NewsService.update');
  }

  /**
   * Delete an article
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'NewsService.delete');
  }

  /**
   * Publish an article
   */
  async publish(id: string): Promise<ServiceResponse<NewsArticle>> {
    return this.update(id, { 
      status: 'published', 
      published_at: new Date().toISOString() 
    });
  }

  /**
   * Unpublish an article (set to draft)
   */
  async unpublish(id: string): Promise<ServiceResponse<NewsArticle>> {
    return this.update(id, { status: 'draft' });
  }

  // ==========================================================================
  // News Media Operations
  // ==========================================================================

  /**
   * Get media for an article
   */
  async getMedia(articleId: string): Promise<ServiceResponse<NewsMedia[]>> {
    return handleServiceCallArray(async () => {
      return supabase
        .from('news_media')
        .select('*')
        .eq('article_id', articleId)
        .order('position', { ascending: true });
    }, 'NewsService.getMedia');
  }

  /**
   * Add media to an article
   */
  async addMedia(data: NewsMediaInsert): Promise<ServiceResponse<NewsMedia>> {
    return handleServiceCall(async () => {
      const { data: media, error } = await supabase
        .from('news_media')
        .insert(data)
        .select('*')
        .single();
      
      return { data: media, error };
    }, 'NewsService.addMedia');
  }

  /**
   * Delete media from an article
   */
  async deleteMedia(id: string): Promise<ServiceResponse<boolean>> {
    return handleServiceCall(async () => {
      const { error } = await supabase
        .from('news_media')
        .delete()
        .eq('id', id);
      
      return { data: !error, error };
    }, 'NewsService.deleteMedia');
  }
}

export const newsService = new NewsServiceClass();
