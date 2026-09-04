import { getDefaultImage } from '@/lib/imageOptimization';

/**
 * Fuentes de imagen que puede traer un concierto según la consulta que lo cargó:
 * `artist_image_url` la resuelve el cliente contra Spotify y `photo_url` es la foto
 * del artista en catálogo, que también sale de Spotify.
 */
interface ConcertImageSources {
    artist_image_url?: string | null;
    artists?: { photo_url?: string | null } | null;
    artist?: { photo_url?: string | null } | null;
}

/**
 * La portada de un concierto es siempre la foto del artista. `concerts.image_url`
 * guarda el afiche de la tiquetera en los eventos ingestados: lleva marca de agua de
 * la fuente y muchas tiqueteras bloquean el hotlink, así que el navegador termina
 * pintando el ícono de imagen rota.
 */
export const getConcertImage = (
    concert: ConcertImageSources,
    fallback: string = getDefaultImage('concert'),
): string =>
    concert.artist_image_url ||
    concert.artists?.photo_url ||
    concert.artist?.photo_url ||
    fallback;
