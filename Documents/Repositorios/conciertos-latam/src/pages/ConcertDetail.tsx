import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Music, Globe, ListMusic, Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { SocialShare } from '@/components/SocialShare';
import { formatInBogota, isPastDate } from '@/lib/timezone';
import { useConcertDetail } from '@/hooks/queries/useConcertDetail';

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
      <div className="min-h-screen bg-background">
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
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-24">
            <div className="text-center">
              <Music className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Concierto no encontrado</h1>
              <p className="text-muted-foreground mb-8">
                El concierto que buscas no existe o ha sido eliminado.
              </p>
              <Link to="/concerts">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ver todos los conciertos
                </Button>
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
      "url": "https://www.conciertoslatam.app"
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
        type="music.song"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-12">
          <div className="container mx-auto px-4">
            <Breadcrumbs items={[
              { label: 'Conciertos', href: '/concerts' },
              { label: concert.title }
            ]} />

            {/* Hero Section - Redesigned */}
            <div className="bg-gradient-to-br from-card to-muted border border-border rounded-xl mb-6 sm:mb-8 overflow-hidden">
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
                        className="w-full aspect-square object-cover rounded-xl"
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
                      <Badge className={isUpcoming ? "bg-green-500 text-white mb-3" : "bg-muted text-muted-foreground mb-3"}>
                        {isUpcoming ? 'Próximo' : 'Finalizado'}
                      </Badge>
                      <h1 className="text-4xl font-bold text-foreground mb-2">
                        {concert.title}
                      </h1>
                      {concert.artists && (
                        <Link to={`/artists/${concert.artists.slug}`}>
                          <p className="text-xl text-primary hover:underline font-medium">
                            {concert.artists.name}
                          </p>
                        </Link>
                      )}
                    </div>

                    {/* Quick Info - Date & Venue */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-base text-foreground capitalize">
                          {formatDate(concert.date)}
                        </span>
                      </div>

                      {concert.venues && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
                <div className="relative bg-gradient-to-b from-background/10 to-transparent p-4">
                  <div className="flex items-start gap-4">
                    {/* Artist Image - Small, Left-aligned */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img
                        src={artistImage || concert.image_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop"}
                        alt={concert.artists?.name || concert.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Badge + Share in same row */}
                    <div className="flex-1 flex items-start justify-between">
                      <Badge className={isUpcoming ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}>
                        {isUpcoming ? 'Próximo' : 'Finalizado'}
                      </Badge>

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
                    <h1 className="text-xl font-bold text-foreground leading-tight mb-1">
                      {concert.title}
                    </h1>
                    {concert.artists && (
                      <Link to={`/artists/${concert.artists.slug}`}>
                        <p className="text-base text-primary hover:underline font-medium">
                          {concert.artists.name}
                        </p>
                      </Link>
                    )}
                  </div>

                  {/* Event Info - Compact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground capitalize">
                        {formatDate(concert.date)}
                      </span>
                    </div>

                    {concert.venues && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
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
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-base">Detalles del evento</h3>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">Venue</p>
                            <p className="text-xs text-muted-foreground">
                              {concert.venues.name}
                            </p>
                          </div>
                        </div>

                        {concert.venues.cities && (
                          <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                        <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      onClick={() => window.open(concert.ticket_url!, '_blank')}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Comprar Entradas
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Comunidad */}
              <ConcertCommunity concertId={concert.id} concertTitle={concert.title} />

              {/* 4. Compartir */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-base mb-3">Compartir</h3>
                  <SocialShare
                    title={concert.title}
                    url={`https://www.conciertoslatam.app/concerts/${concert.slug}`}
                  />
                </CardContent>
              </Card>

              {/* Ticket Prices */}
              {concert.ticket_prices_html && (
                <Card>
                  <CardContent className="p-4">
                    <div
                      className="ticket-prices-content prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: concert.ticket_prices_html }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {concert.description && (
                <Card>
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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <ListMusic className="h-4 w-4 text-primary" />
                        Setlist
                      </h2>
                      {setlistUrl && (
                        <Link to={setlistUrl}>
                          <Button variant="outline" size="sm">
                            Ver completo
                          </Button>
                        </Link>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {setlist.slice(0, 8).map((song) => (
                        <li key={song.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
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
                  <Card>
                    <CardContent className="p-6">
                      <div
                        className="ticket-prices-content prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: concert.ticket_prices_html }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {concert.description && (
                  <Card>
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
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <ListMusic className="h-5 w-5 text-primary" />
                          Setlist
                        </h2>
                        {setlistUrl && (
                          <Link to={setlistUrl}>
                            <Button variant="outline" size="sm">
                              Ver completo
                            </Button>
                          </Link>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {setlist.slice(0, 10).map((song) => (
                          <li key={song.id} className="flex items-center gap-3 text-muted-foreground">
                            <span className="text-primary">•</span>
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* 1. Event Details Card */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg">Detalles del evento</h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
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
                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="font-medium">Venue</p>
                              <p className="text-sm text-muted-foreground">
                                {concert.venues.name}
                              </p>
                            </div>
                          </div>

                          {concert.venues.cities && (
                            <div className="flex items-start gap-3">
                              <Globe className="h-5 w-5 text-primary mt-0.5" />
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
                          <Users className="h-5 w-5 text-primary mt-0.5" />
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
                      <Button
                        className="w-full mt-4"
                        onClick={() => window.open(concert.ticket_url!, '_blank')}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Comprar Entradas
                      </Button>
                    )}
                  </CardContent>
                </Card>



                {/* 3. Share */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Compartir</h3>
                    <SocialShare
                      title={concert.title}
                      url={`https://www.conciertoslatam.app/concerts/${concert.slug}`}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ConcertDetail;
