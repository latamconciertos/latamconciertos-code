/**
 * YouTube Utilities
 * 
 * Helper functions for working with YouTube URLs and embed codes
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /youtube\.com\/watch\?.*v=([^&]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Extract Vimeo video ID from URL
 * Supports: https://vimeo.com/VIDEO_ID
 */
export function extractVimeoId(url: string): string | null {
    const pattern = /vimeo\.com\/(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
}

/**
 * Generate YouTube embed code from video ID or URL
 */
export function generateYouTubeEmbed(videoIdOrUrl: string): string {
    const videoId = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl;

    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
}

/**
 * Generate Vimeo embed code from video ID or URL
 */
export function generateVimeoEmbed(videoIdOrUrl: string): string {
    const videoId = extractVimeoId(videoIdOrUrl) || videoIdOrUrl;

    return `<iframe src="https://player.vimeo.com/video/${videoId}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
}

/**
 * Get YouTube thumbnail URL from video ID or URL
 */
export function getYouTubeThumbnail(videoIdOrUrl: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'maxres'): string {
    const videoId = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl;

    const qualityMap = {
        default: 'default.jpg',
        mq: 'mqdefault.jpg',
        hq: 'hqdefault.jpg',
        sd: 'sddefault.jpg',
        maxres: 'maxresdefault.jpg',
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Get Vimeo thumbnail URL (requires API call, returns placeholder)
 */
export function getVimeoThumbnail(videoIdOrUrl: string): string {
    // Vimeo thumbnails require API call, return placeholder
    // In production, you'd want to fetch this from Vimeo's API
    return `https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=450&fit=crop`;
}

/**
 * Detect video platform from URL
 */
export function detectVideoPlatform(url: string): 'youtube' | 'vimeo' | 'unknown' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }
    if (url.includes('vimeo.com')) {
        return 'vimeo';
    }
    return 'unknown';
}

/**
 * Generate embed code and thumbnail based on URL
 */
export function processVideoUrl(url: string): {
    embedCode: string;
    thumbnailUrl: string;
    platform: 'youtube' | 'vimeo' | 'unknown';
    videoId: string | null;
} {
    const platform = detectVideoPlatform(url);

    if (platform === 'youtube') {
        const videoId = extractYouTubeId(url);
        return {
            embedCode: generateYouTubeEmbed(url),
            thumbnailUrl: getYouTubeThumbnail(url),
            platform,
            videoId,
        };
    }

    if (platform === 'vimeo') {
        const videoId = extractVimeoId(url);
        return {
            embedCode: generateVimeoEmbed(url),
            thumbnailUrl: getVimeoThumbnail(url),
            platform,
            videoId,
        };
    }

    return {
        embedCode: '',
        thumbnailUrl: '',
        platform: 'unknown',
        videoId: null,
    };
}
