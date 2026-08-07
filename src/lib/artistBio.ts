import { formatGenreLabel } from '@/lib/genres';

/**
 * Algunas bios guardadas en la base de datos son un dump crudo de la API de
 * Spotify ("X es un artista de colombian pop, latin pop con 13.521.082
 * seguidores. Con una popularidad de 84/100"). Google lo lee como contenido
 * autogenerado sin valor. Este helper detecta ese patrón y lo reemplaza por
 * una bio natural construida desde los datos estructurados del artista.
 */

const DUMP_PATTERN = /(es un artista de .+ con [\d.,]+ seguidores|con una popularidad de \d+\s*\/\s*100|popularity of \d+)/i;

/** Convierte "13.521.082" en una frase legible como "13,5 millones de seguidores" */
const formatFollowersPhrase = (raw: string): string | null => {
  const n = parseInt(raw.replace(/[.,\s]/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded = millions >= 10 ? Math.round(millions).toString() : millions.toFixed(1).replace('.', ',');
    return `${rounded} millones de seguidores`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} mil seguidores`;
  return `${n} seguidores`;
};

interface HumanizeBioOptions {
  bio?: string | null;
  name: string;
  genres?: string[] | null;
}

/**
 * Devuelve la bio original si es legítima, una versión natural si era un dump
 * de API, o null si no hay bio.
 */
export const humanizeArtistBio = ({ bio, name, genres }: HumanizeBioOptions): string | null => {
  if (!bio) return null;
  if (!DUMP_PATTERN.test(bio)) return bio;

  const genreLabels = [...new Set((genres || []).map(formatGenreLabel))].slice(0, 2);
  const followersMatch = bio.match(/([\d.,]+)\s+seguidores/i);
  const followersPhrase = followersMatch ? formatFollowersPhrase(followersMatch[1]) : null;

  const parts: string[] = [];
  parts.push(
    genreLabels.length > 0
      ? `${name} es un referente de ${genreLabels.join(' y ').toLowerCase()} en la escena musical latinoamericana.`
      : `${name} es parte de la escena de la música en vivo en América Latina.`
  );
  if (followersPhrase) {
    parts.push(`Reúne a más de ${followersPhrase} en Spotify.`);
  }
  parts.push('Aquí encuentras sus próximos conciertos, setlists, canciones más escuchadas y noticias.');

  return parts.join(' ');
};
