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
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
}

function getUserIdFromJwt(authHeader: string): string {
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.sub) throw new Error('No sub in token');
    return payload.sub;
  } catch {
    throw new Error('Invalid token');
  }
}

async function getAuthUrl(userId: string): Promise<{ authUrl: string }> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_REDIRECT_URI) {
    throw new Error('Spotify OAuth credentials not configured. SPOTIFY_CLIENT_ID=' + (SPOTIFY_CLIENT_ID ? 'set' : 'missing') + ' SPOTIFY_REDIRECT_URI=' + (SPOTIFY_REDIRECT_URI ? 'set' : 'missing'));
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

  return { authUrl: `https://accounts.spotify.com/authorize?${params.toString()}` };
}

async function handleCallback(code: string, userId: string): Promise<{ success: boolean; displayName: string }> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    throw new Error('Spotify OAuth credentials not configured');
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Token exchange failed:', tokenResponse.status, error);
    throw new Error('Failed to exchange authorization code');
  }

  const tokenData = await tokenResponse.json();

  const profileResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch Spotify profile');
  }

  const profile = await profileResponse.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const supabase = getServiceClient();
  const { error: upsertError } = await supabase
    .from('spotify_user_connections')
    .upsert({
      user_id: userId,
      spotify_user_id: profile.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt,
      scopes: 'user-top-read user-read-recently-played',
      display_name: profile.display_name || profile.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('Failed to store connection:', upsertError.message);
    throw new Error('Failed to save Spotify connection');
  }

  return { success: true, displayName: profile.display_name || profile.id };
}

async function status(userId: string): Promise<{ connected: boolean; displayName: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('spotify_user_connections')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { connected: false, displayName: null };
  }
  return { connected: true, displayName: data.display_name };
}

async function disconnect(userId: string): Promise<{ success: boolean }> {
  const supabase = getServiceClient();
  await supabase.from('spotify_user_connections').delete().eq('user_id', userId);
  return { success: true };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, code } = body;

    console.log(`Spotify Auth action: ${action}`);

    const authHeader = req.headers.get('Authorization') || '';
    const userId = getUserIdFromJwt(authHeader);

    let result: unknown;

    switch (action) {
      case 'getAuthUrl':
        result = await getAuthUrl(userId);
        break;
      case 'callback':
        if (!code) throw new Error('code is required');
        result = await handleCallback(code, userId);
        break;
      case 'status':
        result = await status(userId);
        break;
      case 'disconnect':
        result = await disconnect(userId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Spotify Auth error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Invalid token' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
