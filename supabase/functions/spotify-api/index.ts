import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('Spotify credentials not configured');
    throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.');
  }

  console.log('Fetching new Spotify access token...');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get Spotify token:', response.status, error);
      throw new Error(`Failed to get Spotify access token: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    console.log('Spotify token obtained successfully');
    return accessToken!;
  } catch (error: any) {
    console.error('Error fetching Spotify token:', error.message);
    // Reset token on error to force retry
    accessToken = null;
    tokenExpiry = 0;
    throw error;
  }
}

async function getArtistByName(artistName: string): Promise<any> {
  const token = await getAccessToken();

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(artistName)}"&type=artist&limit=5`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search Spotify artist');
  }

  const searchData = await searchResponse.json();
  console.log(`Spotify getArtistByName for "${artistName}": ${searchData.artists.items.length} results`);

  let bestMatch = searchData.artists.items.find(
    (artist: any) => artist.name.toLowerCase() === artistName.toLowerCase()
  );

  if (!bestMatch && searchData.artists.items.length > 0) {
    bestMatch = searchData.artists.items[0];
  }

  if (bestMatch) {
    return {
      id: bestMatch.id,
      name: bestMatch.name,
      imageUrl: bestMatch.images[0]?.url || null,
      genres: bestMatch.genres || [],
      popularity: bestMatch.popularity,
      external_urls: bestMatch.external_urls
    };
  }

  return null;
}

async function searchArtist(artistName: string): Promise<any> {
  const token = await getAccessToken();

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(artistName)}"&type=artist&limit=5`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search Spotify artist');
  }

  const searchData = await searchResponse.json();
  console.log(`Spotify search for "${artistName}": ${searchData.artists.items.length} results`);

  let bestMatch = searchData.artists.items.find(
    (artist: any) => artist.name.toLowerCase() === artistName.toLowerCase()
  );

  if (!bestMatch && searchData.artists.items.length > 0) {
    bestMatch = searchData.artists.items[0];
  }

  if (bestMatch && bestMatch.images.length > 0) {
    return {
      imageUrl: bestMatch.images[0].url,
      name: bestMatch.name,
      id: bestMatch.id
    };
  }

  return null;
}

async function searchArtists(query: string): Promise<any[]> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search artists');
  }

  const data = await response.json();
  return data.artists?.items || [];
}

async function searchTrack(query: string, artist?: string): Promise<any[]> {
  const token = await getAccessToken();

  let searchQuery = query;
  if (artist) {
    searchQuery += ` artist:${artist}`;
  }

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search Spotify tracks');
  }

  const searchData = await searchResponse.json();
  return searchData.tracks?.items || [];
}

async function getArtistTopTracks(
  opts: { spotifyId?: string; artistName?: string; market?: string }
): Promise<any[]> {
  const token = await getAccessToken();
  const market = opts.market || 'CO';

  // Prefer the exact Spotify artist ID (from the artist's stored Spotify URL).
  // Fall back to an exact-name lookup only when no ID is available.
  let artistId = opts.spotifyId;
  if (!artistId && opts.artistName) {
    const artist = await getArtistByName(opts.artistName);
    artistId = artist?.id;
  }

  if (!artistId) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch artist top tracks');
  }

  const data = await response.json();
  return data.tracks || [];
}

async function getTopTracksByMarket(market: string, limit: number = 10): Promise<any[]> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=year:2024-2025&type=track&market=${market}&limit=${limit * 2}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch top tracks');
  }

  const data = await response.json();
  const tracks = data.tracks?.items || [];

  return tracks
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

async function getTracksByIds(trackIds: string[]): Promise<any[]> {
  const token = await getAccessToken();

  const chunks = [];
  for (let i = 0; i < trackIds.length; i += 50) {
    chunks.push(trackIds.slice(i, i + 50));
  }

  const allTracks: any[] = [];

  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tracks');
    }

    const data = await response.json();
    allTracks.push(...(data.tracks || []));
  }

  return allTracks;
}

async function getArtistsByIds(artistIds: string[]): Promise<any[]> {
  const token = await getAccessToken();

  const chunks = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    chunks.push(artistIds.slice(i, i + 50));
  }

  const allArtists: any[] = [];

  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch artists');
    }

    const data = await response.json();
    allArtists.push(...(data.artists || []));
  }

  return allArtists;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Función pública: protegida con rate limit por IP (no exige auth).
  const limited = await enforceRateLimit(req, {
    functionName: 'spotify-api',
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  try {
    const { action, artistName, query, artist, market, limit, artistIds, spotifyId, trackIds } = await req.json();

    console.log(`Spotify API action: ${action}`);

    let result;

    switch (action) {
      case 'searchArtist':
        if (!artistName) throw new Error('artistName is required');
        result = await searchArtist(artistName);
        break;

      case 'searchArtists':
        if (!query) throw new Error('query is required');
        result = await searchArtists(query);
        break;

      case 'searchTrack':
        if (!query) throw new Error('query is required');
        result = await searchTrack(query, artist);
        break;

      case 'getArtistTopTracks':
        if (!spotifyId && !artistName) throw new Error('spotifyId or artistName is required');
        result = await getArtistTopTracks({ spotifyId, artistName, market });
        break;

      case 'getTopTracksByMarket':
        if (!market) throw new Error('market is required');
        result = await getTopTracksByMarket(market, limit || 10);
        break;

      case 'getArtistsByIds':
        if (!artistIds || !Array.isArray(artistIds)) throw new Error('artistIds array is required');
        if (artistIds.length > 200) throw new Error('artistIds excede el máximo permitido (200)');
        result = await getArtistsByIds(artistIds);
        break;

      case 'getTracksByIds':
        if (!trackIds || !Array.isArray(trackIds)) throw new Error('trackIds array is required');
        if (trackIds.length > 200) throw new Error('trackIds excede el máximo permitido (200)');
        result = await getTracksByIds(trackIds);
        break;

      case 'getArtistByName':
        if (!artistName) throw new Error('artistName is required');
        result = await getArtistByName(artistName);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Spotify API error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
