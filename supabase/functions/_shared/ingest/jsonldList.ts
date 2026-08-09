// Extracción en modo lista: algunas ticketeras publican el catálogo como un array JSON-LD en la
// página de categoría y bloquean las fichas individuales (Ticketmaster México responde 401 en el
// detalle, incluso con headers de navegador completos). Ahí la categoría ES la fuente de datos, y
// como el JSON-LD ya viene estructurado el mapeo es determinista: sin llamada al LLM, sin costo.

import type { CanonicalEvent, SourceRow } from './types.ts';
import { deriveLocalDateTime } from './extractEvent.ts';

const EVENT_TYPES = ['Event', 'MusicEvent', 'Festival', 'TheaterEvent'];

function isEventNode(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== 'object') return false;
  const type = (node as Record<string, unknown>)['@type'];
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === 'string' && EVENT_TYPES.includes(t));
}

// Recorre todos los bloques JSON-LD de la página y devuelve cada nodo de tipo Event,
// venga suelto, dentro de un array o colgando de un @graph / itemListElement.
function collectEventNodes(html: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue; // JSON-LD malformado: se ignora el bloque
    }
    const queue: unknown[] = [parsed];
    while (queue.length) {
      const node = queue.shift();
      if (Array.isArray(node)) {
        queue.push(...node);
        continue;
      }
      if (!node || typeof node !== 'object') continue;
      if (isEventNode(node)) found.push(node as Record<string, unknown>);
      const record = node as Record<string, unknown>;
      for (const key of ['@graph', 'itemListElement', 'item', 'subEvent']) {
        if (record[key]) queue.push(record[key]);
      }
    }
  }
  return found;
}

function textOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) return textOf(value[0]);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return textOf(record.name ?? record.url ?? null);
  }
  return null;
}

export interface ListedEvent {
  url: string;
  event: CanonicalEvent;
}

export function extractEventsFromJsonLd(args: {
  source: SourceRow;
  html: string;
  categoryHint?: string;
}): ListedEvent[] {
  const { source, html, categoryHint } = args;
  const timezone = source.config.defaults?.timezone || 'America/Bogota';
  const currency = source.config.defaults?.currency || null;
  const excludePatterns = (source.config.extract?.exclude_title_patterns || [])
    .map((p) => p.toLowerCase());

  const results: ListedEvent[] = [];
  const seen = new Set<string>();

  for (const node of collectEventNodes(html)) {
    const title = textOf(node.name);
    const url = typeof node.url === 'string' ? node.url.replace(/^http:\/\//i, 'https://') : null;
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);

    const location = (node.location || {}) as Record<string, unknown>;
    const address = (location.address || {}) as Record<string, unknown>;
    const offer = Array.isArray(node.offers)
      ? (node.offers[0] as Record<string, unknown> | undefined)
      : (node.offers as Record<string, unknown> | undefined);

    // startDate puede venir con offset ("...-06:00"), sin offset ("2026-08-09T12:00:00") o como
    // fecha suelta ("2026-07-04"). Solo el primero necesita conversión de zona; los otros dos ya
    // están expresados en hora local del venue.
    let eventDate: string | null = null;
    let eventTime: string | null = null;
    const startDate = typeof node.startDate === 'string' ? node.startDate.trim() : null;
    if (startDate) {
      const converted = deriveLocalDateTime(startDate, timezone);
      if (converted) {
        eventDate = converted.date;
        eventTime = converted.time;
      } else {
        eventDate = startDate.slice(0, 10);
        const timePart = startDate.match(/T(\d{2}:\d{2})/)?.[1];
        eventTime = timePart ?? null;
      }
    }

    // Las ticketeras venden add-ons bajo el mismo artista (estacionamiento, fast lane, paquetes
    // VIP). No son conciertos: se marcan como baja relevancia para que la cola los filtre.
    const haystack = `${title} ${url}`.toLowerCase();
    const isAddOn = excludePatterns.some((p) => haystack.includes(p));

    const price = offer?.price;
    const priceData = price != null
      ? {
        type: 'jsonld',
        zones: [{
          name: 'General',
          price: typeof price === 'string' ? Number(price) || price : price,
          currency: textOf(offer?.priceCurrency) || currency,
        }],
      }
      : null;

    const availability = textOf(offer?.availability);
    const eventStatus = textOf(node.eventStatus);

    results.push({
      url,
      event: {
        title,
        artist_name: textOf(node.performer),
        venue_name: textOf(location.name),
        city_name: textOf(address.addressLocality),
        event_date: eventDate,
        event_time: eventTime,
        doors_time: null,
        event_type_guess: isAddOn
          ? 'other'
          : (categoryHint === 'festival' ? 'festival' : 'concert'),
        relevance: isAddOn ? 'low' : 'medium',
        confidence: eventDate ? 0.9 : 0.5,
        ticket_url: url,
        image_url: textOf(node.image),
        promoter_name: null,
        pulep_code: null, // registro colombiano: no aplica fuera de CO
        price_data: priceData,
        sale_stages: availability || eventStatus
          ? [{ nombre: 'Disponibilidad', estado: availability || eventStatus }]
          : null,
        extraction_notes: [
          'extraído del JSON-LD de la página de categoría (la ficha individual no es accesible)',
          isAddOn ? 'detectado como add-on de boletería, no un concierto' : null,
          !eventDate ? 'sin fecha en el JSON-LD' : null,
        ].filter(Boolean).join(' | '),
      },
    });
  }

  return results;
}
