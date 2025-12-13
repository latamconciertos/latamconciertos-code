import { useState } from 'react';
import { generateSrcSet, getOptimizedImageUrl, DEFAULT_IMAGE } from '@/lib/imageUtils';
import { IMAGE_SIZES, ImageSizeKey } from '@/lib/imageConfig';

interface OptimizedImageProps {
    src: string | null;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean; // For above-the-fold images
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    quality?: number; // 1-100, default 75
    sizes?: string; // Custom sizes attribute
    sizePreset?: ImageSizeKey; // Use predefined size configuration
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * Automatically optimizes images using Vercel Image Optimization:
 * - Converts to WebP/AVIF automatically
 * - Generates responsive srcset
 * - Implements lazy loading
 * - Shows blur placeholder during load
 * - Handles errors with fallback image
 * 
 * @example
 * <OptimizedImage 
 *   src={concert.image_url}
 *   alt="Concert"
 *   sizePreset="card"
 *   priority={false}
 * />
 */
export const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    objectFit = 'cover',
    quality = 75,
    sizes,
    sizePreset,
    onLoad,
    onError,
}: OptimizedImageProps) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Use preset sizes if provided
    const finalSizes = sizes || (sizePreset ? IMAGE_SIZES[sizePreset].sizes : '100vw');
    const finalWidth = width || (sizePreset ? IMAGE_SIZES[sizePreset].desktop : 1920);

    // Handle image load
    const handleLoad = () => {
        setLoaded(true);
        onLoad?.();
    };

    // Handle image error
    const handleError = () => {
        setError(true);
        onError?.();
    };

    // Get the source URL
    const imageSource = error ? DEFAULT_IMAGE : (src || DEFAULT_IMAGE);

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
        >
            {/* Blur placeholder - shows while loading */}
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 animate-pulse" />
            )}

            {/* Optimized Image */}
            <img
                src={getOptimizedImageUrl(imageSource, finalWidth, quality)}
                srcSet={generateSrcSet(imageSource, quality)}
                sizes={finalSizes}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                className={`w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{ objectFit }}
            />
        </div>
    );
};
