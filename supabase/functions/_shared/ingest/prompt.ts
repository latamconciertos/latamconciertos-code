// Prompt del extractor: cualquier fuente entra, sale SIEMPRE el mismo JSON canónico.

import type { SourceConfig } from './types.ts';

export interface PromptInput {
  sourceName: string;
  countryCode: string;
  url: string;
  categoryHint?: string;
  jsonld: string | null;
  pageText: string;
  config: SourceConfig;
  todayIso: string;
}

export function buildExtractionMessages(input: PromptInput) {
  const defaults = input.config.defaults || {};
  const hints = input.config.extract?.hints || '';

  const system = `Eres el extractor de datos de Conciertos LATAM. Recibes el contenido de una página
de evento de una ticketera o venue y devuelves SOLO un JSON válido (sin markdown, sin explicación)
con esta estructura exacta:

{
  "title": "nombre del evento",
  "artist_name": "artista principal o null",
  "venue_name": "venue o null",
  "city_name": "ciudad o null",
  "event_date": "YYYY-MM-DD o null",
  "event_time": "HH:MM o null",
  "doors_time": "HH:MM o null",
  "event_type_guess": "concert" | "festival" | "other",
  "relevance": "high" | "medium" | "low",
  "confidence": 0.0 a 1.0,
  "ticket_url": "URL de compra o null",
  "image_url": "URL de imagen del evento o null",
  "promoter_name": "promotora/responsable o null",
  "pulep_code": "código PULEP o null",
  "price_data": { "type": "zones" | "image" | "none", "zones": [ { "zone": "...", "stage": "...", "price": "...", "service_fee": "...", "total": "...", "currency": "...", "availability": "..." } ], "image_url": "URL de la imagen de precios si aplica" },
  "sale_stages": [ { "name": "...", "starts_at": "texto o fecha", "ends_at": "texto o fecha o null", "requirement": "banco/condición o null" } ],
  "extraction_notes": "observaciones importantes o null"
}

REGLAS:
- Fecha/hora SIEMPRE en hora local del venue (timezone: ${defaults.timezone || 'America/Bogota'}).
  Si hay JSON-LD con startDate en UTC u offset, conviértelo a esa zona horaria.
- Si la fecha aparece SIN año, elige la próxima ocurrencia futura respecto a hoy (${input.todayIso}),
  baja confidence a máximo 0.6 y anota "año inferido" en extraction_notes.
- event_type_guess: SOLO "concert", "festival" u "other". Nunca otro valor.
- relevance: "high" = gira/show de artista con proyección nacional o internacional en venue
  mediano/grande; "medium" = artista establecido en venue pequeño o caso dudoso; "low" = evento
  institucional/cultural local, recital académico, serie educativa, evento no musical.
- confidence: qué tan seguro estás de los datos extraídos (fechas en conflicto, datos faltantes o
  ambiguos = baja). Anota los conflictos en extraction_notes.
- Si la página incluye carruseles o listados de OTROS eventos, ignóralos: extrae solo el evento
  principal de la ficha.
- Moneda por defecto: ${defaults.currency || 'COP'}. País: ${input.countryCode}.
${defaults.venue_name ? `- Si la página no lo contradice, el venue es "${defaults.venue_name}".` : ''}
${defaults.city_name ? `- Si la página no la contradice, la ciudad es "${defaults.city_name}".` : ''}
${input.categoryHint ? `- La fuente clasifica este evento en la categoría "${input.categoryHint}"; úsalo como señal para event_type_guess, pero corrígelo si el contenido lo contradice.` : ''}
${hints ? `- Pistas específicas de esta fuente (${input.sourceName}): ${hints}` : ''}`;

  const user = `URL: ${input.url}

${input.jsonld ? `JSON-LD de la página:\n${input.jsonld}\n\n` : ''}Contenido de la página:
${input.pageText}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
