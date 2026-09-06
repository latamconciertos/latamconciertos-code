// Catálogos de la encuesta de audiencia. Los valores (no las etiquetas) deben coincidir con
// los whitelists de supabase/functions/poll-submit/index.ts.

export interface PollOption {
  value: string;
  label: string;
}

export const AGE_RANGES: PollOption[] = [
  { value: 'menos-18', label: 'Menos de 18' },
  { value: '18-24', label: '18 a 24' },
  { value: '25-34', label: '25 a 34' },
  { value: '35-44', label: '35 a 44' },
  { value: '45+', label: '45 o más' },
];

export const EDITIONS_ATTENDED: PollOption[] = [
  { value: 'primera', label: 'Es mi primera vez' },
  { value: '2-3', label: '2 o 3 ediciones' },
  { value: '4+', label: '4 o más' },
];

export const FAVORITE_GENRES: PollOption[] = [
  { value: 'rock', label: 'Rock' },
  { value: 'alternativo-indie', label: 'Alternativo / Indie' },
  { value: 'pop', label: 'Pop' },
  { value: 'urbano', label: 'Urbano' },
  { value: 'electronica', label: 'Electrónica' },
  { value: 'latino-tropical', label: 'Latino / Tropical' },
  { value: 'metal', label: 'Metal' },
  { value: 'otro', label: 'Otro' },
];

export const HEARD_FROM: PollOption[] = [
  { value: 'redes', label: 'Redes sociales' },
  { value: 'amigos', label: 'Amigos o familia' },
  { value: 'prensa', label: 'Prensa o radio' },
  { value: 'conciertos-latam', label: 'Conciertos Latam' },
  { value: 'otro', label: 'Otro' },
];

export const POLL_SOURCES: PollOption[] = [
  { value: 'web', label: 'Web' },
  { value: 'stand', label: 'Stand' },
  { value: 'qr', label: 'QR' },
];

const ALL_OPTIONS: Record<string, PollOption[]> = {
  age_range: AGE_RANGES,
  editions_attended: EDITIONS_ATTENDED,
  favorite_genre: FAVORITE_GENRES,
  heard_from: HEARD_FROM,
  source: POLL_SOURCES,
};

export const DEMOGRAPHIC_LABELS: Record<string, string> = {
  age_range: 'Rango de edad',
  editions_attended: 'Ediciones asistidas',
  attended_day: 'Día de asistencia',
  favorite_genre: 'Género favorito',
  heard_from: 'Cómo se enteró',
  source: 'Canal de captura',
};

export const pollOptionLabel = (field: string, value: string): string =>
  ALL_OPTIONS[field]?.find((o) => o.value === value)?.label ?? value;

export const positionLabel = (position: number): string => `${position}º`;

/** Puntos por posición: en un top 3, el 1º vale 3, el 2º vale 2 y el 3º vale 1. */
export const pointsForPosition = (position: number, maxChoices: number): number =>
  Math.max(maxChoices - position + 1, 0);

const DEVICE_TOKEN_KEY = 'cl:poll-device';

/** Identificador anónimo y estable por navegador para evitar respuestas duplicadas. */
export const getPollDeviceToken = (): string => {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
};

const answeredKey = (slug: string) => `cl:poll-answered:${slug}`;

export const markPollAnswered = (slug: string): void => {
  try {
    localStorage.setItem(answeredKey(slug), new Date().toISOString());
  } catch {
    // storage bloqueado: la unicidad la garantiza el servidor
  }
};

export const hasAnsweredPoll = (slug: string): boolean => {
  try {
    return !!localStorage.getItem(answeredKey(slug));
  } catch {
    return false;
  }
};

export const pollPublicUrl = (slug: string, source?: string): string => {
  const base = `${window.location.origin}/encuestas/${slug}`;
  return source ? `${base}?src=${source}` : base;
};

export const pollResultsUrl = (token: string): string =>
  `${window.location.origin}/encuestas/resultados/${token}`;
