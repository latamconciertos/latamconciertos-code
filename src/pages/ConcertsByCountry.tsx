import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { spotifyService } from '@/lib/spotify';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Mapeo de slugs a nombres de países y códigos ISO
const COUNTRY_DATA: Record<string, { name: string; isoCode: string; demonym: string }> = {
  'colombia': { name: 'Colombia', isoCode: 'CO', demonym: 'colombianos' },
  'mexico': { name: 'México', isoCode: 'MX', demonym: 'mexicanos' },
  'argentina': { name: 'Argentina', isoCode: 'AR', demonym: 'argentinos' },
  'chile': { name: 'Chile', isoCode: 'CL', demonym: 'chilenos' },
  'peru': { name: 'Perú', isoCode: 'PE', demonym: 'peruanos' },
  'brasil': { name: 'Brasil', isoCode: 'BR', demonym: 'brasileños' },
  'ecuador': { name: 'Ecuador', isoCode: 'EC', demonym: 'ecuatorianos' },
  'venezuela': { name: 'Venezuela', isoCode: 'VE', demonym: 'venezolanos' },
  'costa-rica': { name: 'Costa Rica', isoCode: 'CR', demonym: 'costarricenses' },
  'panama': { name: 'Panamá', isoCode: 'PA', demonym: 'panameños' },
  'uruguay': { name: 'Uruguay', isoCode: 'UY', demonym: 'uruguayos' },
  'paraguay': { name: 'Paraguay', isoCode: 'PY', demonym: 'paraguayos' },
  'bolivia': { name: 'Bolivia', isoCode: 'BO', demonym: 'bolivianos' },
  'guatemala': { name: 'Guatemala', isoCode: 'GT', demonym: 'guatemaltecos' },
  'republica-dominicana': { name: 'República Dominicana', isoCode: 'DO', demonym: 'dominicanos' },
  'puerto-rico': { name: 'Puerto Rico', isoCode: 'PR', demonym: 'puertorriqueños' },
};

interface ConcertWithDetails {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  image_url: string | null;
  event_type: string;
  artist_image_url?: string;
  artists: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
  } | null;
  venues: {
    id: string;
    name: string;
    slug: string;
    cities: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
}

const ConcertsByCountry = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const countryInfo = countrySlug ? COUNTRY_DATA[countrySlug] : null;
  const [isPastConcertsOpen, setIsPastConcertsOpen] = useState(false);
  
  const { data: countryData } = useQuery({
    queryKey: ['country-by-iso', countryInfo?.isoCode],
    queryFn: async () => {
      if (!countryInfo) return null;
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .eq('iso_code', countryInfo.isoCode)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!countryInfo,
  });

  const { data: concerts, isLoading } = useQuery({
    queryKey: ['concerts-by-country', countryData?.id],
    queryFn: async () => {
      if (!countryData) return [];
      
      // Get cities in this country
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('id')
        .eq('country_id', countryData.id);
      
      if (citiesError) throw citiesError;
      if (!cities?.length) return [];
      
      const cityIds = cities.map(c => c.id);
      
      // Get venues in these cities
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .in('city_id', cityIds);
      
      if (venuesError) throw venuesError;
      if (!venues?.length) return [];
      
      const venueIds = venues.map(v => v.id);
      
      // Get concerts at these venues
      const { data: concertsData, error: concertsError } = await supabase
        .from('concerts')
        .select(`
          id, title, slug, date, image_url, event_type,
          artists:artist_id (id, name, slug, photo_url),
          venues:venue_id (
            id, name, slug,
            cities:city_id (id, name, slug)
          )
        `)
        .in('venue_id', venueIds)
        .order('date', { ascending: true });
      
      if (concertsError) throw concertsError;
      
      // Prefer artist photo, fallback to Spotify image, then concert poster
      const enriched = await Promise.all(
        (concertsData || []).map(async (concert) => {
          let artistImage: string | null = concert.artists?.photo_url || null;
          if (!artistImage && concert.artists?.name) {
            artistImage = await spotifyService.getArtistImage(concert.artists.name);
          }
          if (!artistImage) artistImage = concert.image_url;
          return { ...concert, artist_image_url: artistImage };
        })
      );
      
      return enriched as ConcertWithDetails[];
    },
    enabled: !!countryData,
  });

  const upcomingConcerts = concerts?.filter(c => c.date && !isPast(parseISO(c.date))) || [];
  const pastConcerts = concerts?.filter(c => c.date && isPast(parseISO(c.date))).reverse() || [];

  if (!countryInfo) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <p className="text-muted-foreground">País no encontrado</p>
        </main>
        <Footer />
      </>
    );
  }

  // ============= SEO DINÁMICO =============
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  // Verificar si hay conciertos en el año siguiente
  const hasNextYearConcerts = upcomingConcerts.some(
    c => c.date && new Date(c.date).getFullYear() === nextYear
  );
  const hasCurrentYearConcerts = upcomingConcerts.some(
    c => c.date && new Date(c.date).getFullYear() === currentYear
  );
  
  // Generar texto de años dinámicamente
  const yearText = hasNextYearConcerts && hasCurrentYearConcerts
    ? `${currentYear} y ${nextYear}`
    : hasNextYearConcerts
    ? `${nextYear}`
    : `${currentYear}`;
  
  // Verificar si hay festivales
  const hasFestivals = upcomingConcerts.some(c => c.event_type === 'festival');
  const eventTypeText = hasFestivals ? 'Conciertos y festivales' : 'Conciertos';
  
  // Obtener artistas únicos destacados (primeros 5)
  const featuredArtists = [...new Set(
    upcomingConcerts
      .slice(0, 8)
      .map(c => c.artists?.name)
      .filter(Boolean)
  )].slice(0, 5);
  
  // Obtener rango de fechas de eventos próximos
  const getDateRange = () => {
    if (upcomingConcerts.length === 0) return '';
    const firstDate = upcomingConcerts[0]?.date;
    const lastDate = upcomingConcerts[upcomingConcerts.length - 1]?.date;
    if (!firstDate || !lastDate) return '';
    
    const firstFormatted = format(parseISO(firstDate), 'MMM yyyy', { locale: es });
    const lastFormatted = format(parseISO(lastDate), 'MMM yyyy', { locale: es });
    
    return firstFormatted === lastFormatted ? firstFormatted : `${firstFormatted} — ${lastFormatted}`;
  };
  
  const dateRange = getDateRange();
  const artistsText = featuredArtists.length > 0 ? featuredArtists.join(' · ') : '';
  
  // Top cities & venues (for SEO sub-sections + FAQ)
  const cityCounts = (concerts || [])
    .filter((c) => c.venues?.cities?.name)
    .reduce<Record<string, { name: string; slug: string; count: number }>>((acc, c) => {
      const key = c.venues!.cities!.slug;
      if (!acc[key]) acc[key] = { name: c.venues!.cities!.name, slug: key, count: 0 };
      acc[key].count++;
      return acc;
    }, {});
  const topCities = Object.values(cityCounts).sort((a, b) => b.count - a.count).slice(0, 6);

  const venueCounts = (concerts || [])
    .filter((c) => c.venues?.name)
    .reduce<Record<string, { name: string; slug: string; cityName?: string; count: number }>>((acc, c) => {
      const key = c.venues!.slug;
      if (!acc[key]) acc[key] = { name: c.venues!.name, slug: key, cityName: c.venues!.cities?.name, count: 0 };
      acc[key].count++;
      return acc;
    }, {});
  const topVenues = Object.values(venueCounts).sort((a, b) => b.count - a.count).slice(0, 6);

  // Título SEO dinámico — keyword first
  const pageTitle = `Conciertos en ${countryInfo.name} ${yearText}: ${upcomingConcerts.length > 0 ? `${upcomingConcerts.length} fechas, ` : ''}entradas y calendario | Conciertos Latam`;
  
  // Meta descripción dinámica (max 160 caracteres)
  const buildDescription = () => {
    const parts: string[] = [];
    if (dateRange) parts.push(dateRange);
    if (artistsText) parts.push(artistsText);
    
    const intro = parts.length > 0 ? parts.join(' · ') + ' | ' : '';
    const count = upcomingConcerts.length;
    const main = `${count} ${count === 1 ? 'evento' : 'eventos'} en ${countryInfo.name}. Compra entradas.`;
    
    const full = intro + main;
    return full.length > 160 ? full.substring(0, 157) + '...' : full;
  };
  
  const pageDescription = upcomingConcerts.length > 0
    ? buildDescription()
    : `Descubre los próximos conciertos y festivales en ${countryInfo.name}. Calendario de eventos, fechas y venta de entradas.`;
  
  // Keywords dinámicos
  const keywords = [
    `conciertos ${countryInfo.name} ${currentYear}`,
    `festivales ${countryInfo.name} ${nextYear}`,
    `eventos musicales ${countryInfo.name}`,
    `entradas conciertos ${countryInfo.name}`,
    `shows en vivo ${countryInfo.name}`,
    ...featuredArtists.map(artist => `${artist} ${countryInfo.name} ${currentYear}`),
  ].join(', ');

  // FAQ content (drives FAQPage schema + on-page text)
  const faqs = [
    {
      q: `¿Cuáles son los próximos conciertos en ${countryInfo.name} ${yearText}?`,
      a: upcomingConcerts.length > 0
        ? `Hay ${upcomingConcerts.length} ${upcomingConcerts.length === 1 ? 'concierto programado' : 'conciertos programados'} en ${countryInfo.name} para ${yearText}, incluyendo shows de ${featuredArtists.slice(0, 5).join(', ')}${featuredArtists.length > 5 ? ' y más artistas' : ''}. Revisa el calendario completo arriba con fechas, venues y enlaces para comprar entradas.`
        : `Aún no hay conciertos confirmados en ${countryInfo.name} para ${yearText}. Revisa esta página o suscríbete a nuestras notificaciones para enterarte primero cuando se anuncien fechas.`,
    },
    {
      q: `¿Dónde comprar entradas para conciertos en ${countryInfo.name}?`,
      a: `En cada concierto listado encontrás el botón "Ver entradas" que te lleva al sitio oficial de venta autorizado por la promotora del evento. Conciertos Latam no vende entradas directamente — solo te conectamos con la fuente oficial para evitar reventa y estafas.`,
    },
    ...(topCities.length > 0 ? [{
      q: `¿En qué ciudades de ${countryInfo.name} hay más conciertos?`,
      a: `Las ciudades con más eventos musicales en ${countryInfo.name} son ${topCities.slice(0, 5).map(c => `${c.name} (${c.count} ${c.count === 1 ? 'concierto' : 'conciertos'})`).join(', ')}.`,
    }] : []),
    ...(topVenues.length > 0 ? [{
      q: `¿Cuáles son los mejores venues para conciertos en ${countryInfo.name}?`,
      a: `Los venues con más actividad este año en ${countryInfo.name} son ${topVenues.slice(0, 5).map(v => v.name).join(', ')}. Encuentra fechas y artistas de cada venue en la lista de conciertos arriba.`,
    }] : []),
    {
      q: `¿Cómo me entero de nuevos conciertos en ${countryInfo.name}?`,
      a: `Esta página se actualiza automáticamente cada vez que añadimos un nuevo evento. Te recomendamos guardarla en favoritos. Cubrimos conciertos, festivales, giras internacionales y shows de artistas locales en todo ${countryInfo.name}.`,
    },
  ];

  // Structured data — multi-schema graph for max ranking signal
  const SITE_URL = 'https://www.conciertoslatam.app';
  const pageUrl = `${SITE_URL}/conciertos/${countrySlug}`;

  const structuredData = [
    // Breadcrumb
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Conciertos", "item": `${SITE_URL}/concerts` },
        { "@type": "ListItem", "position": 3, "name": countryInfo.name, "item": pageUrl },
      ],
    },
    // CollectionPage with ItemList of MusicEvents
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      "name": `Conciertos en ${countryInfo.name} ${yearText}`,
      "description": pageDescription,
      "url": pageUrl,
      "isPartOf": { "@id": `${SITE_URL}/#website` },
      "inLanguage": "es-419",
      "about": {
        "@type": "Place",
        "name": countryInfo.name,
        "address": { "@type": "PostalAddress", "addressCountry": countryInfo.isoCode },
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": `Conciertos en ${countryInfo.name} ${yearText}`,
        "numberOfItems": upcomingConcerts.length,
        "itemListElement": upcomingConcerts.slice(0, 20).map((concert, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "MusicEvent",
            "name": concert.title,
            "startDate": concert.date,
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": concert.venues ? {
              "@type": "MusicVenue",
              "name": concert.venues.name,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": concert.venues.cities?.name,
                "addressCountry": countryInfo.isoCode,
              },
            } : undefined,
            "performer": concert.artists ? {
              "@type": "MusicGroup",
              "name": concert.artists.name,
              "url": `${SITE_URL}/artists/${concert.artists.slug}`,
            } : undefined,
            "image": concert.artist_image_url || undefined,
            "url": `${SITE_URL}/concerts/${concert.slug}`,
            "offers": {
              "@type": "Offer",
              "url": `${SITE_URL}/concerts/${concert.slug}`,
              "availability": "https://schema.org/InStock",
              "validFrom": concert.date,
            },
          },
        })),
      },
    },
    // FAQPage — drives "People also ask" boxes in SERP
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    },
  ];

  const ConcertCard = ({ concert }: { concert: ConcertWithDetails }) => {
    const dateObj = concert.date ? parseISO(concert.date) : null;
    const day = dateObj ? format(dateObj, 'd') : '';
    const month = dateObj ? format(dateObj, 'MMM', { locale: es }).replace('.', '').toUpperCase() : '';
    const isFestival = concert.event_type === 'festival';

    return (
      <Link
        to={`/concerts/${concert.slug}`}
        className="group block focus:outline-none"
      >
        <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 group-hover:ring-primary/40 transition-all duration-300">
          <img
            src={concert.artist_image_url || '/placeholder.svg'}
            alt={`${concert.artists?.name || concert.title} en ${concert.venues?.cities?.name || countryInfo.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Festival badge — only when relevant */}
          {isFestival && (
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.15em] bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
              Festival
            </span>
          )}

          {/* Date stamp top-right */}
          {dateObj && (
            <time
              dateTime={concert.date || ''}
              className="absolute top-3 right-3 bg-background/95 backdrop-blur rounded-lg px-2.5 py-1.5 text-center min-w-[48px]"
            >
              <span className="block font-display text-xl font-black text-foreground leading-none">{day}</span>
              <span className="block text-[9px] uppercase font-bold tracking-[0.1em] text-muted-foreground mt-0.5">{month}</span>
            </time>
          )}

          {/* Title + meta over image bottom */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <h3 className="font-bold text-sm sm:text-base text-white leading-tight line-clamp-2 mb-1.5">
              {concert.title}
            </h3>
            {concert.venues && (
              <p className="text-[11px] sm:text-xs text-white/80 truncate">
                {concert.venues.name}
                {concert.venues.cities?.name ? ` · ${concert.venues.cities.name}` : ''}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={keywords}
        url={`/conciertos/${countrySlug}`}
        structuredData={structuredData}
      />
      
      <Header />

      <main className="min-h-screen pt-24 md:pt-28 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Editorial Hero — keyword-rich h1 for SEO */}
          <header className="text-center mt-6 mb-10 md:mb-14">
            <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
              Música en vivo · {countryInfo.name}
            </p>
            <h1 className="font-display uppercase font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-4">
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-muted-foreground/70 mb-1 md:mb-2">
                Conciertos en
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                {countryInfo.name} {yearText}
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {upcomingConcerts.length > 0
                ? `Calendario completo de ${upcomingConcerts.length} ${upcomingConcerts.length === 1 ? 'evento próximo' : 'eventos próximos'} en ${countryInfo.name}${featuredArtists.length > 0 ? `: ${featuredArtists.slice(0, 3).join(', ')} y más` : ''}. Fechas, venues y entradas.`
                : `Calendario de conciertos, festivales y eventos de música en vivo en ${countryInfo.name}. Fechas, artistas y venta de entradas.`}
            </p>
          </header>

          {/* Editorial stats */}
          {concerts && concerts.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mb-10 md:mb-14">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {upcomingConcerts.length}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  Próximos
                </span>
              </div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {new Set(concerts.map(c => c.artists?.name).filter(Boolean)).size}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  Artistas
                </span>
              </div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {new Set(concerts.map(c => c.venues?.cities?.name).filter(Boolean)).size}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  Ciudades
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Upcoming Concerts */}
              {upcomingConcerts.length > 0 && (
                <section className="mb-12 sm:mb-16" aria-labelledby="upcoming-concerts">
                  <div className="mb-6 md:mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                      Próximamente
                    </p>
                    <h2 id="upcoming-concerts" className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground">
                      En cartelera
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {upcomingConcerts.map(concert => (
                      <ConcertCard key={concert.id} concert={concert} />
                    ))}
                  </div>
                </section>
              )}

              {/* Past Concerts - Collapsible */}
              {pastConcerts.length > 0 && (
                <Collapsible open={isPastConcertsOpen} onOpenChange={setIsPastConcertsOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between py-4 border-y border-border/60 hover:border-primary/40 transition-colors group mb-4"
                      aria-labelledby="past-concerts"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Archivo
                        </span>
                        <span className="h-3 w-px bg-border/60" />
                        <h2 id="past-concerts" className="font-display uppercase text-xl md:text-2xl font-black tracking-tight text-foreground">
                          Pasados
                        </h2>
                        <span className="font-display text-base md:text-lg font-black text-primary">
                          {pastConcerts.length}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 ${isPastConcertsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-4">
                      {pastConcerts.map(concert => (
                        <ConcertCard key={concert.id} concert={concert} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* No concerts */}
              {concerts?.length === 0 && (
                <div className="text-center py-12 sm:py-16">
                  <p className="text-muted-foreground mb-4">
                    No hay conciertos registrados en {countryInfo.name} por el momento.
                  </p>
                  <Link 
                    to="/concerts"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Ver todos los conciertos
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Top Cities — pills, editorial */}
          {topCities.length > 0 && (
            <section className="mt-16 sm:mt-20 text-center" aria-labelledby="top-cities">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Explorá por ciudad
              </p>
              <h2 id="top-cities" className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground mb-6">
                Conciertos en {countryInfo.name} por ciudad
              </h2>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto">
                {topCities.map((city) => (
                  <Link
                    key={city.slug}
                    to={`/concerts?city=${city.slug}`}
                    aria-label={`Conciertos en ${city.name}, ${countryInfo.name}`}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                      {city.name}
                    </span>
                    <span className="text-[10px] font-black text-primary group-hover:text-primary tabular-nums">
                      {city.count}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Venues — internal linking + keyword "Conciertos en {Venue}" */}
          {topVenues.length > 0 && (
            <section className="mt-12 sm:mt-16" aria-labelledby="top-venues">
              <div className="mb-6 md:mb-8 max-w-3xl mx-auto text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  Venues principales
                </p>
                <h2 id="top-venues" className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground">
                  Los venues más activos de {countryInfo.name}
                </h2>
              </div>
              <ul className="max-w-3xl mx-auto divide-y divide-border/60 border-y border-border/60">
                {topVenues.map((venue) => (
                  <li key={venue.slug} className="py-4 px-2 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-foreground truncate">
                        {venue.name}
                      </h3>
                      {venue.cityName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {venue.cityName}, {countryInfo.name}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="font-display text-xl font-black text-foreground leading-none">
                        {venue.count}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                        {venue.count === 1 ? 'concierto' : 'conciertos'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* SEO Editorial Section */}
          <section className="mt-16 sm:mt-20 max-w-3xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Guía editorial
            </p>
            <h2 className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground mb-5">
              {eventTypeText} en {countryInfo.name}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              {countryInfo.name} es uno de los destinos más importantes para la música en vivo en América Latina.
              {upcomingConcerts.length > 0 && ` Este ${currentYear}${hasNextYearConcerts ? ` y ${nextYear}` : ''}, hay ${upcomingConcerts.length} eventos programados`}
              {featuredArtists.length > 0 && `, incluyendo shows de ${featuredArtists.slice(0, 3).join(', ')}${featuredArtists.length > 3 ? ' y más artistas' : ''}`}.
              {' '}En Conciertos Latam te mantenemos actualizado con toda la información sobre fechas,
              lugares y venta de entradas para que no te pierdas ningún show.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Cubrimos toda la oferta de conciertos en {countryInfo.name}: giras internacionales, festivales, residencias de artistas locales y shows en venues de todo el país.
              {topCities.length > 0 && ` Las ciudades con mayor actividad son ${topCities.slice(0, 3).map(c => c.name).join(', ')}, que concentran la mayoría de eventos.`}
              {' '}Si querés saber qué pasa con un artista en particular, visitá su perfil; si te interesa un venue específico, podés filtrar la cartelera por ciudad.
            </p>
          </section>

          {/* FAQ Section — drives FAQPage schema rich result */}
          <section className="mt-16 sm:mt-20 max-w-3xl mx-auto" aria-labelledby="faq-title">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Preguntas frecuentes
            </p>
            <h2 id="faq-title" className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground mb-8">
              Conciertos en {countryInfo.name}: lo que más preguntan
            </h2>
            <div className="divide-y divide-border/60 border-y border-border/60">
              {faqs.map((faq, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="font-bold text-base md:text-lg text-foreground pr-4">
                      {faq.q}
                    </h3>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mt-3 pr-9">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal Links Navigation — country pills */}
          <nav className="mt-16 sm:mt-20 pt-10 border-t border-border/60 text-center" aria-label="Otros países">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Sigue explorando
            </p>
            <h3 className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground mb-6">
              Conciertos en otros países
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto">
              {Object.entries(COUNTRY_DATA)
                .filter(([slug]) => slug !== countrySlug)
                .map(([slug, data]) => (
                  <Link
                    key={slug}
                    to={`/conciertos/${slug}`}
                    className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    {data.name}
                  </Link>
                ))}
            </div>
          </nav>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default ConcertsByCountry;
