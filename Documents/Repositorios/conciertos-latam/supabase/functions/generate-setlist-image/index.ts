import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { concertTitle, artistName, date, songs, concertImage } = await req.json();
    
    console.log('Generating setlist image for:', concertTitle);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Crear el prompt con la información del setlist (sin incluir nombre de artista en cada canción)
    const songsList = songs.map((song: any) => 
      `• ${song.song_name}`
    ).join('\n');

    const prompt = `Generate a vibrant 1080x1080px square concert setlist image for social media with this exact layout:

TOP SECTION (large, centered, bold white text):
Title: "${concertTitle}"
${artistName ? `Artist: ${artistName}` : ''}
${date ? `Date: ${date}` : ''}

MIDDLE SECTION - SONG LIST (white text with bullet points):
Copy this exact list, each song ONCE only, use bullet (•) for each song:

${songsList}

CRITICAL RULES:
- Show exactly ${songs.length} songs from the list above
- Each song appears ONLY ONCE (no duplicates allowed)
- Use 2-3 columns if more than 15 songs
- Adjust font size so all songs fit clearly

DESIGN:
- Background: vibrant artistic gradient (purple, blue, pink colors)
- Music-themed decorative elements (instruments, sound waves, concert lights)
- Dark semi-transparent overlay for text readability
- Modern sans-serif font throughout
- Bottom right corner: "Powered By Conciertos Latam" (small, white, 50% opacity)

Output: Clean, modern, Instagram-ready 1080x1080px image`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Por favor intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Fondos insuficientes. Por favor agrega créditos a tu workspace de Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error al generar la imagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log('AI Response received');
    
    // Extraer la imagen generada
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No se pudo generar la imagen");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-setlist-image:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
