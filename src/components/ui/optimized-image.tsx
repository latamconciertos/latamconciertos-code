/**
 * OptimizedImage Component
 * 
 * A performance-optimized image component that handles:
 * - Lazy loading
 * - Error states
 * - Responsive images
 * - Automatic format optimization
 * - Smooth loading transitions
 */

import { useState, ImgHTMLAttributes } from 'react';
import { optimizeUnsplashUrl, generateSrcSet } from '@/lib/imageOptimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** Image source URL */
    src: string;
    /** Alt text (required for accessibility) */
    alt: string;
    /** Whether to load image immediately (for above-the-fold images) */
    priority?: boolean;
    /** Fallback image if source fails to load */
    fallbackSrc?: string;
    /** Target width for optimization */
    width?: number;
    /** Target height for optimization */
    height?: number;
    /** Quality (1-100) */
    quality?: number;
    /** Custom className */
    className?: string;
    /** Callback when image loads */
    onLoad?: () => void;
    /** Callback when image fails to load */
    onError?: () => void;
}

/**
 * Optimized image component with automatic lazy loading and format optimization
 * 
 * @example
 * <OptimizedImage
 *   src={concert.image_url}
 *   alt={concert.title}
 *   width={400}
 *   className="w-full h-48 object-cover"
 *   priority={index === 0}
 * />
 */
export const OptimizedImage = ({
    src,
    alt,
    priority = false,
    fallbackSrc,
    width,
    height,
    quality = 80,
    className,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...props
}: OptimizedImageProps) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Optimize the source URL if it's from Unsplash
    const optimizedSrc = src.includes('unsplash.com')
        ? optimizeUnsplashUrl(src, { width, height, quality, format: 'webp' })
        : src;

    // Generate srcset for responsive images (Unsplash only)
    const srcSet = src.includes('unsplash.com') ? generateSrcSet(src) : undefined;

    const handleLoad = () => {
        setLoaded(true);
        onLoadProp?.();
    };

    const handleError = () => {
        setError(true);
        onErrorProp?.();
    };

    // If image failed and we have a fallback, use it
    const finalSrc = error && fallbackSrc ? fallbackSrc : optimizedSrc;

    // If no fallback and error occurred, show placeholder div
    if (error && !fallbackSrc) {
        return (
            <div
                className={cn(
                    'bg-muted flex items-center justify-center text-muted-foreground text-sm',
                    className
                )}
                role="img"
                aria-label={alt}
            >
                <span className="sr-only">{alt}</span>
            </div>
        );
    }

    return (
        <img
            {...props}
            src={finalSrc}
            srcSet={srcSet}
            sizes={srcSet ? '(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px' : undefined}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
                'transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0',
                className
            )}
        />
    );
};
