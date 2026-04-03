import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketPrice {
  zone: string;
  price: string;
  currency: string;
  service_fee?: string;
  availability?: string;
}

interface ExtractedPrices {
  event_name?: string;
  venue?: string;
  date?: string;
  presale_prices: TicketPrice[];
  regular_prices: TicketPrice[];
  notes?: string;
  source_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere imageUrl o imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting prices from image...');

    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: imageBase64 } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en extraer información de precios de boletos de conciertos desde imágenes.
Extrae TODOS los precios visibles en la imagen y clasifícalos en:
- presale_prices: Precios de preventa (si aplica)
- regular_prices: Precios de venta general

Para cada precio extrae:
- zone: Nombre de la zona/localidad
- price: Precio del boleto (solo el número con formato)
- currency: Moneda (USD, CLP, ARS, MXN, etc.)
- service_fee: Cargo por servicio si está visible (opcional)
- availability: Estado de disponibilidad si se muestra (opcional)

Responde SOLO con un JSON válido con esta estructura:
{
  "event_name": "nombre del evento si es visible",
  "venue": "nombre del venue si es visible",
  "date": "fecha si es visible",
  "presale_prices": [...],
  "regular_prices": [...],
  "notes": "notas adicionales importantes"
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrae todos los precios de boletos de esta imagen:' },
              imageContent
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Error de AI: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se recibió respuesta del modelo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const extractedData: ExtractedPrices = JSON.parse(jsonStr);

    // Ensure arrays exist
    if (!extractedData.presale_prices) extractedData.presale_prices = [];
    if (!extractedData.regular_prices) extractedData.regular_prices = [];

    console.log('Extracted prices:', extractedData);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting prices from image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error al procesar la imagen' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
