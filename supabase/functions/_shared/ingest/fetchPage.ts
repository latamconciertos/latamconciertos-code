// Capa de fetch del pipeline: HTTP directo (con UA de navegador) o Firecrawl (sitios con JS
// como taquillalive: Queue-It exige ejecutar JavaScript y CloudFront bloquea UAs headless).

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export interface FetchedPage {
  html: string;
  markdown: string | null;
}

// No todas las ticketeras sirven UTF-8: eticket.mx declara iso-8859-15 y decodificarlo como
// UTF-8 destruye los acentos ("CIUDAD DE MÉXICO" → "CIUDAD DE MXICO"), lo que luego contamina
// el matching de ciudades y venues. Se respeta el charset del header y, si falta, el <meta>.
function decodeBody(buffer: ArrayBuffer, contentType: string | null): string {
  const fromHeader = contentType?.match(/charset=["']?([\w-]+)/i)?.[1];
  const sniff = new TextDecoder('utf-8').decode(buffer.slice(0, 2048));
  const fromMeta = sniff.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  const charset = (fromHeader || fromMeta || 'utf-8').toLowerCase();
  if (charset === 'utf-8' || charset === 'utf8') {
    return new TextDecoder('utf-8').decode(buffer);
  }
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer); // charset desconocido: mejor algo que nada
  }
}

export async function fetchHttp(url: string, userAgent?: string): Promise<FetchedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent || DEFAULT_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-MX,es-CO,es;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const html = decodeBody(await res.arrayBuffer(), res.headers.get('content-type'));
    return { html, markdown: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFirecrawl(url: string, waitForMs = 5000): Promise<FetchedPage> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'rawHtml'],
      onlyMainContent: false,
      waitFor: waitForMs,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status}: ${data?.error || 'request failed'}`);
  }
  const payload = data.data || data;
  return {
    html: payload.rawHtml || payload.html || '',
    markdown: payload.markdown || null,
  };
}

export async function fetchPage(
  url: string,
  method: 'http' | 'firecrawl',
  opts: { userAgent?: string; waitForMs?: number } = {},
): Promise<FetchedPage> {
  return method === 'firecrawl'
    ? await fetchFirecrawl(url, opts.waitForMs)
    : await fetchHttp(url, opts.userAgent);
}

// Reducción de HTML a texto plano para el extractor LLM (sin dependencias externas).
export function htmlToText(html: string, maxChars = 15_000): string {
  const withoutBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = withoutBlocks
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  return text.slice(0, maxChars);
}
