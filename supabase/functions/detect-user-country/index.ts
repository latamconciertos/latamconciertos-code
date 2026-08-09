// Geolocalización por IP para personalizar el home: devuelve país (con su id en la base) y
// además ciudad/región, que es lo que permite priorizar los conciertos más cercanos al usuario.
// Ante cualquier fallo degrada a Colombia en vez de romper: el home siempre debe renderizar.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_ISO = 'CO';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // El cliente se crea una sola vez y ANTES de cualquier rama que lo use: la versión previa lo
  // declaraba después del primer fallback, que por eso lanzaba ReferenceError y solo funcionaba
  // de rebote gracias al catch externo.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  async function respondWithCountry(
    isoCode: string,
    extra: Record<string, unknown> = {},
  ): Promise<Response> {
    const { data: country } = await supabase
      .from('countries')
      .select('id, name, iso_code')
      .ilike('iso_code', isoCode)
      .maybeSingle();

    if (!country) {
      // El país existe en el mundo pero no en el catálogo: se informa igual para que el frontend
      // pueda decidir (mostrar toda LATAM) en lugar de asumir Colombia silenciosamente.
      return json({ country_id: null, country_code: isoCode, country_name: null, ...extra });
    }
    return json({
      country_id: country.id,
      country_name: country.name,
      country_code: country.iso_code,
      ...extra,
    });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      '';

    if (!clientIP) {
      return await respondWithCountry(FALLBACK_ISO, { fallback: true, reason: 'sin IP' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let ipData: Record<string, unknown> | null = null;
    try {
      const res = await fetch(`https://ipapi.co/${clientIP}/json/`, {
        headers: { 'User-Agent': 'Conciertos Latam/1.0' },
        signal: controller.signal,
      });
      if (res.ok) ipData = await res.json();
    } catch (error) {
      console.error('[detect-user-country] ipapi falló:', error instanceof Error ? error.message : error);
    } finally {
      clearTimeout(timeout);
    }

    const isoCode = (ipData?.country_code || ipData?.country) as string | undefined;
    if (!isoCode) {
      return await respondWithCountry(FALLBACK_ISO, { fallback: true, reason: 'sin país en la respuesta' });
    }

    // La ciudad es lo que permite ordenar por cercanía dentro del país (un usuario en Guadalajara
    // ve primero Guadalajara y luego el resto de México).
    return await respondWithCountry(isoCode, {
      city_name: (ipData?.city as string) ?? null,
      region: (ipData?.region as string) ?? null,
    });
  } catch (error) {
    console.error('[detect-user-country] error inesperado:', error);
    try {
      return await respondWithCountry(FALLBACK_ISO, { fallback: true });
    } catch {
      return json({ error: 'No se pudo detectar la ubicación' }, 500);
    }
  }
});
