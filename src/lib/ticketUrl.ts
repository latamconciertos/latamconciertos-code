/**
 * Añade parámetros de atribución a las URLs de ticketeras.
 * Permite medir el tráfico referido (y negociar afiliación con las ticketeras).
 */
export const withTicketTracking = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', 'conciertoslatam');
      parsed.searchParams.set('utm_medium', 'referral');
    }
    return parsed.toString();
  } catch {
    return url;
  }
};
