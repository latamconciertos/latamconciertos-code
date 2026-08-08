/**
 * Chunk Errors - Recuperación ante chunks obsoletos tras un deploy
 *
 * Cada deploy cambia los nombres hasheados de los chunks. Los clientes que
 * siguen ejecutando la versión anterior (sobre todo la PWA, cuyo service
 * worker purga el precache viejo al activarse la versión nueva) fallan al
 * hacer import() dinámico de una ruta lazy. Recargar la página trae el
 * index.html y los chunks vigentes.
 */

const RELOAD_FLAG_KEY = 'chunk-error-reload-at';
const RELOAD_WINDOW_MS = 60_000;

const CHUNK_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERN.test(message);
}

/**
 * Recarga la página para obtener los assets nuevos. Devuelve false si ya se
 * recargó hace menos de un minuto (evita loops infinitos cuando el chunk
 * sigue fallando, p. ej. sin conexión) o si sessionStorage no está disponible.
 */
export function reloadForStaleChunk(): boolean {
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_FLAG_KEY)) || 0;
    if (Date.now() - lastReload < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
