import { useParams, Link } from 'react-router-dom';
import { sanitizeHTML } from '@/lib/sanitize';
import { Calendar, MapPin, Ticket, Music, Globe, ListMusic, Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';
import { AD_SLOTS } from '@/lib/adsense';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { SocialShare } from '@/components/SocialShare';
import { formatInBogota } from '@/lib/timezone';
import { useConcertDetail } from '@/hooks/queries/useConcertDetail';
import { withTicketTracking } from '@/lib/ticketUrl';

const ConcertDetail = () => {
  const { slug } = useParams();
  const { data, isLoading } = useConcertDetail(slug);

  const concert = data?.concert;
  const artistImage = data?.artistImage;
  const setlist = data?.setlist || [];

  const isUpcoming = concert?.date ? new Date(concert.date) >= new Date() : true;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Fecha por confirmar';
    return formatInBogota(dateString, "EEEE d 'de' MMMM, yyyy");
  };

  const getSetlistUrl = () => {
    if (!concert || !concert.artists?.slug || !concert.venues?.cities?.slug || !concert.date) {
      return null;
    }
    return `/setlist/${concert.artists.slug}/${concert.slug}/${concert.venues.cities.slug}/${concert.date}`;
  };

  if (isLoading) {
    return (
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />
        <LoadingSpinner message="Cargando concierto..." />
        <Footer />
      </div>
    );
  }

  if (!concert) {
    return (
      <>
        <SEO
          title="Concierto no encontrado"
          description="El concierto que buscas no existe o ha sido eliminado."
          url={`/concerts/${slug}`}
        />
        <div className="dark font-fira min-h-screen bg-noche text-texto">
          <Header />
          <div className="container mx-auto px-4 py-24 pt-28">
            <div className="text-center">
              <Music className="h-24 w-24 text-muted-foreground/40 mx-auto mb-4" />
              <h1 className="font-display uppercase text-3xl font-extrabold tracking-[0.01em] text-foreground mb-4">Concierto no encontrado</h1>
              <p className="text-muted-foreground mb-8">
                El concierto que buscas no existe o ha sido eliminado.
              </p>
              <Link to="/concerts" className="btn-nocturno-secundario">
                <ArrowLeft className="h-4 w-4" />
                Ver todos los conciertos
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "name": concert.title,
    "description": concert.description || `Concierto de ${concert.artists?.name || 'artista'}`,
    "image": concert.image_url || artistImage,
    "startDate": concert.date || undefined,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": concert.venues ? {
      "@type": "Place",
      "name": concert.venues.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": concert.venues.cities?.name || "",
        "addressCountry": concert.venues.cities?.countries?.name || ""
      }
    } : undefined,
    "performer": concert.artists ? {
      "@type": "MusicGroup",
      "name": concert.artists.name
    } : undefined,
    "organizer": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "url": "https://www.conciertoslatam.com"
    },
    "offers": concert.ticket_url ? {
      "@type": "Offer",
      "url": concert.ticket_url,
      "availability": "https://schema.org/InStock"
    } : undefined
  };

  const setlistUrl = getSetlistUrl();

  return (
    <>
      <SEO
        title={`${concert.title} - ${concert.artists?.name || 'Concierto'}`}
        description={concert.description || `Toda la información sobre ${concert.title}. Fecha, lugar, entradas y más.`}
        keywords={`${concert.title}, ${concert.artists?.name || ''}, concierto, entradas, ${concert.venues?.cities?.name || ''}`}
        image={concert.image_url || artistImage || undefined}
        url={`/concerts/${concert.slug}`}
        structuredData={structuredData}
      />
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="pt-24 sm:pt-28 pb-12">
          <div className="container mx-auto px-4">
            <Breadcrumbs items={[
              { label: 'Conciertos', href: '/concerts' },
              { label: concert.title }
            ]} />

            {/* Hero Section - Redesigned */}
            <div className="rounded-[20px] border border-linea bg-superficie mb-6 sm:mb-8 overflow-hidden">
              {/* Desktop Layout */}
              <div className="hidden lg:block relative p-6">
                {/* Share Button - Top Right Corner (Desktop) */}
                <div className="absolute top-4 right-4 z-10">
                  <SocialShare
                    url={window.location.href}
                    title={concert.title}
                  />
                </div>

                <div className="lg:flex lg:gap-8 lg:items-start">
                  {/* Desktop: Full size image */}
                  <div className="lg:w-64 lg:flex-shrink-0">
                    <div className="relative">
                      <img
                        src={artistImage || concert.image_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"}
                        alt={concert.artists?.name || concert.title}
                        className="w-full aspect-square object-cover rounded-[20px] ring-1 ring-linea"
                      />
                      {/* Favorite Button - Overlay on image */}
                      <div className="absolute top-3 right-3">
                        <ConcertAttendanceButtons concertId={concert.id} variant="card-favorite" />
                      </div>
                    </div>
                  </div>

                  {/* Event Info - Right Column (Desktop) */}
                  <div className="flex-1 space-y-4">
                    {/* Badge & Title */}
                    <div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-3 ${isUpcoming ? 'border-verde/30 bg-noche/80 backdrop-blur-sm text-verde' : 'border-linea bg-noche/80 backdrop-blur-sm text-texto-2'}`}>
                        {isUpcoming ? 'Próximo' : 'Finalizado'}
                      </span>
                      <h1 className="font-display uppercase text-4xl xl:text-5xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-2">
                        {concert.title}
                      </h1>
                      {concert.artists && (
                        <Link to={`/artists/${concert.artists.slug}`}>
                          <p className="text-xl text-periwinkle hover:underline font-medium">
                            {concert.artists.name}
                          </p>
                        </Link>
                      )}
                    </div>

                    {/* Quick Info - Date & Venue */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-periwinkle flex-shrink-0" />
                        <span className="text-base text-foreground capitalize">
                          {formatDate(concert.date)}
                        </span>
                      </div>

                      {concert.venues && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-periwinkle flex-shrink-0 mt-0.5" />
                          <div className="text-base text-foreground">
                            <div className="font-medium">{concert.venues.name}</div>
                            {concert.venues.cities && (
                              <div className="text-muted-foreground">
                                {concert.venues.cities.name}, {concert.venues.cities.countries?.name}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button - Desktop */}
                    <div className="pt-4">
                      <ConcertAttendanceButtons concertId={concert.id} variant="default" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout - Completely Redesigned */}
              <div className="lg:hidden">
                {/* Top Section: Image + Share */}
                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* Artist Image - Small, Left-aligned */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img
                        src={artistImage || concert.image_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop"}
                        alt={concert.artists?.name || concert.title}
                        className="w-full h-full object-cover rounded-xl ring-1 ring-linea"
                      />
                    </div>

                    {/* Share button aligned to the right */}
                    <div className="flex-1 flex items-start justify-end">
                      <SocialShare
                        url={window.location.href}
                        title={concert.title}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 pt-2 space-y-3">
                  {/* Title */}
                  <div>
                    <h1 className="font-display uppercase text-2xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-1">
                      {concert.title}
                    </h1>
                    {concert.artists && (
                      <div className="space-y-2">
                        <Link to={`/artists/${concert.artists.slug}`}>
                          <p className="text-base text-periwinkle hover:underline font-medium">
                            {concert.artists.name}
                          </p>
                        </Link>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${isUpcoming ? 'border-verde/30 bg-noche/80 backdrop-blur-sm text-verde' : 'border-linea bg-noche/80 backdrop-blur-sm text-texto-2'}`}>
                          {isUpcoming ? 'Próximo' : 'Finalizado'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Info - Compact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-periwinkle flex-shrink-0" />
                      <span className="text-sm text-foreground capitalize">
                        {formatDate(concert.date)}
                      </span>
                    </div>

                    {concert.venues && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-periwinkle flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground">
                          <div className="font-medium">{concert.venues.name}</div>
                          {concert.venues.cities && (
                            <div className="text-muted-foreground text-xs">
                              {concert.venues.cities.name}, {concert.venues.cities.countries?.name}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Mobile (Compact) */}
                  <div className="pt-2">
                    <ConcertAttendanceButtons concertId={concert.id} variant="default" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout: Stack everything */}
            <div className="lg:hidden space-y-4">
              {/* 1. Detalles del evento */}
              <Card className="rounded-[20px] border-linea bg-superficie">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-base">Detalles del evento</h3>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">Fecha</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formatDate(concert.date)}
                        </p>
                      </div>
                    </div>

                    {concert.venues && (
                      <>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">Venue</p>
                            <p className="text-xs text-muted-foreground">
                              {concert.venues.name}
                            </p>
                          </div>
                        </div>

                        {concert.venues.cities && (
                          <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm">Ubicación</p>
                              <p className="text-xs text-muted-foreground">
                                {concert.venues.cities.name}
                                {concert.venues.cities.countries?.name && `, ${concert.venues.cities.countries.name}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {concert.promoters && (
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">Promotor</p>
                          <p className="text-xs text-muted-foreground">
                            {concert.promoters.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUpcoming && concert.ticket_url && (
                    <Button className="w-full mt-3 rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95" size="sm" asChild>
                      <a
                        href={withTicketTracking(concert.ticket_url)}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Comprar Entradas
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Comunidad */}
              <ConcertCommunity concertId={concert.id} concertTitle={concert.title} />

              {/* Ticket Prices */}
              {concert.ticket_prices_html && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                  <CardContent className="p-4">
                    <div
                      className="ticket-prices-content prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(concert.ticket_prices_html) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Spotify Embed */}
              {concert.spotify_embed_url && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                      <Music className="h-4 w-4 text-periwinkle" />
                      Escucha en Spotify
                    </h3>
                    <div className="rounded-lg overflow-hidden">
                      <iframe
                        src={concert.spotify_embed_url}
                        width="100%"
                        height="352"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {concert.description && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                  <CardContent className="p-4">
                    <h2 className="text-base font-bold mb-3">Acerca del evento</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {concert.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Setlist Preview */}
              {setlist.length > 0 && (
                <Card className="rounded-[20px] border-linea bg-superficie">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <ListMusic className="h-4 w-4 text-periwinkle" />
                        Setlist
                      </h2>
                      {setlistUrl && (
                        <Link to={setlistUrl}>
                          <Button variant="outline" size="sm" className="rounded-full border-linea bg-transparent hover:bg-superficie-2">
                            Ver completo
                          </Button>
                        </Link>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {setlist.slice(0, 8).map((song) => (
                        <li key={song.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-periwinkle">•</span>
                          <span className="truncate">{song.song_name}</span>
                          {song.is_official && (
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">Oficial</Badge>
                          )}
                        </li>
                      ))}
                      {setlist.length > 8 && (
                        <li className="text-xs text-muted-foreground pt-1">
                          Y {setlist.length - 8} canciones más...
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="col-span-2 space-y-8">
                {/* Ticket Prices */}
                {concert.ticket_prices_html && (
                  <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardContent className="p-6">
                      <div
                        className="ticket-prices-content prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(concert.ticket_prices_html) }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {concert.description && (
                  <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-4">Acerca del evento</h2>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {concert.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Setlist Preview */}
                {setlist.length > 0 && (
                  <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <ListMusic className="h-5 w-5 text-periwinkle" />
                          Setlist
                        </h2>
                        {setlistUrl && (
                          <Link to={setlistUrl}>
                            <Button variant="outline" size="sm" className="rounded-full border-linea bg-transparent hover:bg-superficie-2">
                              Ver completo
                            </Button>
                          </Link>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {setlist.slice(0, 10).map((song) => (
                          <li key={song.id} className="flex items-center gap-3 text-muted-foreground">
                            <span className="text-periwinkle">•</span>
                            <span>{song.song_name}</span>
                            {song.is_official && (
                              <Badge variant="outline" className="text-xs">Oficial</Badge>
                            )}
                          </li>
                        ))}
                        {setlist.length > 10 && (
                          <li className="text-sm text-muted-foreground pt-2">
                            Y {setlist.length - 10} canciones más...
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Community */}
                <ConcertCommunity concertId={concert.id} concertTitle={concert.title} />

                {/* Spotify Embed */}
                {concert.spotify_embed_url && (
                  <Card className="rounded-[20px] border-linea bg-superficie">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Music className="h-5 w-5 text-periwinkle" />
                        Escucha en Spotify
                      </h2>
                      <div className="rounded-lg overflow-hidden">
                        <iframe
                          src={concert.spotify_embed_url}
                          width="100%"
                          height="352"
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* 1. Event Details Card */}
                <Card className="rounded-[20px] border-linea bg-superficie">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg">Detalles del evento</h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-periwinkle mt-0.5" />
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {formatDate(concert.date)}
                          </p>
                        </div>
                      </div>

                      {concert.venues && (
                        <>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-periwinkle mt-0.5" />
                            <div>
                              <p className="font-medium">Venue</p>
                              <p className="text-sm text-muted-foreground">
                                {concert.venues.name}
                              </p>
                            </div>
                          </div>

                          {concert.venues.cities && (
                            <div className="flex items-start gap-3">
                              <Globe className="h-5 w-5 text-periwinkle mt-0.5" />
                              <div>
                                <p className="font-medium">Ubicación</p>
                                <p className="text-sm text-muted-foreground">
                                  {concert.venues.cities.name}
                                  {concert.venues.cities.countries?.name && `, ${concert.venues.cities.countries.name}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {concert.promoters && (
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-periwinkle mt-0.5" />
                          <div>
                            <p className="font-medium">Promotor</p>
                            <p className="text-sm text-muted-foreground">
                              {concert.promoters.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUpcoming && concert.ticket_url && (
                      <Button className="w-full mt-4 rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95" asChild>
                        <a
                          href={withTicketTracking(concert.ticket_url)}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Comprar Entradas
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>




              </div>
            </div>

            <AdSenseUnit slot={AD_SLOTS.display} className="mt-12" />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ConcertDetail;
