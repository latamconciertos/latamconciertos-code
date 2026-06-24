// Verificación de identidad compartida para Edge Functions.
// Valida la FIRMA del JWT (vía auth.getUser) en lugar de decodificarlo a ciegas,
// evitando IDOR por tokens forjados.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

/**
 * Devuelve el id del usuario autenticado a partir del header Authorization,
 * verificando la firma del JWT. Lanza si el header falta o el token es inválido.
 */
export async function getVerifiedUserId(authHeader: string | null): Promise<string> {
  if (!authHeader) throw new Error("Missing Authorization header");

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Invalid token");
  return user.id;
}
