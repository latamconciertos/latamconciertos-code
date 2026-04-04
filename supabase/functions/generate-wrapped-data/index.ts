import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface WrappedData {
  year: number;
  generatedAt: string;
  totalConcerts: number;
  totalFestivals: number;
  estimatedHours: number;
  topArtistByConcerts: { name: string; photoUrl: string | null; concertCount: number; spotifyRank: number | null } | null;
  citiesVisited: Array<{ name: string; country: string; concertCount: number }>;
  venuesVisited: Array<{ name: string; city: string; concertCount: number }>;
  uniqueCitiesCount: number;
  uniqueVenuesCount: number;
  topGenre: string | null;
  genreBreakdown: Array<{ genre: string; count: number }>;
  missedArtists: Array<{ name: string; photoUrl: string | null; spotifyRank: number; concertTitle: string; concertDate: string; city: string }>;
  firstConcert: { title: string; date: string; artist: string } | null;
  lastConcert: { title: string; date: string; artist: string } | null;
  busiestMonth: { month: string; count: number } | null;
  totalArtistsSeen: number;
  spotifyConnected: boolean;
  spotifyTopArtists: Array<{ name: string; imageUrl: string | null; genres: string[] }>;
  spotifyTopTracks: Array<{ name: string; artist: string; albumImage: string | null }>;
  badgesEarned: Array<{ name: string; icon: string; description: string }>;
}

function getUserIdFromJwt(authHeader: string): string {
  const token = authHeader.replace('Bearer ', '');
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub;
}

function normalize(name: string): string {
  return name.toLowerCase().trim();
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

    const { year, forceRegenerate } = await req.json();

    if (!year || typeof year !== 'number') {
      throw new Error('year is required and must be a number');
    }

    console.log(`Generate Wrapped Data: year=${year}, forceRegenerate=${forceRegenerate}, user=${userId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Check for cached snapshot
    if (!forceRegenerate) {
      const { data: existingSnapshot } = await supabase
        .from('wrapped_snapshots')
        .select('snapshot_data')
        .eq('user_id', userId)
        .eq('year', year)
        .single();

      if (existingSnapshot?.snapshot_data) {
        console.log('Returning cached wrapped snapshot');
        return new Response(JSON.stringify({ data: existingSnapshot.snapshot_data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 2: Query user's attended concerts
    const { data: attendedConcerts, error: concertsError } = await supabase
      .rpc('get_attended_concerts_for_wrapped', { p_user_id: userId, p_year: year });

    let concerts: any[] = [];

    if (concertsError) {
      console.log('RPC not available, falling back to direct query');

      const { data: rawConcerts, error: rawError } = await supabase
        .from('favorite_concerts')
        .select(`
          *,
          concerts:concert_id (
            id, title, date, slug, image_url, event_type,
            artists:artist_id ( id, name, photo_url ),
            venues:venue_id (
              id, name,
              cities:city_id (
                id, name,
                countries:country_id ( id, name )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('attendance_type', 'attending');

      if (rawError) {
        console.error('Failed to fetch attended concerts:', rawError.message);
        throw new Error('Failed to fetch attended concerts');
      }

      concerts = (rawConcerts || [])
        .filter((fc: any) => {
          if (!fc.concerts?.date) return false;
          const concertDate = new Date(fc.concerts.date);
          const concertYear = concertDate.getFullYear();
          return concertYear === year && concertDate <= new Date();
        })
        .map((fc: any) => ({
          concert_id: fc.concert_id,
          title: fc.concerts.title,
          date: fc.concerts.date,
          slug: fc.concerts.slug,
          image_url: fc.concerts.image_url,
          event_type: fc.concerts.event_type,
          artist_name: fc.concerts.artists?.name || null,
          artist_photo: fc.concerts.artists?.photo_url || null,
          artist_id: fc.concerts.artists?.id || null,
          venue_name: fc.concerts.venues?.name || null,
          city_name: fc.concerts.venues?.cities?.name || null,
          country_name: fc.concerts.venues?.cities?.countries?.name || null,
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      concerts = attendedConcerts || [];
    }

    console.log(`Found ${concerts.length} attended concerts for year ${year}`);

    // Step 3: Check Spotify connection
    const { data: spotifyConnection } = await supabase
      .from('spotify_user_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    const spotifyConnected = !!spotifyConnection;
    console.log(`Spotify connected: ${spotifyConnected}`);

    // Step 4: Fetch Spotify data if connected
    let spotifyTopArtists: any[] = [];
    let spotifyTopTracks: any[] = [];

    if (spotifyConnected) {
      try {
        const spotifyFunctionUrl = `${SUPABASE_URL}/functions/v1/spotify-user-data`;

        const [artistsResponse, tracksResponse] = await Promise.all([
          fetch(spotifyFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getTopArtists', timeRange: 'long_term', limit: 50 }),
          }),
          fetch(spotifyFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getTopTracks', timeRange: 'long_term', limit: 20 }),
          }),
        ]);

        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          spotifyTopArtists = artistsData.data || [];
          console.log(`Fetched ${spotifyTopArtists.length} Spotify top artists`);
        } else {
          console.error('Failed to fetch Spotify top artists:', artistsResponse.status);
        }

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          spotifyTopTracks = tracksData.data || [];
          console.log(`Fetched ${spotifyTopTracks.length} Spotify top tracks`);
        } else {
          console.error('Failed to fetch Spotify top tracks:', tracksResponse.status);
        }
      } catch (spotifyError: any) {
        console.error('Error fetching Spotify data:', spotifyError.message);
      }
    }

    // Step 5: Compute stats

    // Handle edge case: 0 concerts
    if (concerts.length === 0) {
      const emptyWrapped: WrappedData = {
        year,
        generatedAt: new Date().toISOString(),
        totalConcerts: 0,
        totalFestivals: 0,
        estimatedHours: 0,
        topArtistByConcerts: null,
        citiesVisited: [],
        venuesVisited: [],
        uniqueCitiesCount: 0,
        uniqueVenuesCount: 0,
        topGenre: null,
        genreBreakdown: [],
        missedArtists: [],
        firstConcert: null,
        lastConcert: null,
        busiestMonth: null,
        totalArtistsSeen: 0,
        spotifyConnected,
        spotifyTopArtists: spotifyTopArtists.map((a: any) => ({
          name: a.name,
          imageUrl: a.imageUrl || null,
          genres: a.genres || [],
        })),
        spotifyTopTracks: spotifyTopTracks.map((t: any) => ({
          name: t.name,
          artist: t.artist || 'Unknown',
          albumImage: t.albumImage || null,
        })),
        badgesEarned: [],
      };

      // Upsert empty snapshot
      await supabase
        .from('wrapped_snapshots')
        .upsert({
          user_id: userId,
          year,
          snapshot_data: emptyWrapped,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,year' });

      return new Response(JSON.stringify({ data: emptyWrapped }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // totalConcerts & totalFestivals
    const totalConcerts = concerts.length;
    const totalFestivals = concerts.filter((c: any) => c.event_type === 'festival').length;
    const regularConcerts = totalConcerts - totalFestivals;
    const estimatedHours = regularConcerts * 2.5 + totalFestivals * 5.5;

    // topArtistByConcerts
    const artistCounts: Record<string, { name: string; photoUrl: string | null; count: number }> = {};
    for (const c of concerts) {
      if (!c.artist_name) continue;
      const key = normalize(c.artist_name);
      if (!artistCounts[key]) {
        artistCounts[key] = { name: c.artist_name, photoUrl: c.artist_photo || null, count: 0 };
      }
      artistCounts[key].count++;
    }

    let topArtistByConcerts: WrappedData['topArtistByConcerts'] = null;
    const artistEntries = Object.values(artistCounts);
    if (artistEntries.length > 0) {
      const top = artistEntries.sort((a, b) => b.count - a.count)[0];
      let spotifyRank: number | null = null;

      if (spotifyConnected && spotifyTopArtists.length > 0) {
        const rankIndex = spotifyTopArtists.findIndex(
          (sa: any) => normalize(sa.name) === normalize(top.name)
        );
        if (rankIndex !== -1) {
          spotifyRank = rankIndex + 1;
        }
      }

      topArtistByConcerts = {
        name: top.name,
        photoUrl: top.photoUrl,
        concertCount: top.count,
        spotifyRank,
      };
    }

    // citiesVisited
    const cityMap: Record<string, { name: string; country: string; count: number }> = {};
    for (const c of concerts) {
      if (!c.city_name) continue;
      const key = normalize(c.city_name);
      if (!cityMap[key]) {
        cityMap[key] = { name: c.city_name, country: c.country_name || '', count: 0 };
      }
      cityMap[key].count++;
    }
    const citiesVisited = Object.values(cityMap)
      .map((v) => ({ name: v.name, country: v.country, concertCount: v.count }))
      .sort((a, b) => b.concertCount - a.concertCount);

    // venuesVisited
    const venueMap: Record<string, { name: string; city: string; count: number }> = {};
    for (const c of concerts) {
      if (!c.venue_name) continue;
      const key = normalize(c.venue_name);
      if (!venueMap[key]) {
        venueMap[key] = { name: c.venue_name, city: c.city_name || '', count: 0 };
      }
      venueMap[key].count++;
    }
    const venuesVisited = Object.values(venueMap)
      .map((v) => ({ name: v.name, city: v.city, concertCount: v.count }))
      .sort((a, b) => b.concertCount - a.concertCount);

    // topGenre & genreBreakdown
    let topGenre: string | null = null;
    let genreBreakdown: Array<{ genre: string; count: number }> = [];

    if (spotifyConnected && spotifyTopArtists.length > 0) {
      const attendedArtistNames = new Set(
        concerts.map((c: any) => c.artist_name ? normalize(c.artist_name) : null).filter(Boolean)
      );

      const genreCounts: Record<string, number> = {};
      for (const sa of spotifyTopArtists) {
        const isAttended = attendedArtistNames.has(normalize(sa.name));
        if (sa.genres && sa.genres.length > 0) {
          for (const genre of sa.genres) {
            // Count all genres from Spotify top artists for genreBreakdown
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        }
      }

      genreBreakdown = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count);

      // topGenre: prefer genres from attended artists that also appear in Spotify
      const attendedGenreCounts: Record<string, number> = {};
      for (const sa of spotifyTopArtists) {
        if (attendedArtistNames.has(normalize(sa.name)) && sa.genres) {
          for (const genre of sa.genres) {
            attendedGenreCounts[genre] = (attendedGenreCounts[genre] || 0) + 1;
          }
        }
      }

      const attendedGenres = Object.entries(attendedGenreCounts)
        .sort((a, b) => b[1] - a[1]);

      topGenre = attendedGenres.length > 0 ? attendedGenres[0][0] : (genreBreakdown.length > 0 ? genreBreakdown[0].genre : null);
    }

    // missedArtists
    let missedArtists: WrappedData['missedArtists'] = [];

    if (spotifyConnected && spotifyTopArtists.length > 0) {
      const attendedArtistNames = new Set(
        concerts.map((c: any) => c.artist_name ? normalize(c.artist_name) : null).filter(Boolean)
      );

      // Query all concerts in the year from the system
      const { data: allYearConcerts } = await supabase
        .from('concerts')
        .select(`
          id, title, date,
          artists:artist_id ( name ),
          venues:venue_id (
            cities:city_id ( name )
          )
        `)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (allYearConcerts && allYearConcerts.length > 0) {
        for (let i = 0; i < spotifyTopArtists.length && missedArtists.length < 5; i++) {
          const sa = spotifyTopArtists[i];
          const normalizedSpotifyName = normalize(sa.name);

          // Skip if user attended this artist
          if (attendedArtistNames.has(normalizedSpotifyName)) continue;

          // Find concerts by this artist that the user missed
          const missedConcert = allYearConcerts.find((c: any) => {
            const concertArtistName = c.artists?.name;
            if (!concertArtistName) return false;
            return normalize(concertArtistName) === normalizedSpotifyName;
          });

          if (missedConcert) {
            missedArtists.push({
              name: sa.name,
              photoUrl: sa.imageUrl || null,
              spotifyRank: i + 1,
              concertTitle: missedConcert.title,
              concertDate: missedConcert.date,
              city: missedConcert.venues?.cities?.name || '',
            });
          }
        }
      }
    }

    // firstConcert & lastConcert
    const firstConcertData = concerts[0];
    const lastConcertData = concerts[concerts.length - 1];

    const firstConcert = firstConcertData
      ? { title: firstConcertData.title, date: firstConcertData.date, artist: firstConcertData.artist_name || '' }
      : null;

    const lastConcert = lastConcertData
      ? { title: lastConcertData.title, date: lastConcertData.date, artist: lastConcertData.artist_name || '' }
      : null;

    // busiestMonth
    const monthCounts: Record<number, number> = {};
    for (const c of concerts) {
      const month = new Date(c.date).getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }

    let busiestMonth: WrappedData['busiestMonth'] = null;
    const monthEntries = Object.entries(monthCounts);
    if (monthEntries.length > 0) {
      const [monthIdx, count] = monthEntries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
      busiestMonth = { month: MONTH_NAMES_ES[Number(monthIdx)], count: Number(count) };
    }

    // totalArtistsSeen
    const uniqueArtists = new Set(
      concerts.map((c: any) => c.artist_name ? normalize(c.artist_name) : null).filter(Boolean)
    );
    const totalArtistsSeen = uniqueArtists.size;

    // Step 6: Build WrappedData
    const wrappedData: WrappedData = {
      year,
      generatedAt: new Date().toISOString(),
      totalConcerts,
      totalFestivals,
      estimatedHours,
      topArtistByConcerts,
      citiesVisited,
      venuesVisited,
      uniqueCitiesCount: citiesVisited.length,
      uniqueVenuesCount: venuesVisited.length,
      topGenre,
      genreBreakdown,
      missedArtists,
      firstConcert,
      lastConcert,
      busiestMonth,
      totalArtistsSeen,
      spotifyConnected,
      spotifyTopArtists: spotifyTopArtists.map((a: any) => ({
        name: a.name,
        imageUrl: a.imageUrl || null,
        genres: a.genres || [],
      })),
      spotifyTopTracks: spotifyTopTracks.map((t: any) => ({
        name: t.name,
        artist: t.artist || 'Unknown',
        albumImage: t.albumImage || null,
      })),
      badgesEarned: [],
    };

    // Step 7: Evaluate badges
    const { data: badgeDefinitions } = await supabase
      .from('badges')
      .select('id, name, icon, description, criteria_type, criteria_value');

    const earnedBadges: Array<{ name: string; icon: string; description: string }> = [];
    const badgeIdsToInsert: string[] = [];

    if (badgeDefinitions && badgeDefinitions.length > 0) {
      for (const badge of badgeDefinitions) {
        let earned = false;
        const criteriaCount = Number(badge.criteria_value) || 0;

        switch (badge.criteria_type) {
          case 'wrapped_concerts_count':
            earned = totalConcerts >= criteriaCount;
            break;

          case 'wrapped_festivals_count':
            earned = totalFestivals >= criteriaCount;
            break;

          case 'wrapped_cities_count':
            earned = citiesVisited.length >= criteriaCount;
            break;

          case 'wrapped_repeat_artist':
            earned = artistEntries.some((a) => a.count >= criteriaCount);
            break;

          default:
            break;
        }

        if (earned) {
          earnedBadges.push({
            name: badge.name,
            icon: badge.icon,
            description: badge.description,
          });
          badgeIdsToInsert.push(badge.id);
        }
      }

      // Insert earned badges
      if (badgeIdsToInsert.length > 0) {
        const badgeRows = badgeIdsToInsert.map((badgeId) => ({
          user_id: userId,
          badge_id: badgeId,
        }));

        const { error: badgeInsertError } = await supabase
          .from('user_badges')
          .upsert(badgeRows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });

        if (badgeInsertError) {
          console.error('Failed to insert user badges:', badgeInsertError.message);
        } else {
          console.log(`Inserted ${badgeIdsToInsert.length} badges for user`);
        }
      }
    }

    wrappedData.badgesEarned = earnedBadges;

    // Step 8: Upsert snapshot
    const { error: upsertError } = await supabase
      .from('wrapped_snapshots')
      .upsert({
        user_id: userId,
        year,
        snapshot_data: wrappedData,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,year' });

    if (upsertError) {
      console.error('Failed to upsert wrapped snapshot:', upsertError.message);
    } else {
      console.log('Wrapped snapshot saved successfully');
    }

    // Step 9: Return
    return new Response(JSON.stringify({ data: wrappedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Generate Wrapped Data error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
