/**
 * Sanitiza un término de búsqueda antes de interpolarlo en filtros de PostgREST
 * (`.or(...)`, `.ilike(...)`). Evita "filter injection": romper la cláusula con
 * comas/paréntesis o inyectar operadores/comodines.
 *
 * Elimina los caracteres con significado en la sintaxis de PostgREST y los
 * comodines de LIKE. Los nombres/usernames legítimos no contienen estos caracteres.
 */
export function sanitizeSearchTerm(input: string): string {
  return (input ?? '')
    // , ( ) : separan condiciones/operadores en .or(); % * _ \ son comodines/escape de LIKE
    .replace(/[,()%*\\:_]/g, ' ')
    .trim()
    .slice(0, 100);
}
