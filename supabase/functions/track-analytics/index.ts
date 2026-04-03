import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingData {
  sessionId: string;
  userId?: string | null;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  isNewSession?: boolean;
  entryPage?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const trackingData: TrackingData = await req.json();

    // Validate required fields
    if (!trackingData.sessionId || !trackingData.pagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, pagePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP from request headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Sanitize and truncate data to prevent injection/overflow
    const sanitizedData = {
      session_id: trackingData.sessionId.substring(0, 100),
      user_id: trackingData.userId || null,
      page_path: trackingData.pagePath.substring(0, 500),
      page_title: trackingData.pageTitle?.substring(0, 200) || null,
      referrer: trackingData.referrer?.substring(0, 500) || null,
      user_agent: trackingData.userAgent?.substring(0, 500) || null,
      device_type: trackingData.deviceType?.substring(0, 50) || null,
      browser: trackingData.browser?.substring(0, 50) || null,
      os: trackingData.os?.substring(0, 50) || null,
      ip_address: ipAddress,
    };

    // Insert page view using service role (bypasses RLS)
    const { error: pageViewError } = await supabase
      .from('page_views')
      .insert(sanitizedData);

    if (pageViewError) {
      console.error('Error inserting page view:', pageViewError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar vista de página' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle session tracking
    if (trackingData.isNewSession) {
      // Create new session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_id: sanitizedData.session_id,
          user_id: sanitizedData.user_id,
          entry_page: trackingData.entryPage?.substring(0, 500) || trackingData.pagePath.substring(0, 500),
          referrer: sanitizedData.referrer,
          device_type: sanitizedData.device_type,
          browser: sanitizedData.browser,
          os: sanitizedData.os,
          pages_visited: 1,
        });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      }
    } else {
      // Update existing session
      const { data: session } = await supabase
        .from('sessions')
        .select('pages_visited')
        .eq('session_id', sanitizedData.session_id)
        .single();

      if (session) {
        await supabase
          .from('sessions')
          .update({ 
            pages_visited: (session.pages_visited || 0) + 1,
            exit_page: sanitizedData.page_path,
          })
          .eq('session_id', sanitizedData.session_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
