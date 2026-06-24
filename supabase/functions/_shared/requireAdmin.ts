// Verificación de admin compartida para Edge Functions.
// Valida el JWT (firma incluida, vía auth.getUser) y comprueba profiles.is_admin
// con el service role. Mismo patrón que push-broadcast.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function deny(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface AdminCheck {
  // null si autorizado; Response de error en caso contrario.
  error: Response | null;
  userId: string | null;
}

export async function requireAdmin(req: Request): Promise<AdminCheck> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: deny("No autorizado", 401), userId: null };

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { error: deny("Sesión inválida", 401), userId: null };

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return { error: deny("Solo admins", 403), userId: user.id };

  return { error: null, userId: user.id };
}
