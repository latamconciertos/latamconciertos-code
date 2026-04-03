/**
 * Base Service Utilities
 * 
 * Common utilities and error handling for all services.
 * Provides consistent error handling and response formatting.
 */

import type { ServiceResponse } from '@/types/entities';
import { AppError } from '@/lib/errors/AppError';
import { mapSupabaseError } from '@/lib/errors/supabaseErrors';

/**
 * Wraps a Supabase operation with consistent error handling
 */
export async function handleServiceCall<T>(
  operation: () => Promise<{ data: any; error: any }>,
  context: string
): Promise<ServiceResponse<T>> {
  try {
    const { data, error } = await operation();

    if (error) {
      const { code, message } = mapSupabaseError(error);
      const appError = new AppError({
        code,
        message: message || error.message,
        context: { service: context, originalError: error },
      });
      console.error(`[${context}]`, appError.toJSON());

      return {
        data: null,
        error: appError.message,
        success: false,
      };
    }

    return {
      data: data as T,
      error: null,
      success: true,
    };
  } catch (err) {
    const appError = AppError.from(err, { context: { service: context } });
    console.error(`[${context}] Exception:`, appError.toJSON());

    return {
      data: null,
      error: appError.message,
      success: false,
    };
  }
}

/**
 * Wraps a Supabase operation that returns an array with consistent error handling
 */
export async function handleServiceCallArray<T>(
  operation: () => Promise<{ data: any[] | null; error: any; count?: number | null }>,
  context: string
): Promise<ServiceResponse<T[]> & { count?: number }> {
  try {
    const { data, error, count } = await operation();

    if (error) {
      const { code, message } = mapSupabaseError(error);
      const appError = new AppError({
        code,
        message: message || error.message,
        context: { service: context, originalError: error },
      });
      console.error(`[${context}]`, appError.toJSON());

      return {
        data: [],
        error: appError.message,
        success: false,
        count: 0,
      };
    }

    return {
      data: (data || []) as T[],
      error: null,
      success: true,
      count: count ?? data?.length ?? 0,
    };
  } catch (err) {
    const appError = AppError.from(err, { context: { service: context } });
    console.error(`[${context}] Exception:`, appError.toJSON());

    return {
      data: [],
      error: appError.message,
      success: false,
      count: 0,
    };
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Common select queries for reuse across services
 */
export const SELECT_QUERIES = {
  concertWithRelations: `
    *,
    artists (id, name, photo_url, slug),
    venues (
      id, name, location, slug, capacity,
      cities (
        id, name, slug,
        countries (id, name, iso_code)
      )
    ),
    promoters (id, name)
  `,

  concertBasic: `
    id, title, slug, date, image_url, event_type, is_featured,
    artists (id, name, photo_url, slug),
    venues (
      id, name, location,
      cities (name, countries (name))
    )
  `,

  artistBasic: `id, name, slug, photo_url, bio, social_links, genres`,

  venueWithLocation: `
    *,
    cities (
      id, name, slug,
      countries (id, name, iso_code)
    )
  `,

  newsWithRelations: `
    *,
    artists (id, name, photo_url),
    categories (id, name, slug),
    news_media (*)
  `,

  newsBasic: `
    id, title, slug, featured_image, meta_description, content,
    published_at, created_at, artist_id,
    artists (name, photo_url),
    categories (name)
  `,

  setlistSongWithContributor: `
    *,
    profiles:contributed_by (username)
  `,
} as const;
