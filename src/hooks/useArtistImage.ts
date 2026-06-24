import { useState, useEffect } from 'react';
import { spotifyService } from '@/lib/spotify';

/**
 * Resolves an artist's image from Spotify by name. Returns null while loading
 * or when no match is found. spotifyService caches by name, so repeated
 * artists across rows reuse the same edge-function result.
 */
export const useArtistImage = (artistName: string | null) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!artistName) {
            setImageUrl(null);
            return;
        }

        let cancelled = false;
        spotifyService.searchArtist(artistName).then((url) => {
            if (!cancelled) setImageUrl(url);
        });

        return () => {
            cancelled = true;
        };
    }, [artistName]);

    return imageUrl;
};
