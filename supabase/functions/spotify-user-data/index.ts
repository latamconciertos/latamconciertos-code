import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getUserIdFromJwt(authHeader: string): string {
  const token = authHeader.replace('Bearer ', '');
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub;
}

async function getUserTokens(userId: string): Promise<{ access_token: string; refresh_token: string; token_expires_at: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('spotify_user_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Failed to fetch user tokens:', error?.message);
    throw new Error('spotify_disconnected');
  }

  return data;
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('Spotify credentials not configured');
    throw new Error('Spotify credentials not configured');
  }

  console.log(`Refreshing Spotify token for user ${userId}...`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to refresh Spotify token:', response.status, error);
    throw new Error('spotify_disconnected');
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token || refreshToken;
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: updateError } = await supabase
    .from('spotify_user_connections')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_expires_at: expiresAt,
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update tokens in DB:', updateError.message);
  }

  console.log('Spotify token refreshed successfully');
  return newAccessToken;
}

async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getUserTokens(userId);

  const expiresAt = new Date(tokens.token_expires_at).getTime();
  const now = Date.now();

  // Refresh if token expires within 60 seconds
  if (now >= expiresAt - 60000) {
    console.log('Token expired or expiring soon, refreshing...');
    return await refreshAccessToken(userId, tokens.refresh_token);
  }

  return tokens.access_token;
}

async function getTopArtists(
  userId: string,
  timeRange: string = 'long_term',
  limit: number = 50
): Promise<any[]> {
  const token = await getValidAccessToken(userId);

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch top artists:', response.status, error);
    throw new Error('Failed to fetch top artists');
  }

  const data = await response.json();
  console.log(`Spotify getTopArtists (${timeRange}): ${data.items.length} results`);

  return data.items.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images[0]?.url || null,
    genres: artist.genres || [],
    popularity: artist.popularity,
  }));
}

async function getTopTracks(
  userId: string,
  timeRange: string = 'long_term',
  limit: number = 50
): Promise<any[]> {
  const token = await getValidAccessToken(userId);

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch top tracks:', response.status, error);
    throw new Error('Failed to fetch top tracks');
  }

  const data = await response.json();
  console.log(`Spotify getTopTracks (${timeRange}): ${data.items.length} results`);

  return data.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0]?.name || 'Unknown',
    albumName: track.album?.name || 'Unknown',
    albumImage: track.album?.images[0]?.url || null,
    popularity: track.popularity,
  }));
}

async function getRecentlyPlayed(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const token = await getValidAccessToken(userId);

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch recently played:', response.status, error);
    throw new Error('Failed to fetch recently played');
  }

  const data = await response.json();
  console.log(`Spotify getRecentlyPlayed: ${data.items.length} results`);

  return data.items.map((item: any) => ({
    trackName: item.track?.name || 'Unknown',
    artistName: item.track?.artists[0]?.name || 'Unknown',
    playedAt: item.played_at,
    albumImage: item.track?.album?.images[0]?.url || null,
  }));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const userId = getUserIdFromJwt(authHeader);
    if (!userId) {
      throw new Error('Invalid token: no user ID');
    }

    const { action, timeRange, limit } = await req.json();

    console.log(`Spotify User Data action: ${action} for user ${userId}`);

    let result;

    switch (action) {
      case 'getTopArtists':
        result = await getTopArtists(userId, timeRange || 'long_term', limit || 50);
        break;

      case 'getTopTracks':
        result = await getTopTracks(userId, timeRange || 'long_term', limit || 50);
        break;

      case 'getRecentlyPlayed':
        result = await getRecentlyPlayed(userId, limit || 50);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Spotify User Data error:', error.message);

    if (error.message === 'spotify_disconnected') {
      return new Response(JSON.stringify({ error: 'spotify_disconnected' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
