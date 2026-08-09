// Descubrimiento de URLs de eventos: páginas de categoría (regex sobre el HTML) y/o sitemap
// (con filtro lastmod para re-visitar solo lo que cambió).

import { isAllowedUrl } from '../antiSsrf.ts';
import type { DiscoveredUrl, SourceRow } from './types.ts';
import { fetchPage } from './fetchPage.ts';

function resolveUrl(raw: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(raw.replace(/&amp;/g, '&'), baseUrl);
    resolved.hash = '';
    return resolved.toString();
  } catch {
    return null;
  }
}

// La llave estable del evento dentro de la fuente: path + query (taquillalive identifica el
// evento por query string; tuboleta sirve el mismo path bajo tuboleta.com y prod.tuboleta.com).
export function eventKeyFromUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
}

function extractMatches(html: string, pattern: string, baseUrl: string): string[] {
  const regex = new RegExp(pattern, 'g');
  const found = new Set<string>();
  for (const match of html.matchAll(regex)) {
    const resolved = resolveUrl(match[0], baseUrl);
    if (resolved) found.add(resolved);
  }
  return [...found];
}

async function discoverFromCategories(source: SourceRow): Promise<DiscoveredUrl[]> {
  const { config } = source;
  const results: DiscoveredUrl[] = [];
  const seen = new Set<string>();

  for (const categoryUrl of config.discovery.category_urls || []) {
    if (!isAllowedUrl(categoryUrl, new URL(source.base_url).hostname)) continue;
    const categoryHint = matchCategoryHint(categoryUrl, config.category_map || {});
    try {
      const page = await fetchPage(categoryUrl, source.fetch_method, {
        userAgent: config.fetch?.user_agent,
        waitForMs: config.fetch?.wait_for_ms,
      });
      for (const url of extractMatches(page.html || page.markdown || '', config.discovery.event_url_pattern, source.base_url)) {
        const key = eventKeyFromUrl(url);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ url, categoryHint });
      }
    } catch (error) {
      console.error(`[discover] category ${categoryUrl} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return results;
}

async function discoverFromSitemap(source: SourceRow, sinceIso: string | null): Promise<DiscoveredUrl[]> {
  const { config } = source;
  if (!config.discovery.sitemap_url) return [];

  const xmls: string[] = [];
  try {
    const first = await fetchPage(config.discovery.sitemap_url, 'http', {
      userAgent: config.fetch?.user_agent,
    });
    if (first.html.includes('<sitemapindex')) {
      const children = [...first.html.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)]
        .map((m) => m[1].trim())
        .slice(0, 3);
      for (const child of children) {
        try {
          const page = await fetchPage(child, 'http', { userAgent: config.fetch?.user_agent });
          xmls.push(page.html);
        } catch { /* sitemap hijo caído: seguimos con el resto */ }
      }
    } else {
      xmls.push(first.html);
    }
  } catch (error) {
    console.error('[discover] sitemap failed:', error instanceof Error ? error.message : error);
    return [];
  }

  const eventRegex = new RegExp(config.discovery.event_url_pattern);
  const results: DiscoveredUrl[] = [];
  const seen = new Set<string>();

  for (const xml of xmls) {
    for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = block[1].match(/<loc>\s*([^<]+)\s*<\/loc>/)?.[1]?.trim();
      if (!loc || !eventRegex.test(loc)) continue;
      const lastmod = block[1].match(/<lastmod>\s*([^<]+)\s*<\/lastmod>/)?.[1]?.trim();
      if (sinceIso && lastmod && lastmod <= sinceIso) continue;
      const resolved = resolveUrl(loc, source.base_url);
      if (!resolved) continue;
      const key = eventKeyFromUrl(resolved);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ url: resolved, lastmod });
    }
  }
  return results;
}

function matchCategoryHint(categoryUrl: string, categoryMap: Record<string, string>): string | undefined {
  for (const [fragment, eventType] of Object.entries(categoryMap)) {
    if (categoryUrl.includes(fragment)) return eventType;
  }
  return undefined;
}

export async function discoverEventUrls(source: SourceRow, sinceIso: string | null): Promise<DiscoveredUrl[]> {
  const type = source.config.discovery.type;
  const merged = new Map<string, DiscoveredUrl>();

  if (type === 'category_pages' || type === 'both') {
    for (const item of await discoverFromCategories(source)) {
      merged.set(eventKeyFromUrl(item.url), item);
    }
  }
  if (type === 'sitemap' || type === 'both') {
    for (const item of await discoverFromSitemap(source, sinceIso)) {
      const key = eventKeyFromUrl(item.url);
      const existing = merged.get(key);
      merged.set(key, existing ? { ...existing, lastmod: item.lastmod } : item);
    }
  }

  const allowedHost = new URL(source.base_url).hostname;
  return [...merged.values()].filter((item) => isAllowedUrl(item.url, allowedHost));
}
