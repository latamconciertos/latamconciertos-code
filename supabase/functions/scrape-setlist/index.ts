import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetlistFmSong {
    name: string;
    tape?: boolean;
    cover?: { name: string };
    with?: { name: string; mbid: string };
    info?: string;
}

interface SetlistFmSet {
    name?: string;
    encore?: number;
    song: SetlistFmSong[];
}

interface SetlistFmResponse {
    id: string;
    eventDate: string; // "DD-MM-YYYY"
    artist: { name: string; mbid: string };
    venue: { name: string; city: { name: string; country: { name: string; code: string } } };
    sets: { set: SetlistFmSet[] };
    url: string;
}

interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    external_urls: { spotify: string };
    duration_ms: number;
    popularity: number;
}

type SpotifyConfidence = 'exact' | 'partial' | 'not_found';

export interface EnrichedSong {
    position: number;
    setlistfm_name: string;
    notes: string | null;
    is_tape: boolean;
    // Spotify data
    song_name: string;
    artist_name: string | null;
    spotify_track_id: string | null;
    spotify_url: string | null;
    duration_seconds: number | null;
    spotify_confidence: SpotifyConfidence;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts the setlist ID from a setlist.fm URL.
 * URL pattern: https://www.setlist.fm/setlist/{artist}/{year}/{venue}-{id}.html
 * The ID is the last hex segment before ".html"
 */
function extractSetlistId(input: string): string | null {
    input = input.trim();

    // If it's already a raw ID (no dots or slashes)
    if (/^[a-f0-9]{7,8}$/i.test(input)) {
        return input;
    }

    // Extract from URL: last segment before .html
    const match = input.match(/([a-f0-9]{7,8})\.html$/i);
    return match ? match[1] : null;
}

/**
 * Normalizes a song name for fuzzy matching:
 * lowercase, remove accents, strip special chars, collapse whitespace.
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Compares a Spotify track name against the raw setlist name.
 * Returns confidence level.
 */
function getMatchConfidence(
    setlistName: string,
    spotifyName: string,
): SpotifyConfidence {
    const normSetlist = normalizeName(setlistName);
    const normSpotify = normalizeName(spotifyName);

    if (normSetlist === normSpotify) return 'exact';

    // Check if one contains the other (handles "La Mudanza (Version)" etc.)
    if (normSetlist.includes(normSpotify) || normSpotify.includes(normSetlist)) {
        return 'partial';
    }

    // Word overlap: if 80%+ of words match → partial
    const wordsA = normSetlist.split(' ').filter(Boolean);
    const wordsB = new Set(normSpotify.split(' ').filter(Boolean));
    const overlap = wordsA.filter(w => wordsB.has(w)).length;
    if (wordsA.length > 0 && overlap / wordsA.length >= 0.8) {
        return 'partial';
    }

    return 'not_found';
}

/**
 * Picks the best Spotify track from a list of candidates.
 * Prefers exact name match, then highest popularity.
 */
function pickBestTrack(
    candidates: SpotifyTrack[],
    songName: string,
): { track: SpotifyTrack; confidence: SpotifyConfidence } | null {
    if (!candidates.length) return null;

    const normSong = normalizeName(songName);

    // Look for exact match first
    const exactMatch = candidates.find(
        t => normalizeName(t.name) === normSong,
    );
    if (exactMatch) return { track: exactMatch, confidence: 'exact' };

    // Check partial matches
    const partialMatches = candidates.filter(t => {
        const conf = getMatchConfidence(songName, t.name);
        return conf === 'partial';
    });

    if (partialMatches.length) {
        // Best partial = highest popularity
        const best = partialMatches.sort((a, b) => b.popularity - a.popularity)[0];
        return { track: best, confidence: 'partial' };
    }

    // No good match — return first result as "not_found" so admin can review
    return { track: candidates[0], confidence: 'not_found' };
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

let spotifyToken: string | null = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken(): Promise<string> {
    if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken!;

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + data.expires_in * 1000 - 60_000;
    return spotifyToken!;
}

/**
 * Searches a single song on Spotify and returns the best matching track.
 * Tries two queries: (1) song + artist, (2) song only (fallback).
 */
async function searchSpotifyTrack(
    songName: string,
    artistName: string,
): Promise<{ track: SpotifyTrack; confidence: SpotifyConfidence } | null> {
    const token = await getSpotifyToken();

    const search = async (q: string) => {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.tracks?.items ?? []) as SpotifyTrack[];
    };

    // Query 1: song name + artist filter
    const query1 = `${songName} artist:${artistName}`;
    const results1 = await search(query1);
    const pick1 = pickBestTrack(results1, songName);
    if (pick1 && pick1.confidence !== 'not_found') return pick1;

    // Query 2: song name only (handles covers, collaborations, etc.)
    const results2 = await search(songName);
    const pick2 = pickBestTrack(results2, songName);
    if (pick2) return pick2;

    return null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { url, artist_name } = await req.json();

        if (!url) {
            return new Response(
                JSON.stringify({ success: false, error: 'URL is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const setlistFmApiKey = Deno.env.get('SETLIST_FM_API_KEY');
        if (!setlistFmApiKey) {
            return new Response(
                JSON.stringify({ success: false, error: 'SETLIST_FM_API_KEY not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        // ── Step 1: Extract setlist ID ──────────────────────────────────────────
        const setlistId = extractSetlistId(url);
        if (!setlistId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Could not extract setlist ID from URL. Use a valid setlist.fm URL or the setlist ID directly.',
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        console.log('Fetching setlist ID:', setlistId);

        // ── Step 2: Fetch from setlist.fm API ───────────────────────────────────
        const setlistRes = await fetch(
            `https://api.setlist.fm/rest/1.0/setlist/${setlistId}`,
            {
                headers: {
                    'x-api-key': setlistFmApiKey,
                    'Accept': 'application/json',
                    'Accept-Language': 'es',
                },
            },
        );

        if (!setlistRes.ok) {
            const body = await setlistRes.text();
            console.error('setlist.fm error:', setlistRes.status, body);
            if (setlistRes.status === 404) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Setlist not found on setlist.fm. Check the URL.' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                );
            }
            return new Response(
                JSON.stringify({ success: false, error: `setlist.fm error: ${setlistRes.status}` }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const setlistData: SetlistFmResponse = await setlistRes.json();
        console.log('Setlist fetched:', setlistData.artist.name, setlistData.eventDate);

        // ── Step 3: Flatten all songs (excluding tape intros) ───────────────────
        const rawSongs: Array<{
            name: string;
            notes: string | null;
            is_tape: boolean;
        }> = [];

        for (const set of setlistData.sets.set) {
            for (const song of set.song) {
                const notes: string[] = [];
                if (song.info) notes.push(song.info);
                if (song.with) notes.push(`Con ${song.with.name}`);
                if (song.cover) notes.push(`(Cover de ${song.cover.name})`);
                if (set.encore) notes.push(`Encore ${set.encore}`);
                if (set.name) notes.push(`[${set.name}]`);

                rawSongs.push({
                    name: song.name,
                    notes: notes.length ? notes.join(' · ') : null,
                    is_tape: song.tape ?? false,
                });
            }
        }

        console.log(`Found ${rawSongs.length} songs. Starting Spotify enrichment...`);

        // ── Step 4: Enrich with Spotify in parallel ──────────────────────────────
        const artistForSearch = artist_name || setlistData.artist.name;

        const enrichedSongs: EnrichedSong[] = await Promise.all(
            rawSongs.map(async (raw, index) => {
                const position = index + 1;
                try {
                    const result = await searchSpotifyTrack(raw.name, artistForSearch);

                    if (!result) {
                        return {
                            position,
                            setlistfm_name: raw.name,
                            notes: raw.notes,
                            is_tape: raw.is_tape,
                            song_name: raw.name, // fallback to setlist.fm name
                            artist_name: artistForSearch,
                            spotify_track_id: null,
                            spotify_url: null,
                            duration_seconds: null,
                            spotify_confidence: 'not_found' as SpotifyConfidence,
                        };
                    }

                    return {
                        position,
                        setlistfm_name: raw.name,
                        notes: raw.notes,
                        is_tape: raw.is_tape,
                        song_name: result.track.name,           // Official Spotify name
                        artist_name: result.track.artists[0]?.name ?? artistForSearch,
                        spotify_track_id: result.track.id,
                        spotify_url: result.track.external_urls.spotify,
                        duration_seconds: Math.round(result.track.duration_ms / 1000),
                        spotify_confidence: result.confidence,
                    };
                } catch (err) {
                    console.error(`Spotify search failed for "${raw.name}":`, err);
                    return {
                        position,
                        setlistfm_name: raw.name,
                        notes: raw.notes,
                        is_tape: raw.is_tape,
                        song_name: raw.name,
                        artist_name: artistForSearch,
                        spotify_track_id: null,
                        spotify_url: null,
                        duration_seconds: null,
                        spotify_confidence: 'not_found' as SpotifyConfidence,
                    };
                }
            }),
        );

        // ── Summary stats ────────────────────────────────────────────────────────
        const exact = enrichedSongs.filter(s => s.spotify_confidence === 'exact').length;
        const partial = enrichedSongs.filter(s => s.spotify_confidence === 'partial').length;
        const notFound = enrichedSongs.filter(s => s.spotify_confidence === 'not_found').length;

        console.log(`Enrichment complete. Exact: ${exact}, Partial: ${partial}, Not found: ${notFound}`);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    setlist_id: setlistData.id,
                    event_date: setlistData.eventDate,
                    artist_name: setlistData.artist.name,
                    venue_name: setlistData.venue.name,
                    city: setlistData.venue.city.name,
                    country: setlistData.venue.city.country.name,
                    source_url: setlistData.url,
                    songs: enrichedSongs,
                    stats: { total: enrichedSongs.length, exact, partial, not_found: notFound },
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('scrape-setlist error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unexpected error',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
});
