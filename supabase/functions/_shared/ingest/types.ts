// Tipos del pipeline de ingesta. El contrato canónico refleja las columnas de staged_events.

export interface SourceConfig {
  discovery: {
    type: 'sitemap' | 'category_pages' | 'both';
    category_urls?: string[];
    sitemap_url?: string;
    event_url_pattern: string;
    max_new_pages_per_run?: number;
  };
  fetch?: {
    wait_for_ms?: number;
    user_agent?: string;
  };
  extract?: {
    prefer_jsonld?: boolean;
    price_source?: 'html' | 'image' | 'none';
    hints?: string;
    // Los eventos se leen del array JSON-LD de la página de categoría, sin visitar cada ficha
    // (Ticketmaster México bloquea el detalle con 401). Mapeo determinista, sin LLM.
    list_from_jsonld?: boolean;
    // Títulos/URLs que delatan add-ons de boletería (estacionamiento, fast lane, paquetes VIP):
    // se estacionan como relevancia baja en vez de colarse como conciertos.
    exclude_title_patterns?: string[];
  };
  defaults?: {
    timezone?: string;
    currency?: string;
    city_name?: string | null;
    venue_name?: string | null;
  };
  category_map?: Record<string, string>;
}

export interface SourceRow {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  country_code: string;
  is_active: boolean;
  fetch_method: 'http' | 'firecrawl';
  config: SourceConfig;
  last_run_at: string | null;
}

export interface DiscoveredUrl {
  url: string;
  categoryHint?: string;
  lastmod?: string;
}

export interface CanonicalEvent {
  title: string;
  artist_name: string | null;
  venue_name: string | null;
  city_name: string | null;
  event_date: string | null; // YYYY-MM-DD (hora local del venue)
  event_time: string | null; // HH:MM
  doors_time: string | null;
  event_type_guess: 'concert' | 'festival' | 'other';
  relevance: 'high' | 'medium' | 'low';
  confidence: number;
  ticket_url: string | null;
  image_url: string | null;
  promoter_name: string | null;
  pulep_code: string | null;
  price_data: unknown | null;
  sale_stages: unknown | null;
  extraction_notes: string | null;
}

export interface RunCounters {
  pages_discovered: number;
  pages_fetched: number;
  events_extracted: number;
  events_new: number;
  events_updated: number;
  events_skipped: number;
}

export function emptyCounters(): RunCounters {
  return {
    pages_discovered: 0,
    pages_fetched: 0,
    events_extracted: 0,
    events_new: 0,
    events_updated: 0,
    events_skipped: 0,
  };
}
