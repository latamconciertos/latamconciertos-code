// Matching difuso de entidades (portado de scrape-setlist): normaliza nombres y compara
// exact → substring → 80% de solapamiento de palabras.

export type MatchConfidence = 'exact' | 'partial' | 'not_found';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMatchConfidence(a: string, b: string): MatchConfidence {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return 'not_found';
  if (normA === normB) return 'exact';

  if (normA.includes(normB) || normB.includes(normA)) return 'partial';

  const wordsA = normA.split(' ').filter(Boolean);
  const wordsB = new Set(normB.split(' ').filter(Boolean));
  const overlap = wordsA.filter((w) => wordsB.has(w)).length;
  if (wordsA.length > 0 && overlap / wordsA.length >= 0.8) return 'partial';

  return 'not_found';
}

export interface NamedEntity {
  id: string;
  name: string;
}

// Mejor candidato del catálogo: exact gana; entre partials, el de nombre más largo
// (menos ambiguo). Sin candidato razonable → null.
export function matchEntity(
  name: string | null,
  candidates: NamedEntity[],
): { id: string; confidence: MatchConfidence } | null {
  if (!name) return null;

  let bestPartial: NamedEntity | null = null;
  for (const candidate of candidates) {
    const confidence = getMatchConfidence(name, candidate.name);
    if (confidence === 'exact') return { id: candidate.id, confidence: 'exact' };
    if (confidence === 'partial') {
      if (!bestPartial || candidate.name.length > bestPartial.name.length) {
        bestPartial = candidate;
      }
    }
  }
  return bestPartial ? { id: bestPartial.id, confidence: 'partial' } : null;
}
