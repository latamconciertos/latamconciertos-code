// Prerender para bots (dynamic rendering).
//
// Vercel reescribe las peticiones de crawlers (Googlebot, Bingbot, GPTBot,
// PerplexityBot, ClaudeBot, redes sociales, etc.) hacia esta función, que
// devuelve HTML completo: title/description únicos, canonical propio, Open
// Graph, JSON-LD y contenido visible con enlaces <a href> reales. Los usuarios
// normales siguen recibiendo la SPA. El contenido es equivalente al que ve el
// usuario, por lo que no constituye cloaking.
//
// Deploy: npx supabase functions deploy prerender --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SITE = 'https://www.conciertoslatam.com';
const SITE_NAME = 'Conciertos Latam';
const DEFAULT_IMAGE =
  'https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo%20Principal%20transparente.png';

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDateEs = (iso: string | null): string => {
  if (!iso) return 'Fecha por confirmar';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Las consultas fallidas antes se ignoraban ({ data } sin error) y el bot recibía
// "0 conciertos" o 404 por cada ficha. Ahora cualquier error aborta con 503.
// deno-lint-ignore no-explicit-any
const q = async (
  promise: PromiseLike<{ data: any; error: { message: string } | null }>,
  label: string,
  // deno-lint-ignore no-explicit-any
): Promise<any> => {
  const { data, error } = await promise;
  if (error) {
    console.error(`[prerender] ${label}:`, error.message);
    throw new Error(`${label}: ${error.message}`);
  }
  return data;
};

// Slugs públicos de /conciertos/:pais → nombre e ISO (la tabla countries no tiene slug)
const COUNTRIES: Record<string, { name: string; iso: string }> = {
  colombia: { name: 'Colombia', iso: 'CO' },
  mexico: { name: 'México', iso: 'MX' },
  argentina: { name: 'Argentina', iso: 'AR' },
  chile: { name: 'Chile', iso: 'CL' },
  peru: { name: 'Perú', iso: 'PE' },
  brasil: { name: 'Brasil', iso: 'BR' },
  ecuador: { name: 'Ecuador', iso: 'EC' },
  venezuela: { name: 'Venezuela', iso: 'VE' },
  'costa-rica': { name: 'Costa Rica', iso: 'CR' },
  panama: { name: 'Panamá', iso: 'PA' },
  uruguay: { name: 'Uruguay', iso: 'UY' },
  paraguay: { name: 'Paraguay', iso: 'PY' },
  bolivia: { name: 'Bolivia', iso: 'BO' },
  guatemala: { name: 'Guatemala', iso: 'GT' },
  'republica-dominicana': { name: 'República Dominicana', iso: 'DO' },
  'puerto-rico': { name: 'Puerto Rico', iso: 'PR' },
  'el-salvador': { name: 'El Salvador', iso: 'SV' },
  honduras: { name: 'Honduras', iso: 'HN' },
  nicaragua: { name: 'Nicaragua', iso: 'NI' },
};

interface PageData {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  ogType?: string;
  jsonLd?: object[];
  body: string;
  noindex?: boolean;
  status?: number;
}

const NAV = `
<nav>
  <a href="${SITE}/">Inicio</a> ·
  <a href="${SITE}/concerts">Conciertos</a> ·
  <a href="${SITE}/festivals">Festivales</a> ·
  <a href="${SITE}/artists">Artistas</a> ·
  <a href="${SITE}/setlists">Setlists</a> ·
  <a href="${SITE}/blog">Noticias</a> ·
  <a href="${SITE}/venues">Venues</a> ·
  <a href="${SITE}/promoters">Promotores</a>
</nav>`;

const COUNTRY_LINKS = `
<section>
  <h2>Conciertos por país</h2>
  <ul>
    <li><a href="${SITE}/conciertos/colombia">Conciertos en Colombia</a></li>
    <li><a href="${SITE}/conciertos/mexico">Conciertos en México</a></li>
    <li><a href="${SITE}/conciertos/argentina">Conciertos en Argentina</a></li>
    <li><a href="${SITE}/conciertos/chile">Conciertos en Chile</a></li>
    <li><a href="${SITE}/conciertos/peru">Conciertos en Perú</a></li>
    <li><a href="${SITE}/conciertos/ecuador">Conciertos en Ecuador</a></li>
  </ul>
</section>`;

const renderHtml = (page: PageData): Response => {
  const url = `${SITE}${page.path}`;
  const image = page.image || DEFAULT_IMAGE;
  const jsonLdScripts = (page.jsonLd || [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="es_419">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@conciertoslatam">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${esc(image)}">
${jsonLdScripts}
</head>
<body>
<header>${NAV}</header>
<main>
${page.body}
</main>
<footer>
${COUNTRY_LINKS}
<p><a href="${SITE}/about">Acerca de ${SITE_NAME}</a> · <a href="${SITE}/editorial-guidelines">Lineamientos editoriales</a></p>
</footer>
</body>
</html>`;

  return new Response(html, {
    status: page.status || 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      'X-Prerender': 'conciertos-latam',
    },
  });
};

const notFound = (path: string): Response =>
  renderHtml({
    title: `Página no encontrada | ${SITE_NAME}`,
    description: 'La página que buscas no existe.',
    path,
    noindex: true,
    status: 404,
    body: `<h1>Página no encontrada</h1><p>Explora los <a href="${SITE}/concerts">próximos conciertos en América Latina</a>.</p>`,
  });

const concertLine = (c: any): string => {
  const city = c.venues?.cities?.name;
  const country = c.venues?.cities?.countries?.name;
  const where = [c.venues?.name, city, country].filter(Boolean).join(', ');
  return `<li>
    <a href="${SITE}/concerts/${esc(c.slug)}">${esc(c.title)}</a>
    — ${esc(formatDateEs(c.date))}${where ? ` — ${esc(where)}` : ''}
    ${c.artists?.slug ? `— <a href="${SITE}/artists/${esc(c.artists.slug)}">${esc(c.artists.name)}</a>` : ''}
  </li>`;
};

const musicEventLd = (c: any): object => ({
  '@context': 'https://schema.org',
  '@type': 'MusicEvent',
  name: c.title,
  startDate: c.date || undefined,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  url: `${SITE}/concerts/${c.slug}`,
  image: c.artists?.photo_url || undefined,
  description: c.description || `Concierto de ${c.artists?.name || 'música en vivo'}`,
  location: c.venues
    ? {
        '@type': 'MusicVenue',
        name: c.venues.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: c.venues.cities?.name || '',
          addressCountry: c.venues.cities?.countries?.name || '',
        },
      }
    : undefined,
  performer: c.artists ? { '@type': 'MusicGroup', name: c.artists.name, url: `${SITE}/artists/${c.artists.slug}` } : undefined,
  organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE },
  offers: c.ticket_url
    ? { '@type': 'Offer', url: c.ticket_url, availability: 'https://schema.org/InStock', validFrom: c.date }
    : undefined,
});

const CONCERT_SELECT = `slug, title, date, description, ticket_url, image_url, event_type,
  artists:artist_id (name, slug, photo_url),
  venues:venue_id (name, slug, cities:city_id (name, slug, countries:country_id (name, iso_code)))`;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Path después de /prerender: /prerender/concerts/slug → /concerts/slug
  const path = url.pathname.replace(/^\/(functions\/v1\/)?prerender/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];

  try {
    // ============ /concerts (listado) ============
    if (segments[0] === 'concerts' && segments.length === 1) {
      const concerts = await q(supabase
        .from('concerts')
        .select(CONCERT_SELECT)
        .gte('date', today)
        .not('slug', 'is', null)
        .order('date', { ascending: true })
        .limit(200), 'concerts');

      const list = concerts || [];
      return renderHtml({
        title: `Conciertos en América Latina 2026: calendario y entradas | ${SITE_NAME}`,
        description: `Calendario de ${list.length} conciertos próximos en América Latina. Fechas, venues, artistas y enlaces oficiales de entradas.`,
        path: '/concerts',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Próximos conciertos en América Latina',
            numberOfItems: list.length,
            itemListElement: list.slice(0, 50).map((c: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${SITE}/concerts/${c.slug}`,
            })),
          },
        ],
        body: `<h1>Conciertos en América Latina</h1>
<p>${list.length} conciertos próximos con fechas, venues y enlaces oficiales de venta de entradas.</p>
<ul>${list.map(concertLine).join('\n')}</ul>`,
      });
    }

    // ============ /concerts/:slug (detalle) ============
    if (segments[0] === 'concerts' && segments.length === 2) {
      const c = await q(supabase
        .from('concerts')
        .select(`id, ${CONCERT_SELECT}, ticket_prices_html, promoters:promoter_id (name)`)
        .eq('slug', segments[1])
        .maybeSingle(), 'c');

      if (!c) return notFound(path);

      const setlist = await q(supabase
        .from('setlist_songs')
        .select('song_name, position')
        .eq('concert_id', c.id)
        .eq('status', 'approved')
        .order('position', { ascending: true }), 'setlist');

      const city = c.venues?.cities?.name;
      const country = c.venues?.cities?.countries?.name;
      const where = [c.venues?.name, city, country].filter(Boolean).join(', ');
      const description = (c.description ||
        `${c.title}: ${formatDateEs(c.date)}${where ? ` en ${where}` : ''}. Entradas, precios, setlist y toda la información.`).slice(0, 160);

      return renderHtml({
        title: `${c.title}${city ? ` en ${city}` : ''}: fecha, entradas y setlist | ${SITE_NAME}`,
        description,
        path: `/concerts/${c.slug}`,
        image: c.artists?.photo_url ?? undefined,
        jsonLd: [musicEventLd(c)],
        body: `<h1>${esc(c.title)}</h1>
${c.artists ? `<p>Artista: <a href="${SITE}/artists/${esc(c.artists.slug)}">${esc(c.artists.name)}</a></p>` : ''}
<p>Fecha: ${esc(formatDateEs(c.date))}</p>
${where ? `<p>Lugar: ${esc(where)}</p>` : ''}
${c.promoters?.name ? `<p>Promotor: ${esc(c.promoters.name)}</p>` : ''}
${c.description ? `<section><h2>Acerca del evento</h2><p>${esc(c.description)}</p></section>` : ''}
${c.ticket_prices_html ? `<section><h2>Precios de entradas</h2>${c.ticket_prices_html}</section>` : ''}
${c.ticket_url ? `<p><a href="${esc(c.ticket_url)}" rel="sponsored noopener">Comprar entradas en el sitio oficial</a></p>` : ''}
${setlist && setlist.length > 0 ? `<section><h2>Setlist</h2><ol>${setlist.map((s: any) => `<li>${esc(s.song_name)}</li>`).join('')}</ol></section>` : ''}
<p><a href="${SITE}/concerts">Ver todos los conciertos</a></p>`,
      });
    }

    // ============ /artists (listado) ============
    if (segments[0] === 'artists' && segments.length === 1) {
      const artists = await q(supabase
        .from('artists')
        .select('name, slug, genres')
        .not('slug', 'is', null)
        .order('name', { ascending: true })
        .limit(500), 'artists');

      const list = artists || [];
      return renderHtml({
        title: `Artistas latinos: conciertos, biografías y setlists | ${SITE_NAME}`,
        description: `Directorio de ${list.length} artistas con conciertos en América Latina: biografías, fechas de shows, setlists y noticias.`,
        path: '/artists',
        body: `<h1>Artistas</h1>
<p>Directorio de ${list.length} artistas de música latina e internacional con presencia en LATAM.</p>
<ul>${list.map((a: any) => `<li><a href="${SITE}/artists/${esc(a.slug)}">${esc(a.name)}</a>${Array.isArray(a.genres) && a.genres.length ? ` — ${esc(a.genres.slice(0, 2).join(', '))}` : ''}</li>`).join('\n')}</ul>`,
      });
    }

    // ============ /artists/:slug (detalle) ============
    if (segments[0] === 'artists' && segments.length === 2) {
      const a = await q(supabase
        .from('artists')
        .select('id, name, slug, bio, photo_url, genres, social_links')
        .eq('slug', segments[1])
        .maybeSingle(), 'a');

      if (!a) return notFound(path);

      const concerts = await q(supabase
        .from('concerts')
        .select(CONCERT_SELECT)
        .eq('artist_id', a.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(50), 'concerts');

      const upcoming = concerts || [];
      const sameAs = a.social_links && typeof a.social_links === 'object'
        ? Object.values(a.social_links).filter((v: unknown): v is string => typeof v === 'string' && v.startsWith('http'))
        : [];

      const description = (
        upcoming.length > 0
          ? `${a.name}: ${upcoming.length} concierto${upcoming.length !== 1 ? 's' : ''} próximo${upcoming.length !== 1 ? 's' : ''} en América Latina. Fechas, entradas, setlists y noticias.`
          : `${a.name}: conciertos en América Latina, setlists, canciones y noticias en ${SITE_NAME}.`
      ).slice(0, 160);

      return renderHtml({
        title: `${a.name}: conciertos ${new Date().getFullYear()}, entradas y setlists | ${SITE_NAME}`,
        description,
        path: `/artists/${a.slug}`,
        image: a.photo_url,
        ogType: 'profile',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'MusicGroup',
            name: a.name,
            url: `${SITE}/artists/${a.slug}`,
            image: a.photo_url || undefined,
            genre: Array.isArray(a.genres) && a.genres.length ? a.genres : undefined,
            ...(sameAs.length ? { sameAs } : {}),
            ...(upcoming.length ? { event: upcoming.map(musicEventLd) } : {}),
          },
        ],
        body: `<h1>${esc(a.name)}</h1>
${a.bio ? `<p>${esc(a.bio)}</p>` : ''}
${upcoming.length > 0
  ? `<section><h2>Próximos conciertos de ${esc(a.name)}</h2><ul>${upcoming.map(concertLine).join('\n')}</ul></section>`
  : `<p>No hay conciertos próximos confirmados de ${esc(a.name)} en este momento.</p>`}
<p><a href="${SITE}/artists">Ver todos los artistas</a> · <a href="${SITE}/concerts">Ver todos los conciertos</a></p>`,
      });
    }

    // ============ /blog (listado) ============
    if (segments[0] === 'blog' && segments.length === 1) {
      const articles = await q(supabase
        .from('news_articles')
        .select('title, slug, meta_description, published_at, featured_image')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100), 'articles');

      const list = articles || [];
      return renderHtml({
        title: `Noticias de conciertos y música en vivo en LATAM | ${SITE_NAME}`,
        description: 'Noticias, guías de conciertos, preventas, precios de boletas y crónicas de festivales en América Latina.',
        path: '/blog',
        body: `<h1>Noticias</h1>
<ul>${list.map((n: any) => `<li><a href="${SITE}/blog/${esc(n.slug)}">${esc(n.title)}</a>${n.published_at ? ` — ${esc(new Date(n.published_at).toLocaleDateString('es-CO'))}` : ''}</li>`).join('\n')}</ul>`,
      });
    }

    // ============ /blog/:slug (artículo) ============
    if (segments[0] === 'blog' && segments.length === 2) {
      const n = await q(supabase
        .from('news_articles')
        .select('title, slug, meta_description, content, featured_image, published_at, updated_at')
        .eq('slug', segments[1])
        .eq('status', 'published')
        .maybeSingle(), 'n');

      if (!n) return notFound(path);

      return renderHtml({
        title: `${n.title} | ${SITE_NAME}`,
        description: (n.meta_description || n.title).slice(0, 160),
        path: `/blog/${n.slug}`,
        image: n.featured_image,
        ogType: 'article',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: n.title,
            description: n.meta_description || undefined,
            image: n.featured_image || undefined,
            datePublished: n.published_at,
            dateModified: n.updated_at || n.published_at,
            mainEntityOfPage: `${SITE}/blog/${n.slug}`,
            author: { '@type': 'Organization', name: SITE_NAME },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE },
            },
          },
        ],
        body: `<article>
<h1>${esc(n.title)}</h1>
${n.published_at ? `<p><time datetime="${esc(n.published_at)}">${esc(new Date(n.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))}</time></p>` : ''}
${n.featured_image ? `<img src="${esc(n.featured_image)}" alt="${esc(n.title)}">` : ''}
${n.content || ''}
</article>
<p><a href="${SITE}/blog">Ver todas las noticias</a></p>`,
      });
    }

    // ============ /festivals (listado) ============
    if (segments[0] === 'festivals' && segments.length === 1) {
      const festivals = await q(supabase
        .from('festivals')
        .select('name, slug, start_date, end_date, venues:venue_id (name, cities:city_id (name))')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(100), 'festivals');

      const list = festivals || [];
      return renderHtml({
        title: `Festivales de música en América Latina | ${SITE_NAME}`,
        description: list.length > 0
          ? `${list.length} festivales próximos en América Latina: fechas, lineups y entradas.`
          : 'Festivales de música en América Latina: fechas, lineups y entradas.',
        path: '/festivals',
        noindex: list.length === 0,
        body: `<h1>Festivales</h1>
${list.length > 0
  ? `<ul>${list.map((f: any) => `<li><a href="${SITE}/festivals/${esc(f.slug)}">${esc(f.name)}</a> — ${esc(formatDateEs(f.start_date))}${f.venues?.cities?.name ? ` — ${esc(f.venues.cities.name)}` : ''}</li>`).join('\n')}</ul>`
  : `<p>Pronto anunciaremos los próximos festivales. Mientras tanto, revisa los <a href="${SITE}/concerts">conciertos próximos</a>.</p>`}`,
      });
    }

    // ============ /festivals/:slug ============
    if (segments[0] === 'festivals' && segments.length === 2) {
      const f = await q(supabase
        .from('festivals')
        .select('name, slug, description, edition, start_date, end_date, image_url, ticket_url, venues:venue_id (name, cities:city_id (name, countries:country_id (name)))')
        .eq('slug', segments[1])
        .maybeSingle(), 'f');

      if (!f) return notFound(path);

      const where = [f.venues?.name, f.venues?.cities?.name, f.venues?.cities?.countries?.name].filter(Boolean).join(', ');
      return renderHtml({
        title: `${f.name}${f.edition ? ` ${f.edition}` : ''}: fechas y entradas | ${SITE_NAME}`,
        description: (f.description || `${f.name}: ${formatDateEs(f.start_date)}${where ? ` en ${where}` : ''}. Fechas y entradas oficiales.`).slice(0, 160),
        path: `/festivals/${f.slug}`,
        image: f.image_url,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'MusicEvent',
            name: f.name,
            startDate: f.start_date,
            endDate: f.end_date || undefined,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            url: `${SITE}/festivals/${f.slug}`,
            image: f.image_url || undefined,
            location: f.venues
              ? {
                  '@type': 'MusicVenue',
                  name: f.venues.name,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: f.venues.cities?.name || '',
                    addressCountry: f.venues.cities?.countries?.name || '',
                  },
                }
              : undefined,
            offers: f.ticket_url ? { '@type': 'Offer', url: f.ticket_url, availability: 'https://schema.org/InStock' } : undefined,
          },
        ],
        body: `<h1>${esc(f.name)}${f.edition ? ` ${esc(f.edition)}` : ''}</h1>
<p>Fecha: ${esc(formatDateEs(f.start_date))}${f.end_date ? ` al ${esc(formatDateEs(f.end_date))}` : ''}</p>
${where ? `<p>Lugar: ${esc(where)}</p>` : ''}
${f.description ? `<section><h2>Acerca del festival</h2><p>${esc(f.description)}</p></section>` : ''}
${f.ticket_url ? `<p><a href="${esc(f.ticket_url)}" rel="sponsored noopener">Comprar entradas en el sitio oficial</a></p>` : ''}
<p><a href="${SITE}/festivals">Ver todos los festivales</a></p>`,
      });
    }

    // ============ /conciertos/:countrySlug (página de país) ============
    if (segments[0] === 'conciertos' && segments.length === 2) {
      const country = COUNTRIES[segments[1]];
      if (!country) return notFound(path);

      const concerts = await q(supabase
        .from('concerts')
        .select(`slug, title, date, description, ticket_url, image_url, event_type,
          artists:artist_id (name, slug, photo_url),
          venues:venue_id!inner (name, slug, cities:city_id!inner (name, slug, countries:country_id!inner (name, iso_code)))`)
        .eq('venues.cities.countries.iso_code', country.iso)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(100), 'concerts');

      const list = concerts || [];
      const year = new Date().getFullYear();
      return renderHtml({
        title: `Conciertos en ${country.name} ${year}: fechas, entradas y calendario | ${SITE_NAME}`,
        description: list.length > 0
          ? `${list.length} conciertos próximos en ${country.name}. Calendario con fechas, venues y enlaces oficiales de entradas.`
          : `Calendario de conciertos y festivales en ${country.name}. Fechas, artistas y venta de entradas.`,
        path: `/conciertos/${segments[1]}`,
        noindex: list.length === 0,
        jsonLd: list.length > 0
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: `Conciertos en ${country.name} ${year}`,
                numberOfItems: list.length,
                itemListElement: list.slice(0, 30).map((c: any, i: number) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  item: musicEventLd(c),
                })),
              },
            ]
          : [],
        body: `<h1>Conciertos en ${esc(country.name)} ${year}</h1>
${list.length > 0
  ? `<p>${list.length} conciertos próximos en ${esc(country.name)}.</p><ul>${list.map(concertLine).join('\n')}</ul>`
  : `<p>Aún no hay conciertos confirmados en ${esc(country.name)}. Revisa los <a href="${SITE}/concerts">conciertos en toda América Latina</a>.</p>`}`,
      });
    }

    // ============ /setlists y /setlist/... ============
    if (segments[0] === 'setlists' && segments.length === 1) {
      const songs = await q(supabase
        .from('setlist_songs')
        .select('concert_id')
        .eq('status', 'approved'), 'songs');

      const concertIds = [...new Set((songs || []).map((s: any) => s.concert_id))];
      const concerts = concertIds.length
        ? await q(supabase
            .from('concerts')
            .select(CONCERT_SELECT)
            .in('id', concertIds)
            .order('date', { ascending: false })
            .limit(100), 'setlistConcerts')
        : [];

      const list = concerts || [];
      return renderHtml({
        title: `Setlists de conciertos en América Latina | ${SITE_NAME}`,
        description: `${list.length} setlists documentados de conciertos en América Latina: canción por canción, con datos verificados.`,
        path: '/setlists',
        body: `<h1>Setlists</h1>
<p>Setlists documentados de conciertos en América Latina.</p>
<ul>${list
          .map((c: any) => {
            const setlistUrl = c.artists?.slug && c.venues?.cities?.slug && c.date
              ? `${SITE}/setlist/${c.artists.slug}/${c.slug}/${c.venues.cities.slug}/${c.date}`
              : `${SITE}/concerts/${c.slug}`;
            return `<li><a href="${esc(setlistUrl)}">Setlist: ${esc(c.artists?.name || c.title)} en ${esc(c.venues?.cities?.name || 'LATAM')} (${esc(c.date || '')})</a></li>`;
          })
          .join('\n')}</ul>`,
      });
    }

    if (segments[0] === 'setlist' && segments.length === 5) {
      const concertSlug = segments[2];
      const c = await q(supabase
        .from('concerts')
        .select(`id, ${CONCERT_SELECT}`)
        .eq('slug', concertSlug)
        .maybeSingle(), 'c');

      if (!c) return notFound(path);

      const setlist = await q(supabase
        .from('setlist_songs')
        .select('song_name, position, is_official')
        .eq('concert_id', c.id)
        .eq('status', 'approved')
        .order('position', { ascending: true }), 'setlist');

      const songs = setlist || [];
      const city = c.venues?.cities?.name || '';
      return renderHtml({
        title: `Setlist de ${c.artists?.name || c.title} en ${city} (${c.date}): ${songs.length} canciones | ${SITE_NAME}`,
        description: `Setlist completo del concierto de ${c.artists?.name || c.title} en ${city}: ${songs.length} canciones en orden, verificadas por asistentes.`,
        path: `/${segments.join('/')}`,
        image: c.artists?.photo_url ?? undefined,
        jsonLd: [musicEventLd(c)],
        body: `<h1>Setlist: ${esc(c.artists?.name || c.title)} en ${esc(city)}</h1>
<p>Concierto: <a href="${SITE}/concerts/${esc(c.slug)}">${esc(c.title)}</a> — ${esc(formatDateEs(c.date))}</p>
${songs.length > 0 ? `<ol>${songs.map((s: any) => `<li>${esc(s.song_name)}</li>`).join('')}</ol>` : '<p>Setlist en construcción.</p>'}
<p><a href="${SITE}/setlists">Ver todos los setlists</a></p>`,
      });
    }

    // ============ /venues ============
    if (segments[0] === 'venues' && segments.length === 1) {
      const venues = await q(supabase
        .from('venues')
        .select('name, slug, cities:city_id (name, slug)')
        .order('name', { ascending: true })
        .limit(300), 'venues');

      const list = venues || [];
      return renderHtml({
        title: `Venues y escenarios de conciertos en América Latina | ${SITE_NAME}`,
        description: `Directorio de ${list.length} venues de conciertos en América Latina con sus próximos eventos.`,
        path: '/venues',
        body: `<h1>Venues</h1>
<ul>${list
          .map((v: any) =>
            v.cities?.slug
              ? `<li><a href="${SITE}/venues/${esc(v.cities.slug)}/${esc(v.slug)}">${esc(v.name)}</a> — ${esc(v.cities.name)}</li>`
              : `<li>${esc(v.name)}</li>`
          )
          .join('\n')}</ul>`,
      });
    }

    if (segments[0] === 'venues' && segments.length === 3) {
      const v = await q(supabase
        .from('venues')
        .select('id, name, slug, location, cities:city_id (name, slug, countries:country_id (name))')
        .eq('slug', segments[2])
        .maybeSingle(), 'v');

      if (!v) return notFound(path);

      const concerts = await q(supabase
        .from('concerts')
        .select(CONCERT_SELECT)
        .eq('venue_id', v.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(50), 'concerts');

      const list = concerts || [];
      return renderHtml({
        title: `Conciertos en ${v.name}, ${v.cities?.name || ''}: agenda y entradas | ${SITE_NAME}`,
        description: `Agenda de conciertos en ${v.name}${v.cities?.name ? ` (${v.cities.name})` : ''}: ${list.length} eventos próximos con fechas y entradas.`,
        path: `/venues/${segments[1]}/${segments[2]}`,
        body: `<h1>Conciertos en ${esc(v.name)}</h1>
${v.cities?.name ? `<p>${esc(v.cities.name)}${v.cities?.countries?.name ? `, ${esc(v.cities.countries.name)}` : ''}</p>` : ''}
${list.length > 0
  ? `<ul>${list.map(concertLine).join('\n')}</ul>`
  : `<p>No hay eventos próximos confirmados en este venue.</p>`}
<p><a href="${SITE}/venues">Ver todos los venues</a></p>`,
      });
    }

    // ============ /promoters ============
    if (segments[0] === 'promoters' && segments.length === 1) {
      const promoters = await q(supabase
        .from('promoters')
        .select('name')
        .order('name', { ascending: true })
        .limit(200), 'promoters');

      const list = promoters || [];
      return renderHtml({
        title: `Promotoras de conciertos en América Latina | ${SITE_NAME}`,
        description: `Directorio de ${list.length} promotoras y productoras de eventos musicales en América Latina.`,
        path: '/promoters',
        body: `<h1>Promotores</h1>
<ul>${list.map((p: any) => `<li>${esc(p.name)}</li>`).join('\n')}</ul>
<p><a href="${SITE}/concerts">Ver los conciertos que producen</a></p>`,
      });
    }

    // ============ /publicidad (comercial) ============
    if (segments[0] === 'publicidad' && segments.length === 1) {
      const products = [
        ['Evento destacado', 'Tu concierto o festival en las posiciones premium: home, página de tu país y notificación push a nuestra comunidad. Los fans lo ven donde ya están buscando qué show ir a ver.'],
        ['Pauta display', 'Banners y espacios publicitarios en las páginas de mayor tráfico: listados de conciertos, artistas y noticias. Segmentación por país y por contexto musical.'],
        ['Contenido aliado', 'Notas editoriales, entrevistas y galerías sobre tu evento o marca, producidas por nuestro equipo y siempre identificadas como contenido patrocinado según nuestros lineamientos.'],
        ['Media partner', 'El paquete completo para promotoras: cubrimos tu evento del anuncio al setlist, con nota de anuncio, evento destacado, cobertura del show, galería y contenido post-evento.'],
      ];
      const faqs = [
        ['¿Qué tipos de publicidad para conciertos y festivales ofrecen?', 'Cuatro formatos: evento destacado (posiciones premium + push), pauta display (banners segmentados por país), contenido aliado (notas editoriales patrocinadas) y media partner (cobertura completa de tu evento, del anuncio al setlist). Todos los paquetes se arman a la medida de tu objetivo.'],
        ['¿A qué audiencia llega la pauta en Conciertos Latam?', 'A fans de música en vivo de 16 países de América Latina que llegan buscando activamente conciertos, entradas, artistas y festivales. Es tráfico orgánico con intención real de compra, no audiencia fría. Cubrimos Colombia, México, Argentina, Chile, Perú y toda la región.'],
        ['¿Cuánto cuesta pautar en Conciertos Latam?', 'Armamos paquetes a la medida según el formato, el alcance y la duración de la campaña. Escríbenos con tu objetivo y te enviamos una propuesta con precios en un máximo de 48 horas.'],
        ['¿Trabajan con promotoras de conciertos como media partner?', 'Sí, es nuestro producto principal para promotoras. Acompañamos el evento completo: nota de anuncio, posición destacada mientras dura la venta, cobertura editorial del show, galería de fotos y setlist. Tu evento vive en el sitio antes, durante y después.'],
        ['¿El contenido patrocinado se identifica como tal?', 'Siempre. Todo contenido pagado se marca claramente como patrocinado y mantenemos separación entre lo editorial y lo publicitario, según nuestros lineamientos editoriales públicos. Eso protege tu marca y la confianza de la audiencia.'],
      ];
      const pageUrl = `${SITE}/publicidad`;
      return renderHtml({
        title: `Publicidad para Conciertos y Festivales en América Latina | Pauta y Media Partner | ${SITE_NAME}`,
        description: 'Promociona tu concierto, festival o marca donde los fans ya lo buscan. Pauta display, eventos destacados, contenido patrocinado y media partnerships para promotoras en 16 países de LATAM. Cotiza en 48h.',
        path: '/publicidad',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${pageUrl}#service`,
            name: 'Publicidad y media partnerships para conciertos y festivales',
            serviceType: 'Publicidad digital para la industria de la música en vivo',
            description: 'Pauta display, eventos destacados, contenido patrocinado y media partnerships para promotoras, festivales, venues y marcas en América Latina.',
            provider: { '@type': 'Organization', name: SITE_NAME, url: SITE },
            areaServed: { '@type': 'Place', name: 'América Latina' },
            audience: { '@type': 'BusinessAudience', name: 'Promotoras de conciertos, festivales, venues, ticketeras y marcas' },
            url: pageUrl,
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Formatos de publicidad',
              itemListElement: products.map(([name, description]) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name, description },
              })),
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(([question, answer]) => ({
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
          },
        ],
        body: `<h1>Publicidad para conciertos y festivales en América Latina</h1>
<p>Para promotoras, venues y marcas: promociona tu concierto, festival o marca donde los fans ya lo buscan. Pauta display, eventos destacados, contenido patrocinado y media partnerships en 16 países de LATAM. Cotizamos en 48 horas.</p>
<section><h2>Formatos</h2>${products.map(([name, description]) => `<h3>${esc(name)}</h3><p>${esc(description)}</p>`).join('\n')}</section>
<section><h2>Preguntas frecuentes</h2>${faqs.map(([question, answer]) => `<h3>${esc(question)}</h3><p>${esc(answer)}</p>`).join('\n')}</section>
<p><a href="${pageUrl}">Cuéntanos de tu evento o marca</a> · <a href="${SITE}/editorial-guidelines">Lineamientos editoriales</a> · <a href="${SITE}/about">Acerca de ${SITE_NAME}</a></p>`,
      });
    }

    // ============ Home y fallback ============
    if (segments.length === 0) {
      const concerts = await q(supabase
        .from('concerts')
        .select(CONCERT_SELECT)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(20), 'concerts');

      const news = await q(supabase
        .from('news_articles')
        .select('title, slug, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10), 'homeNews');

      const list = concerts || [];
      return renderHtml({
        title: 'Conciertos y Festivales en Latinoamérica 2026 | Calendario, Entradas y Setlists',
        description: 'Encuentra todos los conciertos y festivales en América Latina: calendario actualizado, precios de entradas, setlists y venues.',
        path: '/',
        body: `<h1>Conciertos y festivales en América Latina</h1>
<section><h2>Próximos conciertos</h2><ul>${list.map(concertLine).join('\n')}</ul></section>
<p><a href="${SITE}/concerts">Ver el calendario completo</a></p>
<section><h2>Últimas noticias</h2><ul>${(news || []).map((n: any) => `<li><a href="${SITE}/blog/${esc(n.slug)}">${esc(n.title)}</a></li>`).join('\n')}</ul></section>
<p><a href="${SITE}/publicidad">Publicidad para promotoras, venues y marcas</a></p>`,
      });
    }

    return notFound(path);
  } catch (error) {
    console.error('[prerender] error', path, error instanceof Error ? error.message : error);
    // 503 sin caché: Google reintenta más tarde y conserva la versión indexada.
    // Un 200 vacío se indexaría como página sin contenido.
    return new Response(
      `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${SITE_NAME}</title><meta name="robots" content="noindex"></head><body><h1>${SITE_NAME}</h1><p>Servicio temporalmente no disponible.</p></body></html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '300', 'X-Prerender': 'conciertos-latam' },
      }
    );
  }
});
