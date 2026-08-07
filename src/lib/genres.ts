/**
 * Etiquetas legibles en español para los géneros crudos de Spotify.
 * Spotify devuelve strings como "colombian pop", "sad sierreño" o "acid techno";
 * aquí los convertimos en etiquetas presentables. Para el filtrado curado se usa
 * la tabla `genre_mappings` (género Spotify → género principal).
 */

const GENRE_TRANSLATIONS: Record<string, string> = {
  'latin pop': 'Pop latino',
  'colombian pop': 'Pop colombiano',
  'mexican pop': 'Pop mexicano',
  'argentine pop': 'Pop argentino',
  'pop': 'Pop',
  'rock': 'Rock',
  'latin rock': 'Rock latino',
  'rock en espanol': 'Rock en español',
  'argentine rock': 'Rock argentino',
  'mexican rock': 'Rock mexicano',
  'colombian rock': 'Rock colombiano',
  'indie rock': 'Indie rock',
  'alternative rock': 'Rock alternativo',
  'reggaeton': 'Reggaetón',
  'reggaeton colombiano': 'Reggaetón colombiano',
  'trap latino': 'Trap latino',
  'urbano latino': 'Urbano latino',
  'latin hip hop': 'Hip hop latino',
  'hip hop': 'Hip hop',
  'rap': 'Rap',
  'salsa': 'Salsa',
  'cumbia': 'Cumbia',
  'vallenato': 'Vallenato',
  'bachata': 'Bachata',
  'merengue': 'Merengue',
  'corrido': 'Corridos',
  'corridos tumbados': 'Corridos tumbados',
  'sad sierreño': 'Sierreño',
  'sierreño': 'Sierreño',
  'banda': 'Banda',
  'norteño': 'Norteño',
  'regional mexican': 'Regional mexicano',
  'mariachi': 'Mariachi',
  'ranchera': 'Ranchera',
  'musica popular colombiana': 'Popular colombiana',
  'popular colombian music': 'Popular colombiana',
  'tropical': 'Tropical',
  'electronic': 'Electrónica',
  'edm': 'EDM',
  'house': 'House',
  'techno': 'Techno',
  'acid techno': 'Techno',
  'trance': 'Trance',
  'metal': 'Metal',
  'heavy metal': 'Metal',
  'punk': 'Punk',
  'ska': 'Ska',
  'reggae': 'Reggae',
  'folk': 'Folk',
  'indie': 'Indie',
  'r&b': 'R&B',
  'soul': 'Soul',
  'jazz': 'Jazz',
  'blues': 'Blues',
  'country': 'Country',
  'k-pop': 'K-pop',
  'boy band': 'Boy band',
  'funk': 'Funk',
  'disco': 'Disco',
  'bolero': 'Bolero',
  'tango': 'Tango',
  'flamenco': 'Flamenco',
  'axe': 'Axé',
  'sertanejo': 'Sertanejo',
  'mpb': 'MPB',
  'pagode': 'Pagode',
  'samba': 'Samba',
  'funk carioca': 'Funk carioca',
  'dembow': 'Dembow',
  'champeta': 'Champeta',
};

/** Capitaliza cada palabra como fallback para géneros sin traducción */
const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

/** Devuelve la etiqueta en español de un género crudo de Spotify */
export const formatGenreLabel = (genre: string): string => {
  const normalized = genre.trim().toLowerCase();
  return GENRE_TRANSLATIONS[normalized] ?? titleCase(normalized);
};

/** Formatea una lista de géneros crudos, deduplicando etiquetas resultantes */
export const formatGenreList = (genres: string[], max = 2): string => {
  const labels = [...new Set(genres.map(formatGenreLabel))];
  return labels.slice(0, max).join(', ');
};
