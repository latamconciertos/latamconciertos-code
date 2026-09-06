/**
 * Poll Entity Types
 *
 * Encuestas de festival (top-N de artistas + perfil anónimo de audiencia).
 * Los tipos generados de Supabase aún no incluyen estas tablas, por eso se declaran a mano.
 */

export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  question: string;
  festival_id: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_choices: number;
  ask_demographics: boolean;
  day_options: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollWithRelations extends Poll {
  festivals?: { id: string; name: string; slug: string; start_date: string } | null;
  poll_share_links?: { token: string } | null;
  response_count?: number;
}

export interface PollInsert {
  slug: string;
  title: string;
  description?: string | null;
  question?: string;
  festival_id?: string | null;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  max_choices?: number;
  ask_demographics?: boolean;
  day_options?: string[];
}

export type PollUpdate = Partial<PollInsert>;

export interface PollChoice {
  position: number;
  name: string;
  spotify_id: string | null;
  image_url: string | null;
}

export interface PollDemographics {
  age_range?: string | null;
  origin_city?: string | null;
  editions_attended?: string | null;
  attended_day?: string | null;
  favorite_genre?: string | null;
  heard_from?: string | null;
}

export interface PollSubmission {
  poll_slug: string;
  device_token: string;
  artists: Array<{ spotify_id: string | null; name: string; position: number }>;
  demographics?: PollDemographics;
  source?: string;
}

export interface PollBreakdownItem {
  value: string;
  count: number;
}

export interface PollArtistResult {
  artist_key: string;
  artist_name: string;
  artist_slug: string | null;
  photo_url: string | null;
  mentions: number;
  points: number;
  p1: number;
  p2: number;
  p3: number;
  p_other: number;
  avg_position: number;
}

export interface PollResults {
  poll: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    question: string;
    max_choices: number;
    is_active: boolean;
    day_options: string[];
    festival: { name: string; slug: string; start_date: string } | null;
  };
  totals: {
    responses: number;
    first_at: string | null;
    last_at: string | null;
    logged_in: number;
  };
  unique_artists: number;
  artists: PollArtistResult[];
  by_day: Array<{ day: string; count: number }>;
  demographics: Record<string, PollBreakdownItem[]>;
  cities: PollBreakdownItem[];
  artist_by_age: Array<{ artist_key: string; artist_name: string; age_range: string; count: number }>;
}
