// Extracción de un evento: pre-parse de JSON-LD + LLM (gateway Lovable, mismo proveedor que
// extract-prices-from-image) + verificación determinista de la fecha local.

import type { CanonicalEvent, SourceRow } from './types.ts';
import { buildExtractionMessages } from './prompt.ts';
import { htmlToText } from './fetchPage.ts';

const EVENT_TYPES = ['Event', 'MusicEvent', 'Festival', 'TheaterEvent'];

// Devuelve el primer bloque JSON-LD de tipo Event de la página (serializado, recortado).
export function extractJsonLd(html: string): string | null {
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] || [])];
      for (const item of candidates) {
        const type = item?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((t: string) => EVENT_TYPES.includes(t))) {
          return JSON.stringify(item).slice(0, 4000);
        }
      }
    } catch { /* JSON-LD malformado: lo ignora y sigue */ }
  }
  return null;
}

// La fecha local se deriva determinísticamente de cualquier startDate ISO con offset explícito,
// sin depender del LLM. La zona horaria viene de la fuente (Bogotá UTC-5, CDMX UTC-6, etc.):
// Intl resuelve el offset real de esa fecha, incluido DST donde aplique (ej. Tijuana).
export function deriveLocalDateTime(
  isoStartDate: string,
  timeZone = 'America/Bogota',
): { date: string; time: string } | null {
  if (!/([zZ]|[+-]\d{2}:?\d{2})$/.test(isoStartDate.trim())) return null;
  const parsed = new Date(isoStartDate);
  if (isNaN(parsed.getTime())) return null;
  try {
    // sv-SE formatea como "YYYY-MM-DD HH:mm", que ya es la fecha/hora local de esa zona.
    const local = new Intl.DateTimeFormat('sv-SE', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(parsed);
    return { date: local.slice(0, 10), time: local.slice(11, 16) };
  } catch {
    return null; // zona horaria inválida en la config
  }
}

function clampEventType(value: unknown): CanonicalEvent['event_type_guess'] {
  if (value === 'concert' || value === 'festival') return value;
  return 'other';
}

function clampRelevance(value: unknown): CanonicalEvent['relevance'] {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function extractEvent(args: {
  source: SourceRow;
  url: string;
  html: string;
  markdown: string | null;
  categoryHint?: string;
}): Promise<CanonicalEvent> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const jsonld = extractJsonLd(args.html);
  const pageText = args.markdown
    ? args.markdown.slice(0, 15_000)
    : htmlToText(args.html);

  const messages = buildExtractionMessages({
    sourceName: args.source.name,
    countryCode: args.source.country_code,
    url: args.url,
    categoryHint: args.categoryHint,
    jsonld,
    pageText,
    config: args.source.config,
    todayIso: new Date().toISOString().slice(0, 10),
  });

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM gateway ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM returned empty response');

  let jsonStr = content;
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonStr = fenced[1].trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${jsonStr.slice(0, 200)}`);
  }

  const title = asStringOrNull(parsed.title);
  if (!title) throw new Error('Extraction missing title');

  const event: CanonicalEvent = {
    title,
    artist_name: asStringOrNull(parsed.artist_name),
    venue_name: asStringOrNull(parsed.venue_name),
    city_name: asStringOrNull(parsed.city_name),
    event_date: asStringOrNull(parsed.event_date),
    event_time: asStringOrNull(parsed.event_time),
    doors_time: asStringOrNull(parsed.doors_time),
    event_type_guess: clampEventType(parsed.event_type_guess),
    relevance: clampRelevance(parsed.relevance),
    confidence: typeof parsed.confidence === 'number'
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.5,
    ticket_url: asStringOrNull(parsed.ticket_url) || args.url,
    image_url: asStringOrNull(parsed.image_url),
    promoter_name: asStringOrNull(parsed.promoter_name),
    pulep_code: asStringOrNull(parsed.pulep_code)?.toUpperCase() ?? null,
    price_data: parsed.price_data ?? null,
    sale_stages: parsed.sale_stages ?? null,
    extraction_notes: asStringOrNull(parsed.extraction_notes),
  };

  // Cross-check determinista: si el JSON-LD trae startDate con offset, la fecha local manda.
  if (jsonld) {
    try {
      const startDate = JSON.parse(jsonld)?.startDate;
      if (typeof startDate === 'string') {
        const derived = deriveLocalDateTime(
          startDate,
          args.source.config.defaults?.timezone || 'America/Bogota',
        );
        if (derived && event.event_date && derived.date !== event.event_date) {
          event.event_date = derived.date;
          event.event_time = derived.time;
          event.extraction_notes = [
            event.extraction_notes,
            'fecha corregida desde JSON-LD startDate (conversión a hora local)',
          ].filter(Boolean).join(' | ');
        }
      }
    } catch { /* JSON-LD sin startDate parseable */ }
  }

  return event;
}
