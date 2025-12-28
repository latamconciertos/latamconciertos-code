/**
 * News/Article Entity Types
 * 
 * Types for news articles, blog posts, and related content
 * including author profiles and categories.
 */

import type { Database } from '@/integrations/supabase/types';
import type { ArtistForNews } from './artist';
import type { CategoryBasic } from './common';

// =============================================================================
// Database Row Types (direct from Supabase)
// =============================================================================

export type NewsArticleRow = Database['public']['Tables']['news_articles']['Row'];
export type NewsArticleInsert = Database['public']['Tables']['news_articles']['Insert'];
export type NewsArticleUpdate = Database['public']['Tables']['news_articles']['Update'];

export type NewsMediaRow = Database['public']['Tables']['news_media']['Row'];
export type NewsMediaInsert = Database['public']['Tables']['news_media']['Insert'];

// =============================================================================
// Extended Types with Relationships
// =============================================================================

/**
 * Full News Article entity with all relations
 */
export interface NewsArticle extends NewsArticleRow {
  artists?: ArtistForNews | null;
  categories?: CategoryBasic | null;
  profiles?: {
    username: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  news_media?: NewsMedia[];
}

/**
 * News article for listings with essential fields
 */
export interface NewsArticleForList {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  meta_description: string | null;
  content: string | null;
  published_at: string | null;
  created_at: string;
  artist_id: string | null;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  categories?: {
    name: string;
  } | null;
  profiles?: {
    username: string | null;
  } | null;
}

/**
 * News article for homepage sections
 */
export interface NewsArticleForHome {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  meta_description: string | null;
  content: string | null;
  published_at: string | null;
  created_at: string;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
}

/**
 * News article for hero/featured section
 */
export interface FeaturedNewsArticle extends NewsArticleForHome {
  categories?: {
    name: string;
    slug?: string;
  } | null;
}

// =============================================================================
// News Media Types
// =============================================================================

/**
 * Media item attached to news article
 */
export interface NewsMedia extends NewsMediaRow {}

/**
 * Media type options
 */
export type NewsMediaType = 'image' | 'video' | 'audio' | 'embed';

// =============================================================================
// Simplified Types for UI Components
// =============================================================================

/**
 * Minimal article info for references
 */
export interface NewsArticleBasic {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  published_at: string | null;
}

/**
 * News card data for grid displays
 */
export interface NewsCardData {
  id: string;
  title: string;
  slug: string;
  image: string;
  excerpt: string;
  published_at: string;
  author_name: string;
  category_name?: string;
  reading_time?: number;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * News article form data for admin create/edit
 */
export interface NewsArticleFormData {
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  featured_image: string;
  photo_credit: string;
  artist_id: string;
  concert_id: string;
  category_id: string;
  status: 'draft' | 'published';
  tags: string[];
}

/**
 * Default values for news article form
 */
export const NEWS_ARTICLE_FORM_DEFAULTS: NewsArticleFormData = {
  title: '',
  slug: '',
  content: '',
  meta_title: '',
  meta_description: '',
  keywords: '',
  featured_image: '',
  photo_credit: '',
  artist_id: '',
  concert_id: '',
  category_id: '',
  status: 'draft',
  tags: [],
};

// =============================================================================
// Comment Types
// =============================================================================

export type CommentRow = Database['public']['Tables']['comments']['Row'];

/**
 * Comment with author info
 */
export interface Comment extends CommentRow {
  profiles?: {
    username: string | null;
  } | null;
}

/**
 * Comment status options
 */
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

// =============================================================================
// Reaction Types
// =============================================================================

export type ReactionRow = Database['public']['Tables']['reactions']['Row'];

/**
 * Reaction type options
 */
export type ReactionType = 'like' | 'love' | 'fire' | 'sad' | 'angry';
