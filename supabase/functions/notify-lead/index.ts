// deno-lint-ignore-file
// @ts-nocheck
// Notifica por email cada lead comercial de /publicidad:
// 1) aviso interno al equipo (con reply-to del lead para responder en un clic)
// 2) auto-respuesta al lead confirmando propuesta en 48h
// Invocada fire-and-forget desde el cliente tras insertar en advertising_requests.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'Conciertos LATAM <onboarding@resend.dev>';
const LEAD_NOTIFICATION_EMAIL = Deno.env.get('LEAD_NOTIFICATION_EMAIL') || 'latamconciertos@gmail.com';

const PRODUCT_LABELS: Record<string, string> = {
  'evento-destacado': 'Evento destacado',
  'pauta-display': 'Pauta display',
  'contenido-aliado': 'Contenido aliado',
  'media-partner': 'Media partner',
  'otro': 'Otro / no está seguro',
};

interface LeadPayload {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  ad_type: string;
  message?: string | null;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function internalHtml(lead: LeadPayload): string {
  const product = PRODUCT_LABELS[lead.ad_type] || lead.ad_type;
  const row = (label: string, value: string | null | undefined) =>
    value
      ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#94A0BD;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#F2F5FC;">${esc(value)}</td></tr>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070D1F;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="height:3px;background:linear-gradient(95deg,#004AAD,#597CFF);border-radius:2px;margin-bottom:24px;"></div>
    <p style="color:#37C563;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Nuevo lead de pauta</p>
    <h1 style="color:#F2F5FC;font-size:22px;margin:0 0 20px;">${esc(lead.company_name)}</h1>
    <table style="border-collapse:collapse;font-size:14px;">
      ${row('Contacto', lead.contact_name)}
      ${row('Email', lead.email)}
      ${row('Teléfono', lead.phone)}
      ${row('Sitio web', lead.website)}
      ${row('Interés', product)}
      ${row('Mensaje', lead.message)}
    </table>
    <p style="margin:24px 0 0;">
      <a href="mailto:${esc(lead.email)}" style="display:inline-block;background:linear-gradient(95deg,#004AAD,#597CFF);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:100px;">Responder al lead</a>
    </p>
    <p style="color:#94A0BD;font-size:12px;margin:24px 0 0;">Compromiso público: propuesta en máximo 48 horas.</p>
  </div>
</body>
</html>`;
}

function autoReplyHtml(lead: LeadPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070D1F;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="height:3px;background:linear-gradient(95deg,#004AAD,#597CFF);border-radius:2px;margin-bottom:24px;"></div>
    <p style="color:#37C563;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Solicitud recibida</p>
    <h1 style="color:#F2F5FC;font-size:22px;margin:0 0 16px;">¡Gracias, ${esc(lead.contact_name)}!</h1>
    <p style="color:#94A0BD;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Recibimos la solicitud de pauta de <strong style="color:#F2F5FC;">${esc(lead.company_name)}</strong>.
      Nuestro equipo comercial la está revisando y te enviaremos una propuesta a la medida
      en un máximo de <strong style="color:#F2F5FC;">48 horas</strong>.
    </p>
    <p style="color:#94A0BD;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Mientras tanto, puedes conocer cómo trabajamos en nuestros
      <a href="https://www.conciertoslatam.com/editorial-guidelines" style="color:#597CFF;text-decoration:none;">lineamientos editoriales</a>.
    </p>
    <p style="color:#94A0BD;font-size:12px;margin:0;">Conciertos Latam · Hecho con amor por la música en vivo</p>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    console.error('Resend error:', res.status, await res.text());
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // El envío de emails es abusable: límite estricto por IP
  const limited = await enforceRateLimit(req, {
    functionName: 'notify-lead',
    windowSeconds: 600,
    maxRequests: 5,
  });
  if (limited) return limited;

  try {
    const lead = (await req.json()) as LeadPayload;

    // Validación mínima: la validación completa ya ocurrió en el insert
    if (
      !lead?.company_name?.trim() ||
      !lead?.contact_name?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead?.email || '') ||
      !lead?.ad_type?.trim()
    ) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const product = PRODUCT_LABELS[lead.ad_type] || lead.ad_type;

    const [internalSent, replySent] = await Promise.all([
      sendEmail(
        LEAD_NOTIFICATION_EMAIL,
        `🎯 Nuevo lead de pauta: ${lead.company_name} (${product})`,
        internalHtml(lead),
        lead.email,
      ),
      sendEmail(
        lead.email,
        'Recibimos tu solicitud de pauta | Conciertos Latam',
        autoReplyHtml(lead),
      ),
    ]);

    return new Response(JSON.stringify({ ok: true, internalSent, replySent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-lead error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
