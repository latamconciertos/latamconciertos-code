/**
 * Image size configurations for different components
 * Defines responsive breakpoints and sizes for optimal loading
 */

export const IMAGE_SIZES = {
    hero: {
        mobile: 640,
        tablet: 1024,
        desktop: 1920,
        sizes: '100vw',
    },
    card: {
        mobile: 320,
        tablet: 400,
        desktop: 600,
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    },
    thumbnail: {
        mobile: 150,
        tablet: 200,
        desktop: 300,
        sizes: '(max-width: 640px) 150px, (max-width: 1024px) 200px, 300px',
    },
    avatar: {
        mobile: 40,
        tablet: 48,
        desktop: 64,
        sizes: '64px',
    },
    gallery: {
        mobile: 640,
        tablet: 800,
        desktop: 1200,
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    },
    blog: {
        mobile: 640,
        tablet: 800,
        desktop: 1200,
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px',
    },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;
