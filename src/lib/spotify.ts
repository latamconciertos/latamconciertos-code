import { supabase } from "@/integrations/supabase/client";

interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls?: {
    spotify: string;
  };
  popularity?: number;
  genres?: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id?: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity?: number;
}

class SpotifyService {
  private artistImageCache: Map<string, string> = new Map();

  async searchArtist(artistName: string): Promise<string | null> {
    try {
      const cacheKey = artistName.toLowerCase().trim();
      if (this.artistImageCache.has(cacheKey)) {
        console.log(`Using cached image for: ${artistName}`);
        return this.artistImageCache.get(cacheKey)!;
      }

      console.log(`Searching Spotify for artist: ${artistName}`);

      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'searchArtist', artistName }
      });

      if (error) {
        console.error('Edge function error:', error);
        return null;
      }

      if (data?.data?.imageUrl) {
        const imageUrl = data.data.imageUrl;
        console.log(`Found image for ${artistName}: ${imageUrl}`);
        this.artistImageCache.set(cacheKey, imageUrl);
        return imageUrl;
      }

      return null;
    } catch (error) {
      console.error('Error fetching artist image from Spotify:', error);
      return null;
    }
  }

  async searchArtists(query: string): Promise<SpotifyArtist[]> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'searchArtists', query }
      });

      if (error) {
        console.error('Edge function error:', error);
        return [];
      }

      return data?.data || [];
    } catch (error) {
      console.error('Error searching artists on Spotify:', error);
      return [];
    }
  }

  async searchTrack(query: string, artist?: string): Promise<SpotifyTrack[]> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'searchTrack', query, artist }
      });

      if (error) {
        console.error('Edge function error:', error);
        return [];
      }

      return data?.data || [];
    } catch (error) {
      console.error('Error searching tracks on Spotify:', error);
      return [];
    }
  }

  async getTopTracksByMarket(market: string, limit: number = 10): Promise<SpotifyTrack[]> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getTopTracksByMarket', market, limit }
      });

      if (error) {
        console.error('Edge function error:', error);
        return [];
      }

      return data?.data || [];
    } catch (error) {
      console.error('Error fetching top tracks from Spotify:', error);
      return [];
    }
  }

  async getArtistsByIds(artistIds: string[]): Promise<SpotifyArtist[]> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getArtistsByIds', artistIds }
      });

      if (error) {
        console.error('Edge function error:', error);
        return [];
      }

      return data?.data || [];
    } catch (error) {
      console.error('Error fetching artists from Spotify:', error);
      return [];
    }
  }

  async getArtistImage(artistName: string, fallbackUrl?: string): Promise<string> {
    console.log(`Getting artist image for: ${artistName}`);
    const spotifyImage = await this.searchArtist(artistName);

    if (spotifyImage) {
      return spotifyImage;
    }

    if (fallbackUrl) {
      console.log(`Using fallback image for: ${artistName}`);
      return fallbackUrl;
    }

    console.log(`Using default image for: ${artistName}`);
    return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop";
  }

  async getArtistData(artistName: string): Promise<{
    id: string;
    name: string;
    imageUrl: string | null;
    genres: string[];
    popularity?: number;
  } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getArtistByName', artistName }
      });

      if (error) {
        console.error('Edge function error:', error);
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error('Error fetching artist data from Spotify:', error);
      return null;
    }
  }

  getTopArtistsFromTracks(tracks: SpotifyTrack[], limit: number = 10): { id: string; name: string; count: number }[] {
    const artistCount = new Map<string, { name: string; count: number }>();

    tracks.forEach(track => {
      track.artists.forEach(artist => {
        const current = artistCount.get(artist.name) || { name: artist.name, count: 0 };
        artistCount.set(artist.name, { name: artist.name, count: current.count + 1 });
      });
    });

    return Array.from(artistCount.entries())
      .map(([id, data]) => ({ id, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const spotifyService = new SpotifyService();
export type { SpotifyTrack, SpotifyArtist };
