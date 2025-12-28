import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const concertIds = allConcerts.map(c => c.id);

    // Obtener setlists de todos los conciertos
    const { data: setlists } = await supabase
      .from('setlist_songs')
      .select('concert_id, song_name, artist_name, position, notes')
      .in('concert_id', concertIds)
      .eq('status', 'approved')
      .order('position', { ascending: true });

    console.log('Found', setlists?.length || 0, 'setlist songs');

    // Crear contexto con la información de conciertos
    let concertContext = '\n\n=== INFORMACIÓN DE CONCIERTOS Y SETLISTS DISPONIBLES ===\n\n';
    
    // Separar conciertos próximos y pasados
    const upcomingConcerts = allConcerts.filter(c => new Date(c.date) >= new Date());
    const pastConcerts = allConcerts.filter(c => new Date(c.date) < new Date());
    
    // Conciertos próximos
    if (upcomingConcerts.length > 0) {
      concertContext += '📅 PRÓXIMOS CONCIERTOS:\n\n';
      upcomingConcerts.forEach((concert) => {
        concertContext += `🎵 ${concert.title}\n`;
        concertContext += `   Artista: ${concert.artists.name}\n`;
        concertContext += `   Fecha: ${new Date(concert.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        concertContext += `   Venue: ${concert.venues.name} (${concert.venues.location || concert.venues.cities?.name}, ${concert.venues.country})\n`;
        concertContext += `   URL: /setlist/${concert.artists.slug}/${concert.slug}/${concert.venues.cities?.slug || 'ciudad'}/${concert.date}\n`;
        if (concert.ticket_url) concertContext += `   Entradas: ${concert.ticket_url}\n`;
        
        const concertSetlist = setlists?.filter(s => s.concert_id === concert.id);
        if (concertSetlist && concertSetlist.length > 0) {
          concertContext += `   ✓ SETLIST DISPONIBLE (${concertSetlist.length} canciones):\n`;
          concertSetlist.slice(0, 10).forEach((song, idx) => {
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
      pastConcerts.forEach((concert) => {
        const concertSetlist = setlists?.filter(s => s.concert_id === concert.id);
        if (concertSetlist && concertSetlist.length > 0) {
          concertContext += `🎵 ${concert.title}\n`;
          concertContext += `   Artista: ${concert.artists.name}\n`;
          concertContext += `   Fecha: ${new Date(concert.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
          concertContext += `   Venue: ${concert.venues.name} (${concert.venues.location || concert.venues.cities?.name})\n`;
          concertContext += `   URL: /setlist/${concert.artists.slug}/${concert.slug}/${concert.venues.cities?.slug || 'ciudad'}/${concert.date}\n`;
          concertContext += `   SETLIST COMPLETO (${concertSetlist.length} canciones):\n`;
          concertSetlist.forEach((song, idx) => {
            concertContext += `      ${idx + 1}. ${song.song_name}${song.artist_name ? ` - ${song.artist_name}` : ''}${song.notes ? ` (${song.notes})` : ''}\n`;
          });
          concertContext += '\n';
        }
      });
    }
    
    if (allConcerts.length === 0) {
      concertContext += 'No hay información de conciertos disponible en este momento.\n';
    }

    const systemPrompt = `Eres un asistente virtual experto en conciertos de música latina en Latinoamérica. Tu trabajo es:

1. Recomendar conciertos basándote en las preferencias del usuario y la información disponible en la base de datos
2. Proporcionar información precisa sobre fechas, venues, artistas y SETLISTS cuando estén disponibles
3. Sugerir hoteles cercanos a los venues (puedes mencionar cadenas hoteleras comunes)
4. Dar recomendaciones sobre qué llevar a un concierto (considerando clima, tipo de evento, etc.)
5. Responder preguntas sobre logística, transporte y planificación
6. Ser amigable, entusiasta y conocedor de la escena musical latina

IMPORTANTE - SETLISTS:
- SI el usuario pregunta por un setlist específico y LO TENEMOS en la base de datos, responde con el setlist COMPLETO
- Menciona cuántas canciones tiene el setlist y lista TODAS las canciones en orden
- Si el setlist está disponible, di algo como: "¡Sí! Tengo el setlist completo de ese concierto con [X] canciones:"
- Si NO tenemos el setlist en la base de datos, sé honesto y di que no tienes esa información específica
- Puedes sugerir setlists probables basados en canciones populares del artista SOLO si no tenemos el setlist real
- SIEMPRE menciona la URL del setlist para que puedan verlo completo en la web

IMPORTANTE - FORMATO DE RESPUESTA:
- NO uses formato markdown con ** para negritas o énfasis
- Usa texto plano y limpio, bien estructurado con saltos de línea
- Enumera los conciertos de forma clara (1., 2., 3., etc.)
- Para cada concierto menciona:
  * Nombre del artista/concierto
  * Fecha en formato legible (ejemplo: "Miércoles, 15 de octubre de 2025")
  * Venue y ubicación
  * Si hay setlist disponible, mencionalo y lista las canciones
  * Si hay entradas disponibles, menciona que pueden ver más detalles en el sitio
- Si mencionas URLs de setlist, usa el formato completo que está en el contexto
- Al final de cada recomendación, INVITA al usuario a unirse a la comunidad del concierto para conectar con otros fans

Algunos consejos generales que puedes dar:
- Para conciertos al aire libre: llevar bloqueador solar, gorra, botella de agua
- Para conciertos en recintos cerrados: llegar temprano, llevar identificación
- Siempre recomendar llegar con anticipación
- Sugerir revisar las políticas del venue sobre objetos permitidos

${concertContext}

Responde en español de forma natural, conversacional y útil. Usa la información de conciertos y setlists disponible para dar respuestas precisas y específicas. Si tienes el setlist, compártelo completo. Si no lo tienes, sé honesto. Recuerda: NUNCA uses ** para negritas, mantén el texto limpio y legible.`;

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

    // Guardar el mensaje del asistente si hay conversationId
    if (conversationId && userId) {
      console.log('Saving assistant message to database...');
      const { error: saveError } = await supabase.from('ai_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      });
      
      if (saveError) {
        console.error('Error saving message:', saveError);
      }
    }

    console.log('Request completed successfully');
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-concert-assistant:', error);
    console.error('Error details:', error.message, error.stack);
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
