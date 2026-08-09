// Huella de contenido del evento: detecta cambios entre corridas y dedupe cross-source
// cuando no hay PULEP.

import { normalizeName } from './matching.ts';

export async function computeFingerprint(
  title: string,
  eventDate: string | null,
  venueName: string | null,
): Promise<string> {
  const input = `${normalizeName(title)}|${eventDate || ''}|${normalizeName(venueName || '')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
