// Rate limiting compartido para Edge Functions.
// Llama a la función Postgres bump_rate_limit con el service role (ignora RLS).
// Diseño fail-open: si el limiter falla, deja pasar la petición para no
// introducir nuevos puntos de fallo que rompan funcionalidad.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

interface RateLimitOptions {
  functionName: string;
  windowSeconds?: number; // ventana en segundos (default 60)
  maxRequests?: number;   // máximo de peticiones por ventana (default 30)
  byUser?: boolean;       // usar el id del usuario (sub del JWT) si está presente
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Devuelve null si la petición está permitida, o un Response 429 si se superó el límite.
 */
export async function enforceRateLimit(
  req: Request,
  opts: RateLimitOptions,
): Promise<Response | null> {
  const {
    functionName,
    windowSeconds = 60,
    maxRequests = 30,
    byUser = false,
  } = opts;

  let identifier = getClientIp(req);
  if (byUser) {
    const auth = req.headers.get("authorization");
    if (auth) {
      // El sub del JWT basta como clave de rate-limit (no es decisión de auth).
      try {
        const payload = JSON.parse(
          atob(auth.replace("Bearer ", "").split(".")[1]),
        );
        if (payload?.sub) identifier = `user:${payload.sub}`;
      } catch {
        // fallback a IP
      }
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_function_name: functionName,
      p_identifier: identifier,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });

    // Fail-open ante cualquier error del limiter.
    if (error || !data?.[0]) return null;

    if (!data[0].allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: data[0].retry_after,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(data[0].retry_after),
          },
        },
      );
    }
    return null;
  } catch (_e) {
    // Fail-open.
    return null;
  }
}
