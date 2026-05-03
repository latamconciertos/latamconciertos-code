// deno-lint-ignore-file
// @ts-nocheck
// Sends a Push Campaign to its target audience.
// Auth: admin only. Body: { campaignId }.
//
// Flow:
//   1. Loads the campaign and verifies the caller is admin
//   2. Resolves the audience JSON to a list of user_ids
//   3. Pulls active push_subscriptions for those users
//   4. Sends Web Push in batches of 50 (concurrent) with TTL = 24h
//   5. Updates the campaign row with sent/failed counts and status
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

async function resolveAudience(
  admin: ReturnType<typeof createClient>,
  audience: { type: string; countryId?: string; artistId?: string }
): Promise<Set<string>> {
  if (audience.type === 'all') {
    const { data } = await admin
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true);
    return new Set((data ?? []).map((r: any) => r.user_id));
  }

  if (audience.type === 'country' && audience.countryId) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .eq('country_id', audience.countryId);
    const userIds = (profiles ?? []).map((p: any) => p.id);
    if (!userIds.length) return new Set();
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true)
      .in('user_id', userIds);
    return new Set((subs ?? []).map((r: any) => r.user_id));
  }

  if (audience.type === 'artist' && audience.artistId) {
    const { data: fans } = await admin
      .from('favorite_artists')
      .select('user_id')
      .eq('artist_id', audience.artistId);
    const userIds = (fans ?? []).map((f: any) => f.user_id);
    if (!userIds.length) return new Set();
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true)
      .in('user_id', userIds);
    return new Set((subs ?? []).map((r: any) => r.user_id));
  }

  return new Set();
}

async function sendInBatches(
  subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: string,
  batchSize = 50
): Promise<{ sent: number; failed: number; staleIds: string[] }> {
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];
  const options = { TTL: 60 * 60 * 24 }; // 24h

  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          options
        )
      )
    );
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const code = (r as PromiseRejectedResult).reason?.statusCode;
        if (code === 404 || code === 410) staleIds.push(batch[idx].id);
      }
    });
  }
  return { sent, failed, staleIds };
}

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

    // Verify admin
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Solo admins' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaignId } = await req.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'campaignId requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: campaign, error: campErr } = await admin
      .from('push_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaña no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (campaign.status === 'sent') {
      return new Response(JSON.stringify({ error: 'Esta campaña ya fue enviada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark sending
    await admin
      .from('push_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    // Resolve audience
    const userIds = await resolveAudience(admin, campaign.audience);
    if (userIds.size === 0) {
      await admin
        .from('push_campaigns')
        .update({
          status: 'sent',
          recipient_count: 0,
          sent_count: 0,
          failed_count: 0,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
      return new Response(
        JSON.stringify({ ok: true, recipientCount: 0, sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('is_active', true)
      .in('user_id', Array.from(userIds));

    const subscriptions = subs ?? [];
    const recipientCount = subscriptions.length;

    const payload = JSON.stringify({
      title: campaign.title,
      body: campaign.body,
      url: campaign.url || '/',
      tag: `campaign-${campaign.id}`,
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
    });

    const { sent, failed, staleIds } = await sendInBatches(subscriptions, payload);

    if (staleIds.length) {
      await admin.from('push_subscriptions').update({ is_active: false }).in('id', staleIds);
    }

    await admin
      .from('push_campaigns')
      .update({
        status: 'sent',
        recipient_count: recipientCount,
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({ ok: true, recipientCount, sent, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('push-broadcast error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
