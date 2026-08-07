export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

// Solo cargamos AdSense en producción y cuando hay client ID configurado en Vercel.
export const adSenseEnabled = Boolean(ADSENSE_CLIENT) && import.meta.env.PROD;

/**
 * IDs de las unidades de anuncio creadas en el panel de AdSense
 * (Anuncios → Por unidad de anuncio). Mientras un slot esté vacío,
 * esa unidad no se renderiza — permite desplegar antes de la aprobación.
 */
export const AD_SLOTS = {
  display: '',
  inArticle: '',
};

let loaded = false;

export function loadAdSense() {
  if (!adSenseEnabled || loaded) return;
  // El panel admin no debe mostrar anuncios ni contar impresiones.
  if (window.location.pathname.startsWith('/admin')) return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}
