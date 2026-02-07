/**
 * Social Share Utilities
 * Helper functions for sharing to social media platforms
 */

/**
 * Check if native sharing is supported
 */
export const canShareNatively = (): boolean => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
};

/**
 * Share image to Instagram Stories
 */
export const shareToInstagramStories = async (imageBlob: Blob): Promise<void> => {
    const file = new File([imageBlob], 'story.png', { type: 'image/png' });

    // Try native share first
    if (canShareNatively()) {
        try {
            await navigator.share({
                files: [file],
                title: 'Listo para el concierto',
            });
            return;
        } catch (error) {
            console.log('Native share cancelled or failed, trying deep link');
        }
    }

    // Try Instagram deep link
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
        // iOS deep link
        window.location.href = 'instagram://story-camera';
    } else if (isAndroid) {
        // Android intent
        window.location.href = 'intent://instagram.com/create/story#Intent;package=com.instagram.android;scheme=https;end';
    } else {
        // Fallback: Download image
        downloadImage(imageBlob, 'concierto-story.png');
    }
};

/**
 * Share to TikTok
 */
export const shareToTikTok = async (imageBlob: Blob): Promise<void> => {
    const file = new File([imageBlob], 'tiktok.png', { type: 'image/png' });

    if (canShareNatively()) {
        try {
            await navigator.share({
                files: [file],
                title: 'Listo para el concierto',
                text: '#ConciertosLatam',
            });
        } catch (error) {
            console.log('Share cancelled or failed');
            // Fallback: Download image
            downloadImage(imageBlob, 'concierto-tiktok.png');
        }
    } else {
        // Fallback: Download image
        downloadImage(imageBlob, 'concierto-tiktok.png');
    }
};

/**
 * Open Instagram profile
 */
export const openInstagramProfile = (username: string = 'conciertos.latam'): void => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS || isAndroid) {
        // Try deep link first
        window.location.href = `instagram://user?username=${username}`;

        // Fallback to web after delay
        setTimeout(() => {
            window.open(`https://instagram.com/${username}`, '_blank');
        }, 1000);
    } else {
        // Desktop: Open in new tab
        window.open(`https://instagram.com/${username}`, '_blank');
    }
};

/**
 * Download image as fallback
 */
const downloadImage = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Track analytics event
 */
export const trackShareEvent = (
    eventName: string,
    properties?: Record<string, any>
): void => {
    // TODO: Integrate with analytics service (e.g., Mixpanel, GA4)
    console.log('Analytics Event:', eventName, properties);

    // Example: Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, properties);
    }
};
