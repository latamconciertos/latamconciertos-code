# SEO, indexación y modelo de negocio — Julio 2026

Registro de la intervención de fontanería SEO tras la auditoría externa, y hoja de ruta de negocio.

## Qué se arregló (código)

### 1. Canonical global al home (el bug raíz)
`index.html` tenía `<link rel="canonical" href="https://www.conciertoslatam.com/" />` **estático**, que se servía en todas las rutas y le decía a Google que todo el sitio era duplicado del home. Se eliminó junto con los `og:*` y `description` estáticos; ahora cada página inyecta sus propios metas vía `<SEO />` (react-helmet-async), sin duplicados. **No volver a añadir metas estáticos en `index.html`.**

### 2. Sitemaps en dominio propio
`robots.txt` y `sitemap.xml` apuntaban a `ybvfsxsapsshhtqpvukr.supabase.co` (dominio ajeno que Google ignora), e incluían un sitemap de promotores **que no existe**. Ahora `vercel.json` hace proxy:

| URL pública | Función |
|---|---|
| `/sitemaps/concerts.xml` | generate-concerts-sitemap |
| `/sitemaps/artists.xml` | generate-artists-sitemap |
| `/sitemaps/blog.xml` | generate-blog-sitemap |
| `/sitemaps/news.xml` | generate-news-sitemap |
| `/sitemaps/festivals.xml` | generate-festivals-sitemap |
| `/sitemaps/countries.xml` | generate-countries-sitemap |

### 3. Tarjetas como enlaces reales
Las tarjetas de conciertos, artistas y festivales eran `<div onClick>` / `<button onClick>`: Google no tenía por dónde llegar a los 228 artistas ni a los 164 conciertos. Ahora:
- `ConcertCard`: patrón *stretched link* — `<Link>` real a `/concerts/:slug`.
- `Artists`: tarjetas `<Link>` y paginación con `href="/artists?page=N"` crawleable (página en la URL).
- `FestivalCard`: *stretched link* a `/festivals/:slug`.
- `ModernConcertCard` (home): título enlazado al detalle.

### 4. URL única por concierto
`/concerts?id=slug` (diálogo) duplicaba a `/concerts/:slug` (página). El listado ahora navega a la página de detalle; `?id=` redirige con `<Navigate replace>` para no romper enlaces viejos.

### 5. Prerender para bots — `supabase/functions/prerender`
El HTML crudo de la SPA estaba vacío (fatal para crawlers de IA y lento para Google). `vercel.json` detecta bots por user-agent (Googlebot, Bingbot, GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Amazonbot, Applebot, redes sociales…) y los reescribe a la edge function `prerender`, que devuelve HTML completo por ruta: title/description únicos, canonical propio, Open Graph, JSON-LD (MusicEvent, MusicGroup, NewsArticle, ItemList) y contenido con enlaces internos. Cubre: home, /concerts(+detalle), /artists(+detalle), /blog(+artículo), /festivals(+detalle), /conciertos/:pais, /setlists, /setlist/..., /venues(+detalle), /promoters. Los usuarios siguen recibiendo la SPA (contenido equivalente → no es cloaking).

### 6. Thin content
- Páginas de país sin eventos → `noindex, follow` automático (vuelven a indexarse solas cuando tengan datos).
- `/festivals` vacío → `noindex` + se ocultó el "0+ FESTIVALES".
- Corregido el voseo ("Explorá", "querés", "podés", "encontrás", "tenés") y el doble punto ("América Latina..") de las plantillas de país y About.

### 7. UX / conversión
- Se eliminó el popup de registro auto-abierto (intersticial intrusivo penalizado en móvil).
- Hero del home: "Todos los conciertos de Latinoamérica" con CTA primario **Ver próximos conciertos** (antes: "La comunidad de Conciertos" + "Únete ahora").
- Home reordenado: conciertos primero, luego noticias, artistas, festivales.
- "0 miembros en la comunidad" ya no se muestra (solo se muestra el conteo desde 10 miembros).
- Bios dump de Spotify ("X es un artista de colombian pop con 13.521.082 seguidores…") se humanizan en render (`src/lib/artistBio.ts`).
- Filtros de género de /artists ahora usan los géneros principales curados (`genre_mappings`), no los 60+ strings crudos; etiquetas en español (`src/lib/genres.ts`).

### 8. Botones de compra = enlaces medibles
Todos los "Comprar/Ver Entradas" pasaron de `window.open` a `<a href target="_blank" rel="sponsored noopener noreferrer">` con `utm_source=conciertoslatam&utm_medium=referral` (`src/lib/ticketUrl.ts`). Esto los hace visibles para Google y **atribuibles ante las ticketeras** (base para negociar afiliación).

## Pasos de despliegue pendientes (manuales)

1. `npx supabase functions deploy prerender --no-verify-jwt`
2. Deploy a Vercel (los rewrites de `vercel.json` aplican con el próximo deploy).
3. Verificar como bot: `curl -A "Googlebot" https://www.conciertoslatam.com/concerts/<slug>` → debe devolver HTML con contenido.
4. Search Console: reenviar `sitemap.xml` y solicitar indexación de las URLs clave (home, /concerts, top artistas, notas recientes).
5. Opcional: eliminar de GSC los sitemaps viejos de supabase.co.

## Modelo de negocio — dónde está el dinero (resumen de la revisión)

1. **Afiliación con ticketeras** (TuBoleta, Taquilla Live, Passline, Puntoticket, Ticketek, Boletia, Teleticket, Eventbrite). Los enlaces ya salen con UTM: primero medir cuántos clics se envían, luego negociar comisión con datos en la mano.
2. **Contenido pagado de promotoras** — ya hay 24 promotoras mapeadas; ofrecer fichas destacadas, cobertura editorial y posicionamiento del evento.
3. **Newsletter/WhatsApp semanal por ciudad** — retención sin app, y activo comercial propio (audiencia direccionable).
4. **Foso defensivo: setlists en español** — nadie lo cubre bien en la región; convertir la captura en formulario público "envía el setlist de anoche" con moderación.

## Foco recomendado

- **Ganar Colombia antes que LATAM**: ser inobjetablemente el mejor sitio de conciertos de Colombia (todas las ciudades, venues, setlists, preventas) este año; abrir México/Chile después con autoridad de dominio.
- **Motor de respuestas, no red social**: la página debe resolver fecha, precio, dónde comprar, cómo llegar, qué van a tocar. La comunidad crece encima de ese tráfico.
- **Cambiar la fuente de datos**: scrapers/APIs (Ticketmaster Discovery, Bandsintown, Songkick + ticketeras locales) con cola de aprobación en el admin, para pasar de capturista a editor. Es el siguiente proyecto técnico grande.
