# Google AdSense — Guía de configuración

Estado: **código listo y desplegable**. Los anuncios NO se muestran hasta que completes los pasos de esta guía (crear cuenta, aprobar el sitio y pegar los IDs). Mientras tanto todo queda invisible — puedes desplegar a producción sin riesgo.

## Cómo quedó implementado

| Pieza | Archivo | Qué hace |
|---|---|---|
| Loader | `src/lib/adsense.ts` | Inyecta el script de AdSense solo en producción, solo si `VITE_ADSENSE_CLIENT` está configurada, y nunca en `/admin` |
| Componente | `src/components/ads/AdSenseUnit.tsx` | Unidad de anuncio responsive; no renderiza nada si falta el slot ID |
| Fallback | `src/components/AdSpace.tsx` | Si no hay anuncio directo vendido (tabla `ad_items`), rellena el espacio con AdSense. **Tus ventas directas siempre tienen prioridad** |
| Ubicaciones | Home (tras noticias), `/concerts` (tras paginación), detalle de concierto (bajo el contenido), artículos del blog (fin del artículo, formato in-article) | Páginas de mayor tráfico |
| Verificación | `public/ads.txt` | Método de verificación del sitio recomendado para SPAs |
| Privacidad | `src/pages/PrivacyPolicy.tsx` | Divulgación de cookies publicitarias de Google (requisito de AdSense) |

## Paso 1 — Crear la cuenta de AdSense

1. Ve a [adsense.google.com](https://adsense.google.com) y regístrate con la cuenta de Google del proyecto.
2. Agrega el sitio: `www.conciertoslatam.com`.
3. Completa los datos de pago (país, dirección). AdSense paga por transferencia cuando acumulas 100 USD.
4. Copia tu **Publisher ID** (formato `pub-XXXXXXXXXXXXXXXX`, en Cuenta → Información).

## Paso 2 — Verificar el sitio con ads.txt

Es el método más fiable para una SPA de React (no depende de que el crawler ejecute JavaScript):

1. Abre `public/ads.txt`, reemplaza `pub-XXXXXXXXXXXXXXXX` con tu Publisher ID real y descomenta la línea (borra el `# `). Debe quedar exactamente:
   ```
   google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
   ```
2. Haz deploy. Verifica que `https://www.conciertoslatam.com/ads.txt` responde con esa línea.
3. En AdSense, en la pantalla de verificación del sitio, elige el método **"Fragmento de ads.txt"** y pulsa verificar.

## Paso 3 — Configurar la variable de entorno

1. En Vercel → Settings → Environment Variables agrega:
   ```
   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   ```
   (nota el prefijo `ca-` que se antepone al Publisher ID).
2. Agrega la misma variable en tu `.env` local si quieres probar con `npm run build && npm run preview`.
3. Redeploy. El script de AdSense empezará a cargarse en producción — necesario para que Google revise el sitio.

## Paso 4 — Solicitar la revisión y esperar aprobación

En AdSense pulsa **"Solicitar revisión"**. Tarda entre 2 días y 4 semanas. Lo que Google evalúa:

- **Contenido original y suficiente** — el blog/noticias es tu mayor activo aquí. Idealmente 20+ artículos propios con texto sustancial. Las páginas de datos (conciertos, setlists) suman, pero el contenido editorial es lo que aprueba cuentas.
- **Navegación clara y sitio funcional** — ya la tienes.
- **Política de privacidad** — ya actualizada con la divulgación de cookies de Google (`/privacy`).
- **Tráfico** — no hay mínimo oficial, pero con menos de ~100 visitas/día las probabilidades bajan y los ingresos serían mínimos de todas formas.

Si te rechazan: leen el motivo, corriges (casi siempre es "contenido de bajo valor" → publicar más artículos originales) y vuelves a solicitar. No hay límite de intentos.

## Paso 5 — Crear las unidades de anuncio y pegar los slot IDs

Una vez aprobado, en AdSense → Anuncios → **Por unidad de anuncio** crea 2 unidades:

1. **"Display responsive"** (tipo: Anuncio de display, responsive) → copia su ID numérico (`data-ad-slot`).
2. **"In-article blog"** (tipo: Anuncio in-article) → copia su ID.

Pega ambos en `src/lib/adsense.ts`:

```ts
export const AD_SLOTS = {
  display: '1234567890',   // unidad Display responsive
  inArticle: '0987654321', // unidad In-article
};
```

Deploy y listo: los anuncios empiezan a aparecer (pueden tardar unos minutos-horas en servirse las primeras impresiones).

## Recomendaciones

- **No actives "Anuncios automáticos" (Auto ads)** en el panel de AdSense al principio: inyectan anuncios en cualquier parte (incluidos anclados y pantalla completa), dañan la experiencia y el CLS/Core Web Vitals que has trabajado para SEO. Con las unidades manuales controlas exactamente dónde aparece cada anuncio. Si más adelante quieres probarlos, actívalos solo con formato "en página" y baja carga de anuncios.
- **Mensaje de consentimiento (GDPR/CMP):** AdSense te pedirá configurar un mensaje de consentimiento para visitantes del Espacio Económico Europeo y Reino Unido. Configúralo desde AdSense → Privacidad y mensajería (usa el CMP de Google, no requiere código). Para tráfico LATAM no se muestra.
- **Expectativas realistas:** en LATAM el RPM de display suele estar entre 0,3 y 2 USD por cada 1.000 páginas vistas. Con 100.000 páginas vistas/mes serían ~30–200 USD/mes. AdSense escala con el tráfico: la palanca real sigue siendo el SEO y el contenido.
- **Prioriza la venta directa:** el fallback está montado para que cualquier banner vendido desde el admin (tabla `ad_items`) desplace al de AdSense en esa posición. Un banner directo a un promotor/ticketera vale 10–50× más que el relleno de AdSense — la página `/publicidad` es tu mejor argumento comercial.
- **No hagas clic en tus propios anuncios** ni pidas clics: es la causa #1 de baneo permanente de cuentas nuevas.
