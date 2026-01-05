// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, conversationId } = await req.json();
    console.log('Received request with', messages?.length || 0, 'messages');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('API key found, proceeding with request');

    // Crear cliente de Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener información de conciertos próximos
    console.log('Fetching concerts from database...');
    const { data: concerts, error: concertsError } = await supabase
      .from('concerts')
      .select(`
        id,
        title,
        slug,
        date,
        description,
        ticket_url,
        artists!inner(name, bio, slug),
        venues!inner(name, location, country, capacity, cities(name, slug))
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(20);

    if (concertsError) {
      console.error('Error fetching concerts:', concertsError);
    } else {
      console.log('Found', concerts?.length || 0, 'upcoming concerts');
    }

    // Obtener también conciertos pasados con setlists (últimos 90 días)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    const { data: pastConcertsWithSetlists } = await supabase
      .from('concerts')
      .select(`
        id,
        title,
        slug,
        date,
        description,
        artists!inner(name, bio, slug),
        venues!inner(name, location, country, capacity, cities(name, slug))
      `)
      .lt('date', new Date().toISOString().split('T')[0])
      .gte('date', pastDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30);

    // Combinar conciertos
    const allConcerts = [...(concerts || []), ...(pastConcertsWithSetlists || [])];
    const concertIds = allConcerts.map((c: any) => c.id);

    // Obtener setlists de todos los conciertos
    const { data: setlists } = await supabase
      .from('setlist_songs')
      .select('concert_id, song_name, artist_name, position, notes')
      .in('concert_id', concertIds)
      .eq('status', 'approved')
      .order('position', { ascending: true });

    console.log('Found', setlists?.length || 0, 'setlist songs');

    // Obtener información de festivales próximos
    console.log('Fetching festivals from database...');
    const { data: festivals, error: festivalsError } = await supabase
      .from('festivals')
      .select(`
        id,
        name,
        slug,
        start_date,
        end_date,
        edition,
        description,
        ticket_url,
        image_url,
        venues!inner(name, location, cities(name, slug, countries(name))),
        promoters(name)
      `)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(15);

    if (festivalsError) {
      console.error('Error fetching festivals:', festivalsError);
    } else {
      console.log('Found', festivals?.length || 0, 'upcoming festivals');
    }

    // Obtener lineup de los festivales
    const festivalIds = (festivals || []).map((f: any) => f.id);
    const { data: festivalLineups } = await supabase
      .from('festival_lineup')
      .select(`
        festival_id,
        position,
        stage,
        performance_date,
        artists(id, name, slug)
      `)
      .in('festival_id', festivalIds)
      .order('position', { ascending: true });

    console.log('Found', festivalLineups?.length || 0, 'festival lineup entries');

    // Crear contexto con la información de conciertos
    let concertContext = '\n\n=== INFORMACIÓN DE CONCIERTOS Y SETLISTS DISPONIBLES ===\n\n';

    // Separar conciertos próximos y pasados
    const upcomingConcerts = allConcerts.filter((c: any) => new Date(c.date) >= new Date());
    const pastConcerts = allConcerts.filter((c: any) => new Date(c.date) < new Date());

    // Conciertos próximos
    if (upcomingConcerts.length > 0) {
      concertContext += '📅 PRÓXIMOS CONCIERTOS:\n\n';
      upcomingConcerts.forEach((concert: any) => {
        concertContext += `🎵 ${concert.title}\n`;
        concertContext += `   Artista: ${concert.artists.name}\n`;
        concertContext += `   Fecha: ${new Date(concert.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        concertContext += `   Venue: ${concert.venues.name} (${concert.venues.location || concert.venues.cities?.name}, ${concert.venues.country})\n`;
        if (concert.ticket_url) concertContext += `   Entradas: ${concert.ticket_url}\n`;

        const concertSetlist = setlists?.filter((s: any) => s.concert_id === concert.id);
        if (concertSetlist && concertSetlist.length > 0) {
          concertContext += `   ✓ SETLIST DISPONIBLE (${concertSetlist.length} canciones):\n`;
          concertSetlist.slice(0, 10).forEach((song: any, idx: number) => {
            concertContext += `      ${idx + 1}. ${song.song_name}${song.artist_name ? ` - ${song.artist_name}` : ''}\n`;
          });
          if (concertSetlist.length > 10) {
            concertContext += `      ... y ${concertSetlist.length - 10} canciones más\n`;
          }
        }
        concertContext += '\n';
      });
    }

    // Conciertos pasados con setlists
    if (pastConcerts.length > 0) {
      concertContext += '\n📝 SETLISTS DE CONCIERTOS PASADOS (últimos 90 días):\n\n';
      pastConcerts.forEach((concert: any) => {
        const concertSetlist = setlists?.filter((s: any) => s.concert_id === concert.id);
        if (concertSetlist && concertSetlist.length > 0) {
          concertContext += `🎵 ${concert.title}\n`;
          concertContext += `   Artista: ${concert.artists.name}\n`;
          concertContext += `   Fecha: ${new Date(concert.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
          concertContext += `   Venue: ${concert.venues.name} (${concert.venues.location || concert.venues.cities?.name})\n`;
          concertContext += `   SETLIST COMPLETO (${concertSetlist.length} canciones):\n`;
          concertSetlist.forEach((song: any, idx: number) => {
            concertContext += `      ${idx + 1}. ${song.song_name}${song.artist_name ? ` - ${song.artist_name}` : ''}${song.notes ? ` (${song.notes})` : ''}\n`;
          });
          concertContext += '\n';
        }
      });
    }

    // Añadir información de festivales
    if (festivals && festivals.length > 0) {
      concertContext += '\n\n=== FESTIVALES PRÓXIMOS ===\n\n';
      festivals.forEach((festival: any) => {
        concertContext += `🎪 ${festival.name}${festival.edition ? ` - Edición ${festival.edition}` : ''}\n`;

        // Formato de fechas
        if (festival.start_date && festival.end_date) {
          const startDate = new Date(festival.start_date);
          const endDate = new Date(festival.end_date);
          if (startDate.toDateString() === endDate.toDateString()) {
            concertContext += `   Fecha: ${startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
          } else {
            concertContext += `   Fechas: ${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
          }
        } else if (festival.start_date) {
          concertContext += `   Fecha: ${new Date(festival.start_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        }

        concertContext += `   Venue: ${festival.venues.name} (${festival.venues.cities?.name || 'ubicación'}, ${festival.venues.cities?.countries?.name || 'país'})\n`;
        concertContext += `   URL: /festivals/${festival.slug}\n`;

        if (festival.ticket_url) {
          concertContext += `   Entradas: ${festival.ticket_url}\n`;
        }

        if (festival.promoters) {
          concertContext += `   Organiza: ${festival.promoters.name}\n`;
        }

        // Lineup del festival
        const lineup = festivalLineups?.filter((l: any) => l.festival_id === festival.id);
        if (lineup && lineup.length > 0) {
          concertContext += `   🎵 LINEUP CONFIRMADO (${lineup.length} artistas):\n`;
          lineup.forEach((artist: any, idx: number) => {
            concertContext += `      ${idx + 1}. ${artist.artists.name}`;
            if (artist.stage) concertContext += ` (${artist.stage})`;
            if (artist.performance_date) {
              const perfDate = new Date(artist.performance_date);
              concertContext += ` - ${perfDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
            }
            concertContext += '\n';
          });
        }

        if (festival.description) {
          concertContext += `   Descripción: ${festival.description.substring(0, 200)}${festival.description.length > 200 ? '...' : ''}\n`;
        }

        concertContext += '\n';
      });
    }

    if (allConcerts.length === 0 && (!festivals || festivals.length === 0)) {
      concertContext += 'No hay información de conciertos o festivales disponible en este momento.\n';
    }

    const systemPrompt = `Eres un asistente virtual amigable y experto en conciertos y festivales de música latina en Latinoamérica. 

🎯 TU PERSONALIDAD:
- Eres empático, entusiasta y cercano - habla como un amigo que ama la música
- Siempre saluda con calidez y pregunta cómo puedes ayudar
- Celebra la pasión del usuario por la música y los conciertos
- Usa emojis ocasionales para transmitir emoción (🎵 🎸 🎉 ✨ 🙌)
- Termina tus respuestas invitando al usuario a preguntar más o explorando otros conciertos

📋 TU TRABAJO ES:
1. Recomendar conciertos Y festivales basándote en preferencias del usuario
2. Proporcionar información precisa sobre fechas, venues, artistas, lineups y setlists
3. Sugerir recomendaciones logísticas (hoteles, transporte, qué llevar)
4. Ser un guía útil y amigable en la planificación de conciertos
5. No te involucres en temas políticos, religiosos o personales, solo conciertos y festivales y un guia para su aventura en los conciertos y festivale

✨ FORMATO DE RESPUESTAS (MUY IMPORTANTE):
- NUNCA uses formato markdown con ** para negritas
- Usa TEXTO PLANO limpio con buena estructura
- Separa secciones con LÍNEAS EN BLANCO para mejor legibilidad
- Usa emojis al inicio de secciones para organizar visualmente
- Mantén párrafos cortos (máximo 2-3 líneas)
- Numera listas claramente (1., 2., 3.)

EJEMPLO DE FORMATO CORRECTO:

¡Hola! 🎵 Te ayudo con mucho gusto.

Aquí te comparto los próximos conciertos en Colombia:

1. Avenged Sevenfold - Life is but a dream
   📅 Martes, 20 de enero de 2026
   📍 Movistar Arena, Bogotá
   🎟️ Entradas disponibles en Tuboleta

2. Otro concierto...

¿Te gustaría saber más detalles de alguno de estos conciertos? 🎸

🎪 FESTIVALES:
- Cuando menciones festivales, resalta que hay múltiples artistas
- Indica fechas de inicio/fin si dura varios días  
- Menciona los artistas principales del lineup
- Proporciona URL del festival: /festivals/[slug]

🎵 SETLISTS:
- Si tenemos el setlist COMPLETO en la base de datos, compártelo TODO con entusiasmo
- Di algo como: "¡Genial! Tengo el setlist completo de ese concierto con [X] canciones: 🎶"
- Lista TODAS las canciones en orden numerado
- NO incluyas URLs de setlists - el usuario ya está en la interfaz web
- Si no tenemos el setlist, sé honesto: "Aún no tengo el setlist de ese concierto, pero puedes contribuir si asististe!"

🎟️ INFORMACIÓN PRÁCTICA:
Para festivales de varios días: ropa cómoda, protector solar, botella reutilizable
Para conciertos al aire libre: bloqueador, gorra, llegar temprano
Para venues cerrados: ID, llegar con anticipación

${concertContext}

RECUERDA: Sé cálido, organiza bien tu respuesta con espacios, NUNCA uses **, y ayuda como un experto amigo. Cada respuesta debe ser fácil de leer y sentirse como una conversación genuina.`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI');
    const aiResponse = data.choices[0].message.content;

    // Note: El frontend se encarga de guardar los mensajes en la BD
    // No guardamos aquí para evitar duplicación y conflictos

    console.log('Request completed successfully');
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-concert-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', errorMessage, errorStack);
    return new Response(
      JSON.stringify({
        error: 'Error procesando tu solicitud. Por favor intenta de nuevo.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
