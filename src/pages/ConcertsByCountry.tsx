import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Ticket, ChevronRight, ChevronDown, Music } from 'lucide-react';
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
          artists:artist_id (id, name, slug),
          venues:venue_id (
            id, name, slug,
            cities:city_id (id, name, slug)
          )
        `)
        .in('venue_id', venueIds)
        .order('date', { ascending: true });
      
      if (concertsError) throw concertsError;
      
      // Enrich with Spotify images
      const enriched = await Promise.all(
        (concertsData || []).map(async (concert) => {
          let artistImage = concert.image_url;
          if (!artistImage && concert.artists?.name) {
            artistImage = await spotifyService.getArtistImage(concert.artists.name);
          }
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
  
  // Título SEO dinámico
  const pageTitle = `${eventTypeText} en ${countryInfo.name} ${yearText} | Fechas y Entradas`;
  
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

  // Structured data mejorado para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${eventTypeText} en ${countryInfo.name} ${yearText}`,
    "description": pageDescription,
    "numberOfItems": upcomingConcerts.length,
    "itemListElement": upcomingConcerts.slice(0, 10).map((concert, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": concert.title,
        "startDate": concert.date,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": concert.venues?.name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": concert.venues?.cities?.name,
            "addressCountry": countryInfo.isoCode
          }
        },
        "performer": concert.artists ? {
          "@type": "MusicGroup",
          "name": concert.artists.name
        } : undefined,
        "image": concert.artist_image_url || undefined,
        "url": `https://www.conciertoslatam.app/concerts/${concert.slug}`
      }
    }))
  };

  const ConcertCard = ({ concert }: { concert: ConcertWithDetails }) => (
    <Link 
      to={`/concerts/${concert.slug}`}
      className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="aspect-[4/3] sm:aspect-video relative overflow-hidden">
        <img
          src={concert.artist_image_url || '/placeholder.svg'}
          alt={concert.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge 
          className="absolute top-2 left-2 sm:top-3 sm:left-3 text-xs"
          variant={concert.event_type === 'festival' ? 'secondary' : 'default'}
        >
          {concert.event_type === 'festival' ? 'Festival' : 'Concierto'}
        </Badge>
      </div>
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {concert.title}
        </h3>
        {concert.artists && (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{concert.artists.name}</span>
          </p>
        )}
        {concert.date && (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            {format(parseISO(concert.date), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        )}
        {concert.venues && (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{concert.venues.name}, {concert.venues.cities?.name}</span>
          </p>
        )}
      </div>
    </Link>
  );

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
      
      <main className="min-h-screen pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <header className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {eventTypeText} en {countryInfo.name} {yearText}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {upcomingConcerts.length > 0 
                ? `${upcomingConcerts.length} eventos próximos${featuredArtists.length > 0 ? `: ${featuredArtists.slice(0, 3).join(', ')} y más` : ''}.`
                : `Calendario de conciertos, festivales y eventos de música en vivo en ${countryInfo.name}.`}
            </p>
          </header>

          {/* Quick Stats - Solo 3 cards sin eventos pasados */}
          {concerts && concerts.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-12 max-w-2xl mx-auto">
              <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border text-center">
                <p className="text-xl sm:text-3xl font-bold text-primary">{upcomingConcerts.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Próximos</p>
              </div>
              <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border text-center">
                <p className="text-xl sm:text-3xl font-bold text-primary">
                  {new Set(concerts.map(c => c.artists?.name).filter(Boolean)).size}
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Artistas</p>
              </div>
              <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border text-center">
                <p className="text-xl sm:text-3xl font-bold text-primary">
                  {new Set(concerts.map(c => c.venues?.cities?.name).filter(Boolean)).size}
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Ciudades</p>
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
                <section className="mb-10 sm:mb-16" aria-labelledby="upcoming-concerts">
                  <h2 id="upcoming-concerts" className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                    <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Próximos conciertos en {countryInfo.name}
                  </h2>
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
                      className="w-full flex items-center justify-between p-4 bg-card/50 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 group mb-4"
                      aria-labelledby="past-concerts"
                    >
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                        <h2 id="past-concerts" className="text-lg sm:text-xl font-bold text-foreground">
                          Conciertos pasados en {countryInfo.name}
                        </h2>
                        <Badge variant="secondary" className="ml-2">
                          {pastConcerts.length}
                        </Badge>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isPastConcertsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
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

          {/* SEO Content Section */}
          <section className="mt-12 sm:mt-16 prose prose-invert max-w-none">
            <h2 className="text-base sm:text-xl font-semibold text-foreground">
              Guía de {eventTypeText.toLowerCase()} en {countryInfo.name} {yearText}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {countryInfo.name} es uno de los destinos más importantes para la música en vivo en América Latina. 
              {upcomingConcerts.length > 0 && ` Este ${currentYear}${hasNextYearConcerts ? ` y ${nextYear}` : ''}, hay ${upcomingConcerts.length} eventos programados`}
              {featuredArtists.length > 0 && `, incluyendo shows de ${featuredArtists.slice(0, 3).join(', ')}${featuredArtists.length > 3 ? ' y más artistas' : ''}`}.
              {' '}En Conciertos Latam te mantenemos actualizado con toda la información sobre fechas, 
              lugares y venta de entradas para que no te pierdas ningún show.
            </p>
          </section>

          {/* Internal Links Navigation */}
          <nav className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50 text-center" aria-label="Otros países">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Explora conciertos en otros países
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {Object.entries(COUNTRY_DATA)
                .filter(([slug]) => slug !== countrySlug)
                .map(([slug, data]) => (
                  <Link
                    key={slug}
                    to={`/conciertos/${slug}`}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted rounded-full text-xs sm:text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
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
