/**
 * Normaliza títulos scrapeados en MAYÚSCULA SOSTENIDA a Título Con Mayúsculas
 * Iniciales ("JORGE CELEDÓN | LA HISTORIA MÍA" → "Jorge Celedón | La Historia Mía").
 *
 * Solo actúa si el texto viene mayormente en mayúsculas: títulos con casing
 * intencional ("WWE Bogota 2026", "Tini") pasan intactos.
 */
const UPPERCASE_RATIO_THRESHOLD = 0.7;

export function smartTitleCase(raw: string): string {
  const letters = raw.replace(/[^\p{L}]/gu, '');
  if (!letters.length) return raw;

  const upperCount = [...letters].filter((ch) => ch !== ch.toLocaleLowerCase('es')).length;
  if (upperCount / letters.length < UPPERCASE_RATIO_THRESHOLD) return raw;

  return raw
    .toLocaleLowerCase('es')
    .replace(/(^|[\s|(\['"“‘/\-–—·&+])(\p{L})/gu, (_m, sep: string, ch: string) =>
      sep + ch.toLocaleUpperCase('es'),
    );
}
