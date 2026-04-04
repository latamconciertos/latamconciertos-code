import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const SPOTIFY_REDIRECT_URI = Deno.env.get('SPOTIFY_REDIRECT_URI');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getUserIdFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth error:', error?.message);
    throw new Error('Invalid or expired token');
  }

  return user.id;
}

async function getAuthUrl(userId: string): Promise<{ authUrl: string }> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_REDIRECT_URI) {
    throw new Error('Spotify OAuth credentials not configured');
  }

  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const state = `${randomPart}:${userId}`;

  const scopes = 'user-top-read user-read-recently-played';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return { authUrl };
}

async function callback(code: string, userId: string): Promise<{ success: boolean; displayName: string }> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    throw new Error('Spotify OAuth credentials not configured');
  }

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Failed to exchange code for tokens:', tokenResponse.status, error);
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const tokenData = await tokenResponse.json();

  // Get user's Spotify profile
  const profileResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    console.error('Failed to fetch Spotify profile:', profileResponse.status);
    throw new Error('Failed to fetch Spotify user profile');
  }

  const profile = await profileResponse.json();

  // Calculate token expiry timestamp
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  // Store tokens in spotify_user_connections
  const supabase = getServiceClient();

  const { error: upsertError } = await supabase
    .from('spotify_user_connections')
    .upsert(
      {
        user_id: userId,
        spotify_user_id: profile.id,
        display_name: profile.display_name || profile.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('Failed to store Spotify connection:', upsertError.message);
    throw new Error('Failed to save Spotify connection');
  }

  console.log(`Spotify connected for user ${userId} (${profile.display_name})`);

  return { success: true, displayName: profile.display_name || profile.id };
}

async function refresh(userId: string): Promise<{ accessToken: string; expiresAt: string }> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify OAuth credentials not configured');
  }

  const supabase = getServiceClient();

  // Read user's refresh token
  const { data: connection, error: readError } = await supabase
    .from('spotify_user_connections')
    .select('refresh_token')
    .eq('user_id', userId)
    .single();

  if (readError || !connection) {
    throw new Error('No Spotify connection found for this user');
  }

  // Request new access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Failed to refresh Spotify token:', tokenResponse.status, error);
    throw new Error('Failed to refresh Spotify access token');
  }

  const tokenData = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  // Update stored tokens (Spotify may or may not return a new refresh_token)
  const updatePayload: Record<string, string> = {
    access_token: tokenData.access_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  if (tokenData.refresh_token) {
    updatePayload.refresh_token = tokenData.refresh_token;
  }

  const { error: updateError } = await supabase
    .from('spotify_user_connections')
    .update(updatePayload)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update stored tokens:', updateError.message);
    throw new Error('Failed to update stored tokens');
  }

  console.log(`Spotify token refreshed for user ${userId}`);

  return { accessToken: tokenData.access_token, expiresAt };
}

async function disconnect(userId: string): Promise<{ success: boolean }> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('spotify_user_connections')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to disconnect Spotify:', error.message);
    throw new Error('Failed to disconnect Spotify');
  }

  console.log(`Spotify disconnected for user ${userId}`);

  return { success: true };
}

async function status(userId: string): Promise<{ connected: boolean; displayName: string | null }> {
  const supabase = getServiceClient();

  const { data: connection, error } = await supabase
    .from('spotify_user_connections')
    .select('display_name')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    return { connected: false, displayName: null };
  }

  return { connected: true, displayName: connection.display_name };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { action, code } = await req.json();

    console.log(`Spotify Auth action: ${action}`);

    let result;

    switch (action) {
      case 'getAuthUrl':
        result = await getAuthUrl(userId);
        break;

      case 'callback':
        if (!code) throw new Error('code is required');
        result = await callback(code, userId);
        break;

      case 'refresh':
        result = await refresh(userId);
        break;

      case 'disconnect':
        result = await disconnect(userId);
        break;

      case 'status':
        result = await status(userId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Spotify Auth error:', error.message);

    const statusCode = error.message === 'Missing Authorization header' ||
      error.message === 'Invalid or expired token'
      ? 401
      : 500;

    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
