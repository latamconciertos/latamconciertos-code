// deno-lint-ignore-file
// @ts-nocheck
// Recibe una respuesta de encuesta (top-N de artistas + perfil anónimo) y la persiste con
// service role. Es la ÚNICA vía de escritura a poll_responses: el público no tiene INSERT.
// Cada artista con spotify_id se verifica contra Spotify antes de crearlo en `artists`, para
// que un cliente malicioso no pueda sembrar artistas falsos en el catálogo público.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { enforceRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

// Deben coincidir con src/lib/polls.ts
const AGE_RANGES = ['menos-18', '18-24', '25-34', '35-44', '45+'];
const EDITIONS = ['primera', '2-3', '4+'];
const GENRES = ['rock', 'alternativo-indie', 'pop', 'urbano', 'electronica', 'latino-tropical', 'metal', 'otro'];
const HEARD_FROM = ['redes', 'amigos', 'prensa', 'conciertos-latam', 'otro'];
const SOURCES = ['web', 'stand', 'qr'];

const SPOTIFY_ID_RE = /^[0-9A-Za-z]{22}$/;

interface ChoiceInput {
  spotify_id?: string | null;
  name: string;
  position: number;
}

interface Payload {
  poll_slug: string;
  device_token: string;
  artists: ChoiceInput[];
  demographics?: Record<string, string | null | undefined>;
  source?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v.slice(0, max) : null;
}

function pick(value: unknown, allowed: string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? value : null;
}

let spotifyToken: string | null = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken(): Promise<string | null> {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + data.expires_in * 1000 - 60_000;
    return spotifyToken;
  } catch {
    return null;
  }
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  genres?: string[];
  external_urls?: { spotify?: string };
}

async function fetchSpotifyArtist(id: string): Promise<SpotifyArtist | null> {
  const token = await getSpotifyToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function uniqueSlug(supabase: any, base: string): Promise<string> {
  let slug = base || 'artista';
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from('artists').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Devuelve el artist_id para la elección. Orden: por spotify_id → verificación en Spotify y
 * upsert (reutilizando un artista existente con el mismo slug si aún no tiene spotify_id) →
 * fallback por slug del nombre → null (se guarda solo el nombre).
 */
async function resolveArtist(
  supabase: any,
  choice: ChoiceInput,
): Promise<{ artist_id: string | null; artist_name: string; spotify_id: string | null }> {
  const typedName = choice.name.trim();
  const spotifyId = typeof choice.spotify_id === 'string' && SPOTIFY_ID_RE.test(choice.spotify_id)
    ? choice.spotify_id
    : null;

  if (spotifyId) {
    const { data: bySpotify } = await supabase
      .from('artists')
      .select('id, name')
      .eq('spotify_id', spotifyId)
      .maybeSingle();
    if (bySpotify) return { artist_id: bySpotify.id, artist_name: bySpotify.name, spotify_id: spotifyId };

    const verified = await fetchSpotifyArtist(spotifyId);
    if (verified) {
      const baseSlug = slugify(verified.name);
      const { data: bySlug } = await supabase
        .from('artists')
        .select('id, name, spotify_id, photo_url')
        .eq('slug', baseSlug)
        .maybeSingle();

      if (bySlug && !bySlug.spotify_id) {
        await supabase
          .from('artists')
          .update({
            spotify_id: spotifyId,
            photo_url: bySlug.photo_url || verified.images?.[0]?.url || null,
          })
          .eq('id', bySlug.id);
        return { artist_id: bySlug.id, artist_name: bySlug.name, spotify_id: spotifyId };
      }

      const slug = bySlug ? await uniqueSlug(supabase, baseSlug) : baseSlug;
      const { data: created, error } = await supabase
        .from('artists')
        .insert({
          name: verified.name,
          slug,
          photo_url: verified.images?.[0]?.url || null,
          genres: verified.genres?.length ? verified.genres : null,
          spotify_id: spotifyId,
          social_links: {
            spotify_id: spotifyId,
            spotify_url: verified.external_urls?.spotify || `https://open.spotify.com/artist/${spotifyId}`,
            genres: verified.genres || [],
          },
        })
        .select('id, name')
        .single();

      if (!error && created) {
        return { artist_id: created.id, artist_name: created.name, spotify_id: spotifyId };
      }
      // Carrera con otra petición que ya lo creó: reintentar por spotify_id.
      const { data: retry } = await supabase
        .from('artists')
        .select('id, name')
        .eq('spotify_id', spotifyId)
        .maybeSingle();
      if (retry) return { artist_id: retry.id, artist_name: retry.name, spotify_id: spotifyId };
      console.error('poll-submit: no se pudo crear artista', error?.message);
    }
  }

  // Sin verificación en Spotify no guardamos el spotify_id: podría ser inventado por el cliente.
  const { data: byName } = await supabase
    .from('artists')
    .select('id, name')
    .eq('slug', slugify(typedName))
    .maybeSingle();
  if (byName) return { artist_id: byName.id, artist_name: byName.name, spotify_id: null };

  return { artist_id: null, artist_name: typedName, spotify_id: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const limited = await enforceRateLimit(req, {
    functionName: 'poll-submit',
    windowSeconds: 60,
    maxRequests: 10,
  });
  if (limited) return limited;

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const pollSlug = clean(payload?.poll_slug, 120);
  const deviceToken = clean(payload?.device_token, 120);
  const choices = Array.isArray(payload?.artists) ? payload.artists : [];

  if (!pollSlug || !deviceToken) return json({ error: 'Faltan datos de la encuesta' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();
  const { data: poll } = await supabase
    .from('polls')
    .select('id, slug, is_active, starts_at, ends_at, max_choices, ask_demographics, day_options')
    .eq('slug', pollSlug)
    .maybeSingle();

  const open = poll
    && poll.is_active
    && (!poll.starts_at || poll.starts_at <= nowIso)
    && (!poll.ends_at || poll.ends_at >= nowIso);
  if (!open) return json({ error: 'Esta encuesta no está disponible en este momento' }, 404);

  if (choices.length < 1 || choices.length > poll.max_choices) {
    return json({ error: `Elige entre 1 y ${poll.max_choices} artistas` }, 400);
  }
  const positions = new Set<number>();
  for (const c of choices) {
    const name = clean(c?.name, 120);
    const pos = Number(c?.position);
    if (!name || !Number.isInteger(pos) || pos < 1 || pos > poll.max_choices || positions.has(pos)) {
      return json({ error: 'La lista de artistas no es válida' }, 400);
    }
    positions.add(pos);
    c.name = name;
  }

  // Usuario logueado (opcional): solo si el header trae un JWT de usuario válido.
  let userId: string | null = null;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (token !== Deno.env.get('SUPABASE_ANON_KEY')) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }
  }

  const demo = poll.ask_demographics ? (payload.demographics ?? {}) : {};
  const dayOptions: string[] = Array.isArray(poll.day_options) ? poll.day_options : [];

  const { data: response, error: responseError } = await supabase
    .from('poll_responses')
    .insert({
      poll_id: poll.id,
      user_id: userId,
      device_token: deviceToken,
      age_range: pick(demo.age_range, AGE_RANGES),
      origin_city: clean(demo.origin_city, 80),
      editions_attended: pick(demo.editions_attended, EDITIONS),
      attended_day: pick(demo.attended_day, dayOptions),
      favorite_genre: pick(demo.favorite_genre, GENRES),
      heard_from: pick(demo.heard_from, HEARD_FROM),
      source: pick(payload.source, SOURCES) ?? 'web',
    })
    .select('id')
    .single();

  if (responseError) {
    if (responseError.code === '23505') {
      return json({ error: 'Ya registraste tu respuesta en esta encuesta. ¡Gracias!' }, 409);
    }
    console.error('poll-submit: error insertando respuesta', responseError.message);
    return json({ error: 'No pudimos guardar tu respuesta. Inténtalo de nuevo.' }, 500);
  }

  const rows = [];
  for (const choice of choices) {
    const resolved = await resolveArtist(supabase, choice);
    rows.push({
      response_id: response.id,
      poll_id: poll.id,
      artist_id: resolved.artist_id,
      artist_name: resolved.artist_name,
      spotify_id: resolved.spotify_id,
      position: Number(choice.position),
    });
  }

  const { error: artistsError } = await supabase.from('poll_response_artists').insert(rows);
  if (artistsError) {
    console.error('poll-submit: error insertando artistas', artistsError.message);
    await supabase.from('poll_responses').delete().eq('id', response.id);
    return json({ error: 'No pudimos guardar tu respuesta. Inténtalo de nuevo.' }, 500);
  }

  return json({
    ok: true,
    response_id: response.id,
    artists: rows.map((r) => ({ name: r.artist_name, position: r.position, created: !!r.artist_id })),
  });
});
