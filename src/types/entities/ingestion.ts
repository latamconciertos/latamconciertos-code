/**
 * Ingestion Pipeline Entity Types
 *
 * Hand-written (generated Supabase types lag the DB). Follows the accreditation.ts pattern.
 * DB values are English; label Records map them to Spanish for the UI.
 */

export type StagedEventStatus = 'pending' | 'approved' | 'rejected' | 'discarded' | 'error';
export type MatchConfidence = 'exact' | 'partial' | 'not_found';
export type ConcertMatchType = 'pulep' | 'artist_date' | 'none';
export type EventTypeGuess = 'concert' | 'festival' | 'other';
export type FetchMethod = 'http' | 'firecrawl';
export type RunStatus = 'running' | 'success' | 'partial' | 'error';
export type RunTrigger = 'cron' | 'manual';

export interface PriceZone {
  zone?: string;
  stage?: string;
  price?: string;
  service_fee?: string;
  total?: string;
  currency?: string;
  availability?: string;
}

export interface PriceData {
  type: 'zones' | 'image' | 'none';
  zones?: PriceZone[];
  image_url?: string;
}

export interface SaleStage {
  name?: string;
  starts_at?: string;
  ends_at?: string | null;
  requirement?: string | null;
}

export interface IngestionSource {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  country_code: string;
  is_active: boolean;
  fetch_method: FetchMethod;
  config: Record<string, unknown>;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StagedEvent {
  id: string;
  source_id: string;
  source_event_key: string;
  source_url: string;
  pulep_code: string | null;
  fingerprint: string;
  title: string;
  artist_name: string | null;
  venue_name: string | null;
  city_name: string | null;
  country_code: string;
  event_date: string | null;
  event_time: string | null;
  doors_time: string | null;
  event_type_guess: EventTypeGuess;
  relevance: 'high' | 'medium' | 'low' | null;
  confidence: number | null;
  ticket_url: string | null;
  image_url: string | null;
  promoter_name: string | null;
  price_data: PriceData | null;
  sale_stages: SaleStage[] | null;
  extraction_notes: string | null;
  raw: Record<string, unknown> | null;
  matched_artist_id: string | null;
  artist_match_confidence: MatchConfidence | null;
  matched_venue_id: string | null;
  venue_match_confidence: MatchConfidence | null;
  matched_promoter_id: string | null;
  promoter_match_confidence: MatchConfidence | null;
  matched_concert_id: string | null;
  matched_festival_id: string | null;
  concert_match_type: ConcertMatchType | null;
  status: StagedEventStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  promoted_concert_id: string | null;
  promoted_festival_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

/** Staged event enriched with the source name (joined client-side). */
export interface StagedEventWithSource extends StagedEvent {
  source_name?: string;
  source_slug?: string;
}

export interface StagedEventUpdate {
  status?: StagedEventStatus;
  matched_artist_id?: string | null;
  matched_venue_id?: string | null;
  matched_promoter_id?: string | null;
  matched_concert_id?: string | null;
  matched_festival_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  promoted_concert_id?: string | null;
  promoted_festival_id?: string | null;
  price_data?: PriceData | null;
}

export interface IngestionRun {
  id: string;
  source_id: string;
  triggered_by: RunTrigger;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  pages_discovered: number;
  pages_fetched: number;
  events_extracted: number;
  events_new: number;
  events_updated: number;
  events_skipped: number;
  error: string | null;
  meta: Record<string, unknown> | null;
}

export interface IngestionRunWithSource extends IngestionRun {
  source_name?: string;
}

export const STAGED_STATUS_LABELS: Record<StagedEventStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  discarded: 'Descartado',
  error: 'Error',
};

export const MATCH_LABELS: Record<MatchConfidence, string> = {
  exact: 'Exacto',
  partial: 'Parcial',
  not_found: 'Sin match',
};

export const EVENT_TYPE_GUESS_LABELS: Record<EventTypeGuess, string> = {
  concert: 'Concierto',
  festival: 'Festival',
  other: 'Otro',
};

export const RELEVANCE_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  running: 'En curso',
  success: 'Exitosa',
  partial: 'Parcial',
  error: 'Error',
};
