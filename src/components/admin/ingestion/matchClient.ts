// Fuzzy matching client-side (misma lógica que el worker) para re-matchear al abrir la ficha,
// ya que el catálogo crece entre corridas.

export type MatchConfidence = 'exact' | 'partial' | 'not_found';

function normalizeName(name: string): string {
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
