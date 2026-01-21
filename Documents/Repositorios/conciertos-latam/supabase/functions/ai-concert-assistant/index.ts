// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// SEARCH FUNCTIONS
// ========================================

async function searchConcerts(supabase: any, params: any) {
  console.log('[searchConcerts] Searching with params:', JSON.stringify(params));

  let query = supabase
    .from('concerts')
    .select(`
      id,
      title,
      slug,
      date,
      description,
      ticket_url,
      artists(name, bio, slug),
      venues(name, location, capacity, cities(name, slug, countries(name)))
    `);

  // Apply filters
  if (params.artist) {
    query = query.ilike('artists.name', `%${params.artist}%`);
  }

  if (params.city) {
    query = query.ilike('venues.cities.name', `%${params.city}%`);
  }

  if (params.country) {
    query = query.ilike('venues.cities.countries.name', `%${params.country}%`);
  }

  if (params.startDate) {
    query = query.gte('date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('date', params.endDate);
  }

  // Default: only future concerts if no date filter provided
  if (!params.startDate && !params.endDate) {
    query = query.gte('date', new Date().toISOString().split('T')[0]);
  }

  const { data, error } = await query
    .order('date', { ascending: true })
    .limit(50);

  if (error) {
    console.error('[searchConcerts] Error:', error);
    return { concerts: [], error: error.message };
  }

  console.log('[searchConcerts] Found', data?.length || 0, 'concerts');
  return { concerts: data || [], error: null };
}

async function searchFestivals(supabase: any, params: any) {
  console.log('[searchFestivals] Searching with params:', JSON.stringify(params));

  let query = supabase
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
      venues(name, location, cities(name, slug, countries(name))),
      promoters(name)
    `);

  if (params.name) {
    query = query.ilike('name', `%${params.name}%`);
  }

  if (params.city) {
    query = query.ilike('venues.cities.name', `%${params.city}%`);
  }

  if (params.year) {
    const yearStart = `${params.year}-01-01`;
    const yearEnd = `${params.year}-12-31`;
    query = query.gte('start_date', yearStart).lte('start_date', yearEnd);
  }

  // Default: only future festivals
  if (!params.year) {
    query = query.gte('start_date', new Date().toISOString().split('T')[0]);
  }

  const { data: festivals, error: festivalsError } = await query
    .order('start_date', { ascending: true })
    .limit(20);

  if (festivalsError) {
    console.error('[searchFestivals] Error:', festivalsError);
    return { festivals: [], lineups: [], error: festivalsError.message };
  }

  // Get lineups for found festivals
  const festivalIds = (festivals || []).map((f: any) => f.id);
  let lineups = [];

  if (festivalIds.length > 0) {
    const { data: lineupData } = await supabase
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

    lineups = lineupData || [];
  }

  console.log('[searchFestivals] Found', festivals?.length || 0, 'festivals');
  return { festivals: festivals || [], lineups, error: null };
}

// ========================================
// FUNCTION DEFINITIONS FOR OPENAI
// ========================================

const functions = [
  {
    name: "searchConcerts",
    description: "Busca conciertos en la base de datos por artista, ciudad, país o rango de fechas. Usa esta función cuando el usuario pregunte por conciertos específicos.",
    parameters: {
      type: "object",
      properties: {
        artist: {
          type: "string",
          description: "Nombre del artista o banda (ej: 'Bad Bunny', 'Fito Paez', 'Coldplay')"
        },
        city: {
          type: "string",
          description: "Ciudad donde buscar conciertos (ej: 'Bogotá', 'Medellín', 'Lima')"
        },
        country: {
          type: "string",
          description: "País donde buscar conciert os (ej: 'Colombia', 'Perú', 'Argentina')"
        },
        startDate: {
          type: "string",
          description: "Fecha de inicio para la búsqueda en formato YYYY-MM-DD"
        },
        endDate: {
          type: "string",
          description: "Fecha final para la búsqueda en formato YYYY-MM-DD"
        }
      }
    }
  },
  {
    name: "searchFestivals",
    description: "Busca festivales de música en la base de datos por nombre, ciudad o año. Usa esta función cuando el usuario pregunte por festivales.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre del festival (ej: 'Estéreo Picnic', 'Lollapalooza')"
        },
        city: {
          type: "string",
          description: "Ciudad del festival"
        },
        year: {
          type: "integer",
          description: "Año del festival (ej: 2026, 2027)"
        }
      }
    }
  }
];

// ========================================
// MAIN HANDLER
// ========================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== AI Concert Assistant Request Started ===');
    const { messages: rawMessages, userId, conversationId } = await req.json();
    console.log('[Step 1] Received request with', rawMessages?.length || 0, 'messages');

    // Map 'bot' role to 'assistant' for OpenAI compatibility
    const messages = (rawMessages || []).map((msg: any) => ({
      ...msg,
      role: msg.role === 'bot' ? 'assistant' : msg.role
    }));

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // System prompt
    const systemPrompt = `Eres un asistente virtual amigable y experto en conciertos y festivales de música latina en Latinoamérica.

🎯 TU PERSONALIDAD:
- Eres empático, entusiasta y cercano - habla como un amigo que ama la música
- Usa emojis ocasionales para transmitir emoción (🎵 🎸 🎉 ✨ 🙌)
- Termina tus respuestas invitando al usuario a preguntar más

📋 HERRAMIENTAS DISPONIBLES:
Tienes acceso a funciones para buscar en la base de datos:
- searchConcerts: Busca conciertos por artista, ciudad, país o fechas
- searchFestivals: Busca festivales por nombre, ciudad o año

ÚSALAS SIEMPRE que el usuario pregunte por conciertos o festivales específicos.

✨ FORMATO DE RESPUESTAS (MUY IMPORTANTE):
- NUNCA uses formato markdown con ** para negritas
- Usa TEXTO PLANO limpio con buena estructura
- Separa secciones con LÍNEAS EN BLANCO
- Usa emojis al inicio de secciones para organizar visualmente
- Mantén párrafos cortos (máximo 2-3 líneas)

EJEMPLO DE FORMATO CORRECTO:

¡Hola! 🎵 Te ayudo con mucho gusto.

Aquí están los próximos conciertos en Colombia:

1. Bad Bunny - Debí Tirar Más Fotos World Tour
   📅 Viernes, 23 de enero de 2026
   📍 Estadio Atanasio Girardot, Medellín
   🎟️ Entradas disponibles en Ticketmaster

¿Te gustaría saber más detalles? 🎸

🎟️ INFORMACIÓN PRÁCTICA:
- Siempre proporciona enlaces de compra de entradas cuando estén disponibles
- Sugiere hoteles cercanos, transporte, y qué llevar al evento
- Sé útil y amigable en la planificación

RECUERDA: Cuando necesites información específica, USA LAS FUNCIONES para buscar en la base de datos. NO inventes información.`;

    console.log('[Step 2] Making first OpenAI call...');

    // First OpenAI call with function calling enabled
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        functions: functions,
        function_call: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    let data = await response.json();
    console.log('[Step 3] OpenAI response received');

    // Check if OpenAI wants to call a function
    if (data.choices[0].message.function_call) {
      const functionCall = data.choices[0].message.function_call;
      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments);

      console.log(`[Step 4] AI wants to call function: ${functionName}`);
      console.log(`[Step 4] Function arguments:`, functionArgs);

      // Execute the requested function
      let functionResult;
      if (functionName === 'searchConcerts') {
        functionResult = await searchConcerts(supabase, functionArgs);
      } else if (functionName === 'searchFestivals') {
        functionResult = await searchFestivals(supabase, functionArgs);
      } else {
        functionResult = { error: 'Unknown function' };
      }

      console.log('[Step 5] Function executed, results:', JSON.stringify(functionResult).substring(0, 200) + '...');

      // Send function result back to OpenAI
      console.log('[Step 6] Sending function result back to OpenAI...');
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            data.choices[0].message, // The assistant's function call
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error (second call):', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      data = await response.json();
      console.log('[Step 7] Final OpenAI response received');
    }

    const aiResponse = data.choices[0].message.content;

    if (!aiResponse) {
      throw new Error('No response content received from OpenAI');
    }

    console.log('[Step 8] Request completed successfully');
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-concert-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', errorMessage);
    console.error('Error stack:', errorStack);

    return new Response(
      JSON.stringify({
        error: `Error: ${errorMessage}`,
        details: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
