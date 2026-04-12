// deno-lint-ignore-file
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'Conciertos LATAM <onboarding@resend.dev>';

interface Accreditation {
  id: string;
  event_name: string;
  venue_name: string | null;
  event_date: string | null;
  deadline: string;
  status: string;
  contact_name: string | null;
  proposal_url: string | null;
}

interface TeamAssignment {
  accreditation_id: string;
  user_id: string;
  role: string;
}

function daysBetween(deadline: string): number {
  const d = new Date(deadline + 'T23:59:59');
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function buildEmailHtml(accreditation: Accreditation, daysLeft: number, role: string): string {
  const urgencyColor = daysLeft <= 1 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#3b82f6';
  const urgencyText =
    daysLeft < 0
      ? `⚠️ Vencida hace ${Math.abs(daysLeft)} día(s)`
      : daysLeft === 0
        ? '⚠️ Vence HOY'
        : `📅 Vence en ${daysLeft} día(s)`;

  const eventDate = accreditation.event_date
    ? new Date(accreditation.event_date + 'T12:00:00').toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Por definir';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <div style="background: #004aad; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 18px;">Conciertos LATAM</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Recordatorio de acreditación</p>
    </div>

    <div style="padding: 28px;">
      <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="margin: 0; color: ${urgencyColor}; font-weight: 600; font-size: 14px;">${urgencyText}</p>
      </div>

      <h2 style="margin: 0 0 12px; font-size: 20px; color: #1e293b;">${accreditation.event_name}</h2>

      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px;">
        ${daysLeft < 0
          ? `La fecha límite para enviar la propuesta de acreditación para <strong>${accreditation.event_name}</strong> ya venció. Si aún es posible, envíala lo antes posible para no perder la oportunidad de cubrir este evento.`
          : daysLeft === 0
            ? `Hoy es el último día para enviar la propuesta de acreditación para <strong>${accreditation.event_name}</strong>. Asegúrate de enviarla antes de que termine el día.`
            : `Te recordamos que ${daysLeft === 1 ? 'mañana vence' : `en ${daysLeft} días vence`} el plazo para enviar la propuesta de acreditación para <strong>${accreditation.event_name}</strong>. Revisa que todo esté listo y envíala a tiempo para asegurar la cobertura del evento.`
        }
      </p>

      <table style="width: 100%; font-size: 14px; color: #475569;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; width: 120px;">Fecha evento:</td>
          <td style="padding: 6px 0;">${eventDate}</td>
        </tr>
        ${accreditation.venue_name ? `<tr>
          <td style="padding: 6px 0; font-weight: 600;">Venue:</td>
          <td style="padding: 6px 0;">${accreditation.venue_name}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; font-weight: 600;">Deadline:</td>
          <td style="padding: 6px 0; color: ${urgencyColor}; font-weight: 600;">
            ${new Date(accreditation.deadline + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600;">Tu rol:</td>
          <td style="padding: 6px 0;">${role}</td>
        </tr>
        ${accreditation.contact_name ? `<tr>
          <td style="padding: 6px 0; font-weight: 600;">Contacto:</td>
          <td style="padding: 6px 0;">${accreditation.contact_name}</td>
        </tr>` : ''}
      </table>

      ${accreditation.proposal_url ? `
      <div style="margin-top: 24px;">
        <a href="${accreditation.proposal_url}" target="_blank"
           style="display: inline-block; background: #004aad; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Ver propuesta
        </a>
      </div>` : ''}
    </div>

    <div style="padding: 16px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
        Este es un recordatorio automático de Conciertos LATAM · Operaciones
      </p>
    </div>
  </div>
</body>
</html>`;
}

const ROLE_LABELS: Record<string, string> = {
  periodista: 'Periodista',
  fotografo: 'Fotógrafo',
  camarografo: 'Camarógrafo',
  social_media: 'Social Media',
  coordinador: 'Coordinador',
  otro: 'Otro',
};

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
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
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error for ${to}:`, err);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`Failed to send to ${to}:`, e);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get accreditations with deadlines in the next 7 days or overdue (still pending/draft)
    const { data: accreditations, error: accError } = await supabase
      .from('accreditations')
      .select('*')
      .in('status', ['draft', 'pending'])
      .order('deadline');

    if (accError) throw accError;
    if (!accreditations?.length) {
      return new Response(
        JSON.stringify({ message: 'No pending accreditations', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Filter to those within 7 days or overdue
    const relevant = accreditations.filter((a) => {
      const days = daysBetween(a.deadline);
      return days <= 7;
    });

    if (!relevant.length) {
      return new Response(
        JSON.stringify({ message: 'No upcoming deadlines', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const accIds = relevant.map((a) => a.id);

    // Get team assignments
    const { data: assignments } = await supabase
      .from('event_team_assignments')
      .select('accreditation_id, user_id, role')
      .in('accreditation_id', accIds);

    if (!assignments?.length) {
      return new Response(
        JSON.stringify({ message: 'No team assignments for upcoming deadlines', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get user emails
    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    const emailMap: Record<string, string> = {};
    for (const uid of userIds) {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) {
        emailMap[uid] = data.user.email;
      }
    }

    // Check already sent today
    const today = new Date().toISOString().slice(0, 10);
    const { data: alreadySent } = await supabase
      .from('notification_log')
      .select('accreditation_id, user_email, notification_type')
      .gte('sent_at', today + 'T00:00:00');

    const sentSet = new Set(
      (alreadySent ?? []).map((s) => `${s.accreditation_id}:${s.user_email}:${s.notification_type}`),
    );

    let sentCount = 0;
    const logs: any[] = [];
    const debugInfo: any[] = [];

    console.log('Relevant accreditations:', relevant.map(a => a.event_name));
    console.log('Email map:', emailMap);

    for (const acc of relevant) {
      const days = daysBetween(acc.deadline);

      // Solo notificar a 7 días, 3 días y hoy
      if (days !== 7 && days !== 3 && days !== 0) continue;

      const notifType = days === 0 ? 'today' : days === 3 ? '3days' : '7days';

      const teamForAcc = assignments.filter((a) => a.accreditation_id === acc.id);
      console.log(`Processing ${acc.event_name}: ${days} days, type=${notifType}, team=${teamForAcc.length}`);

      for (const member of teamForAcc) {
        const email = emailMap[member.user_id];
        if (!email) { console.log(`No email for user ${member.user_id}`); continue; }

        const key = `${acc.id}:${email}:${notifType}`;
        if (sentSet.has(key)) { console.log(`Already sent: ${key}`); continue; }

        const subject =
          days < 0
            ? `⚠️ VENCIDA: ${acc.event_name}`
            : days === 0
              ? `🔴 HOY vence: ${acc.event_name}`
              : days <= 3
                ? `⏰ En ${days} días vence: ${acc.event_name}`
                : `📅 Recordatorio: ${acc.event_name} (${days} días)`;

        const roleLabel = ROLE_LABELS[member.role] || member.role;
        const html = buildEmailHtml(acc, days, roleLabel);
        console.log(`Sending to ${email}: ${subject}`);
        const sent = await sendEmail(email, subject, html);
        console.log(`Send result for ${email}: ${sent}`);
        debugInfo.push({ email, subject: subject.slice(0, 50), sent });

        if (sent) {
          sentCount++;
          logs.push({
            accreditation_id: acc.id,
            user_email: email,
            notification_type: notifType,
            days_until_deadline: days,
          });
        }
      }
    }

    // Log sent notifications
    if (logs.length > 0) {
      await supabase.from('notification_log').insert(logs);
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${sentCount} notifications`,
        sent: sentCount,
        checked: relevant.length,
        debug: debugInfo,
        emailMap,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('notify-deadlines error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
