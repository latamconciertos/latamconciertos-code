import { useParams, Link } from 'react-router-dom';
import { Music, Calendar, Newspaper, ExternalLink, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDisplayDate } from '@/lib/timezone';
import {
  useArtistDetail,
  useArtistConcerts,
  useArtistNews,
  useArtistSpotifyTracks,
} from '@/hooks/queries/useArtistDetail';

const ArtistDetail = () => {
  const { slug } = useParams();

  const { data: artist, isLoading: artistLoading } = useArtistDetail(slug);
  const { data: concerts = [] } = useArtistConcerts(artist?.id);
  const { data: news = [] } = useArtistNews(artist?.id);
  const { data: topTracks = [] } = useArtistSpotifyTracks(artist?.name);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingSpinner message="Cargando artista..." />
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Music className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Artista no encontrado</h2>
            <Link to="/artists">
              <Button>Volver a artistas</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": artist.name,
    "description": artist.bio,
    "image": artist.photo_url,
    "url": `https://www.conciertoslatam.app/artists/${artist.slug}`,
    "event": concerts.map(concert => ({
      "@type": "MusicEvent",
      "name": concert.title,
      "startDate": concert.date,
      "location": {
        "@type": "Place",
        "name": concert.venues?.name,
        "address": concert.venues?.location
      }
    }))
  };

  return (
    <>
      <SEO
        title={`${artist.name} en Concierto | Próximas Fechas, Entradas y Setlists 2026`}
        description={artist.bio || `Descubre todos los conciertos de ${artist.name} en América Latina 2026. ${concerts.length} shows programados. Fechas, entradas, setlists, noticias y música. No te pierdas ver a ${artist.name} en vivo.`}
        keywords={`${artist.name}, ${artist.name} conciertos, ${artist.name} tour 2026, ${artist.name} en vivo, ${artist.name} tickets, ${artist.name} entradas, cuando toca ${artist.name}, ${artist.name} próximas fechas, ${artist.name} setlist, música ${artist.name}, ${concerts.map(c => c.venues?.location).filter(Boolean).join(', ')}`}
        image={artist.photo_url || undefined}
        url={`/artists/${artist.slug}`}
        type="music.song"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <Breadcrumbs items={[
              { label: 'Artistas', href: '/artists' },
              { label: artist.name }
            ]} />
          </div>

          {/* Hero Section with Modern Card Design */}
          <div className="relative">
            {/* Background Banner */}
            <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <img
                  src={artist.photo_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop"}
                  alt=""
                  className="w-full h-full object-cover blur-sm"
                />
              </div>
            </div>

            {/* Artist Card Floating */}
            <div className="container mx-auto px-4">
              <div className="relative -mt-52 md:-mt-64 mb-8">
                <Card className="overflow-hidden shadow-2xl border-2">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                      {/* Artist Photo - Circular */}
                      <div className="flex-shrink-0">
                        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl">
                          <img
                            src={artist.photo_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Badge className="mt-4 w-full justify-center py-2">
                          <Music className="h-4 w-4 mr-2" />
                          Artista Verificado
                        </Badge>
                      </div>

                      {/* Artist Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                          {artist.name}
                        </h1>
                        {artist.bio && (
                          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                            {artist.bio}
                          </p>
                        )}

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          {concerts.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{concerts.length} Conciertos</span>
                            </div>
                          )}
                          {news.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                              <Newspaper className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{news.length} Noticias</span>
                            </div>
                          )}
                          {topTracks.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                              <Music className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{topTracks.length} Canciones Top</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="container mx-auto px-4">
            <Tabs defaultValue="concerts" className="w-full">
              <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="concerts" className="text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Conciertos
                </TabsTrigger>
                <TabsTrigger value="news" className="text-sm md:text-base">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Noticias
                </TabsTrigger>
                <TabsTrigger value="music" className="text-sm md:text-base">
                  <Music className="h-4 w-4 mr-2" />
                  Música
                </TabsTrigger>
              </TabsList>

              {/* Concerts Tab */}
              <TabsContent value="concerts" className="space-y-8">
                {concerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {concerts.map((concert) => {
                      const concertDate = new Date(concert.date);
                      const isUpcoming = concertDate >= new Date();
                      const monthShort = concertDate.toLocaleDateString('es-ES', { month: 'short' });
                      const day = concertDate.getDate();

                      return (
                        <Link key={concert.id} to={`/concerts/${concert.slug}`}>
                          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                            {/* Image with artist photo */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <img
                                src={artist.photo_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"}
                                alt={artist.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {/* Status Badge */}
                              <Badge
                                className={`absolute top-3 left-3 ${isUpcoming ? 'bg-green-500 hover:bg-green-600' : 'bg-muted hover:bg-muted/80'}`}
                              >
                                {isUpcoming ? 'Próximo' : 'Pasado'}
                              </Badge>
                              {/* Date Badge */}
                              <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-xs font-medium capitalize">{monthShort}</span>
                                <span className="text-lg font-bold leading-none">{day}</span>
                              </div>
                            </div>
                            <CardContent className="p-5">
                              <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                {concert.title}
                              </h3>
                              <p className="text-primary font-medium text-sm mb-3">{artist.name}</p>
                              <div className="space-y-1.5 text-sm text-muted-foreground">
                                {concert.venues && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">{concert.venues.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="h-4 w-4 flex items-center justify-center text-xs">🌐</span>
                                      <span className="truncate">{concert.venues.location}</span>
                                    </div>
                                  </>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <span>{formatDisplayDate(concert.date)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay conciertos próximos</p>
                  </div>
                )}
              </TabsContent>

              {/* News Tab */}
              <TabsContent value="news" className="space-y-8">
                {news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((article) => (
                      <Link key={article.id} to={`/blog/${article.slug}`}>
                        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={article.featured_image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-6">
                            <div className="text-xs text-muted-foreground mb-2">
                              {formatDisplayDate(article.published_at)}
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            {article.meta_description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.meta_description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay noticias disponibles</p>
                  </div>
                )}
              </TabsContent>

              {/* Music Tab */}
              <TabsContent value="music" className="space-y-8">
                {topTracks.length > 0 ? (
                  <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="text-2xl font-bold mb-6">Top 5 Canciones en Spotify</h2>
                    {topTracks.map((track, index) => (
                      <Card key={track.id} className="group hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 text-3xl font-bold text-primary">
                              {index + 1}
                            </div>
                            <img
                              src={track.album.images[0]?.url}
                              alt={track.album.name}
                              className="w-16 h-16 rounded-md object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                {track.name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {track.album.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{formatDuration(track.duration_ms)}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(track.external_urls.spotify, '_blank')}
                              >
                                <ExternalLink className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron canciones en Spotify</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ArtistDetail;
