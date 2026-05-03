// deno-lint-ignore-file
// @ts-nocheck
// Sends a Web Push notification to all active subscriptions of a target user.
//
// Two ways to call:
//   1. POST with auth header — sends to the AUTHENTICATED user (used for "Test push" button)
//   2. POST with service-role auth header + body.userId — sends to a specific user
//      (used internally by triggers / scheduled jobs)
//
// Body: { userId?: string, payload: { title: string, body: string, url?: string, tag?: string } }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:latamconciertos@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const payload = body?.payload;
    if (!payload?.title) {
      return new Response(JSON.stringify({ error: 'payload.title requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the target user. If body.userId provided AND the caller is service role,
    // send to that user. Otherwise send to the authenticated caller.
    let targetUserId: string | null = null;

    const isServiceRole = authHeader.includes(SUPABASE_SERVICE_ROLE_KEY);
    if (isServiceRole && body.userId) {
      targetUserId = body.userId;
    } else {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      targetUserId = user?.id ?? null;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'No se pudo resolver el usuario' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', targetUserId)
      .eq('is_active', true);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subs?.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: 'Sin subscripciones activas' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body ?? '',
      url: payload.url ?? '/admin/operations',
      tag: payload.tag,
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          notification
        )
      )
    );

    let sent = 0;
    let failed = 0;
    const stale: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const err: any = (r as PromiseRejectedResult).reason;
        const code = err?.statusCode;
        // 404/410 = subscription expired/revoked → mark inactive so we stop retrying
        if (code === 404 || code === 410) {
          stale.push(subs[i].id);
        }
        console.warn('push send failed', code, err?.body);
      }
    });

    if (stale.length) {
      await admin.from('push_subscriptions').update({ is_active: false }).in('id', stale);
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, deactivated: stale.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('push-send error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
