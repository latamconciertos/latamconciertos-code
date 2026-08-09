// Anti-SSRF compartido: rechaza hosts privados/loopback antes de hacer fetch server-side.
// Extraído de firecrawl-scrape-prices para reutilizarlo en el pipeline de ingesta.

export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  );
}

// Valida que una URL sea pública y (opcionalmente) pertenezca al dominio de la fuente.
// allowedHost: 'tuboleta.com' acepta también subdominios (prod.tuboleta.com).
export function isAllowedUrl(rawUrl: string, allowedHost?: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  const host = parsed.hostname.toLowerCase();
  if (isPrivateHost(host)) return false;
  if (allowedHost) {
    const root = allowedHost.toLowerCase().replace(/^www\./, '');
    if (host !== root && !host.endsWith(`.${root}`)) return false;
  }
  return true;
}
