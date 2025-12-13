/**
 * Image optimization utilities
 * Handles Supabase Storage URLs and Vercel Image Optimization
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

/**
 * Get full URL from Supabase Storage path
 */
export const getSupabaseImageUrl = (path: string | null): string => {
    if (!path) return '';

    // If already a full URL, return it
    if (path.startsWith('http')) return path;

    // Construct Supabase Storage URL
    return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
};

/**
 * Get optimized image URL using Vercel Image Optimization
 */
export const getOptimizedImageUrl = (
    src: string | null,
    width: number = 800,
    quality: number = 75
): string => {
    if (!src) return '';

    // Get full URL if it's a Supabase path
    const fullUrl = src.startsWith('http') ? src : getSupabaseImageUrl(src);

    // Use Vercel Image Optimization API
    return `/_vercel/image?url=${encodeURIComponent(fullUrl)}&w=${width}&q=${quality}`;
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (
    src: string,
    quality: number = 75
): string => {
    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    return widths
        .map(w => `${getOptimizedImageUrl(src, w, quality)} ${w}w`)
        .join(', ');
};

/**
 * Default fallback image
 */
export const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop';
