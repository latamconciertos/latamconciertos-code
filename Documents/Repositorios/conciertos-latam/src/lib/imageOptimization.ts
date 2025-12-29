/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images for web performance,
 * including lazy loading, format optimization, and size reduction.
 */

/**
 * Options for optimizing Unsplash images
 */
interface UnsplashOptimizationOptions {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** Quality (1-100) */
    quality?: number;
    /** Output format */
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    /** Device pixel ratio (1 or 2 for retina) */
    dpr?: 1 | 2;
}

/**
 * Optimizes Unsplash image URLs with compression and format parameters
 * 
 * @example
 * const optimized = optimizeUnsplashUrl(
 *   'https://images.unsplash.com/photo-123',
 *   { width: 800, quality: 85, format: 'webp' }
 * );
 */
export const optimizeUnsplashUrl = (
    url: string,
    options: UnsplashOptimizationOptions = {}
): string => {
    // Only optimize Unsplash URLs
    if (!url || !url.includes('unsplash.com')) {
        return url;
    }

    const {
        width,
        height,
        quality = 80,
        format = 'auto',
        dpr = 1,
    } = options;

    const params = new URLSearchParams();

    // Size parameters
    if (width) params.set('w', Math.round(width * dpr).toString());
    if (height) params.set('h', Math.round(height * dpr).toString());

    // Quality and format
    params.set('q', quality.toString());
    params.set('fm', format);

    // Auto-optimize (compression + format selection)
    params.set('auto', 'format,compress');

    // Fit mode (crop to exact dimensions)
    if (width && height) {
        params.set('fit', 'crop');
    }

    // Combine with existing URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
};

/**
 * Get optimized image URL based on viewport size and device
 * 
 * @example
 * const url = getResponsiveImageUrl(originalUrl, 'mobile');
 */
export const getResponsiveImageUrl = (
    url: string,
    size: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): string => {
    const sizeConfig = {
        mobile: { width: 400, quality: 75 },
        tablet: { width: 768, quality: 80 },
        desktop: { width: 1200, quality: 85 },
    };

    const config = sizeConfig[size];
    return optimizeUnsplashUrl(url, config);
};

/**
 * Generate srcSet for responsive images
 * 
 * @example
 * <img src={url} srcSet={generateSrcSet(url)} />
 */
export const generateSrcSet = (url: string): string => {
    if (!url || !url.includes('unsplash.com')) {
        return '';
    }

    const sizes = [
        { width: 400, descriptor: '400w' },
        { width: 800, descriptor: '800w' },
        { width: 1200, descriptor: '1200w' },
        { width: 1600, descriptor: '1600w' },
    ];

    return sizes
        .map(({ width, descriptor }) => {
            const optimized = optimizeUnsplashUrl(url, { width, quality: 80 });
            return `${optimized} ${descriptor}`;
        })
        .join(', ');
};

/**
 * Check if an image should be lazy loaded
 * (Images "above the fold" should not be lazy loaded)
 */
export const shouldLazyLoad = (index: number, isFirstScreen: boolean = false): boolean => {
    // First 2-3 images on first screen should load eagerly
    if (isFirstScreen && index < 3) {
        return false;
    }
    return true;
};

/**
 * Get default placeholder image
 */
export const getDefaultImage = (type: 'concert' | 'festival' | 'artist' = 'concert'): string => {
    const defaults = {
        concert: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80&fm=webp&auto=format,compress',
        festival: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop&q=80&fm=webp&auto=format,compress',
        artist: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop&q=80&fm=webp&auto=format,compress',
    };

    return defaults[type];
};
