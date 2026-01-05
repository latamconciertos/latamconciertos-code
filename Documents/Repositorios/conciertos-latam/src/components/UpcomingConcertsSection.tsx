import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Ticket, Music, ArrowRight, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { spotifyService } from '@/lib/spotify';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import { SocialShare } from './SocialShare';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUpcomingConcerts } from '@/hooks/queries';
import { LoadingSpinnerInline, LoadingSpinnerMini } from '@/components/ui/loading-spinner';

interface ConcertWithImage {
  id: string;
  title: string;
  slug: string;
  date: string;
  image_url: string | null;
  ticket_url: string | null;
  description: string | null;
  artist_image_url?: string;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  venues?: {
    name: string;
    location: string | null;
    cities?: {
      name: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

interface SetlistSong {
  id: string;
  song_name: string;
  artist_name: string;
  position: number;
  duration_seconds: number | null;
  notes: string | null;
}

const UpcomingConcertsSection = () => {
  // Optimized query with staleTime for better caching
  const { data: concerts = [], isLoading } = useUpcomingConcerts(6);
  const [concertsWithImages, setConcertsWithImages] = useState<ConcertWithImage[]>([]);
  const [selectedConcert, setSelectedConcert] = useState<ConcertWithImage | null>(null);
  const [setlist, setSetlist] = useState<SetlistSong[]>([]);
  const [loadingSetlist, setLoadingSetlist] = useState(false);
  const isMobile = useIsMobile();

  // Fetch artist images in parallel batches for better performance
  useEffect(() => {
    const fetchArtistImages = async () => {
      if (concerts.length === 0) {
        setConcertsWithImages([]);
        return;
      }

      // Process in batches of 3 for better performance
      const BATCH_SIZE = 3;
      const withImages: ConcertWithImage[] = [];

      for (let i = 0; i < concerts.length; i += BATCH_SIZE) {
        const batch = concerts.slice(i, i + BATCH_SIZE);

        // Fetch images in parallel within each batch
        const batchResults = await Promise.all(
          batch.map(async (concert) => {
            if (concert.artists?.name) {
              try {
                const artistImage = await spotifyService.getArtistImage(
                  concert.artists.name,
                  concert.artists.photo_url || undefined
                );
                return { ...concert, artist_image_url: artistImage } as ConcertWithImage;
              } catch (error) {
                console.error('Error fetching artist image:', error);
                return concert as ConcertWithImage;
              }
            }
            return concert as ConcertWithImage;
          })
        );

        withImages.push(...batchResults);
      }

      setConcertsWithImages(withImages);
    };

    fetchArtistImages();
  }, [concerts]);

  const fetchSetlist = async (concertId: string) => {
    setLoadingSetlist(true);
    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('concert_id', concertId)
        .order('position');

      if (error) throw error;
      setSetlist(data || []);
    } catch (error) {
      console.error('Error fetching setlist:', error);
      setSetlist([]);
    } finally {
      setLoadingSetlist(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es', { month: 'short' }),
      year: date.getFullYear()
    };
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Use optimized default image
  const getDefaultImage = () => getDefaultImageUtil('concert');

  const displayConcerts = concertsWithImages.length > 0 ? concertsWithImages : (concerts as ConcertWithImage[]);

  if (isLoading) {
    return (
      <section className="py-6 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando próximos conciertos..." />
        </div>
      </section>
    );
  }

  // Mobile horizontal scroll layout
  if (isMobile && displayConcerts.length > 0) {
    return (
      <section className="py-4 bg-muted/10">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Próximos Conciertos</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/concerts" className="text-xs">
                Ver todos
              </Link>
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {displayConcerts.map((concert) => {
              const dateInfo = concert.date ? formatDate(concert.date) : { day: 0, month: '', year: 0 };

              return (
                <Dialog key={concert.id}>
                  <DialogTrigger asChild>
                    <Card
                      className="flex-shrink-0 w-[280px] overflow-hidden cursor-pointer group shadow-md"
                      onClick={() => {
                        setSelectedConcert(concert);
                        fetchSetlist(concert.id);
                      }}
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={concert.artist_image_url || getDefaultImage()}
                          alt={concert.artists?.name || concert.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />

                        <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
                          Próximamente
                        </Badge>

                        <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-lg px-2 py-1 text-center shadow-lg">
                          <span className="text-xs font-medium">{dateInfo.month}</span>
                          <div className="text-base font-bold leading-none">{dateInfo.day}</div>
                        </div>
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                          {concert.title}
                        </h3>

                        <p className="text-primary font-medium text-xs mb-2 truncate">
                          {concert.artists?.name || 'Artista por confirmar'}
                        </p>

                        <div className="flex items-center text-muted-foreground text-xs mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{concert.venues?.name}</span>
                        </div>

                        {concert.venues?.cities && (
                          <div className="flex items-center text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {concert.venues.cities.name}
                              {concert.venues.cities.countries?.name &&
                                `, ${concert.venues.cities.countries.name}`}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg">{selectedConcert?.title}</DialogTitle>
                    </DialogHeader>

                    {selectedConcert && (
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="details">Detalles</TabsTrigger>
                          <TabsTrigger value="community">Comunidad</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
                          {/* Attendance Buttons */}
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">¿Vas a asistir?</h4>
                            <ConcertAttendanceButtons concertId={selectedConcert.id} />
                          </div>

                          {/* Concert Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-medium">Artista:</span>
                              <span>{selectedConcert.artists?.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-medium">Venue:</span>
                              <span>{selectedConcert.venues?.name}</span>
                            </div>
                            {selectedConcert.venues?.cities && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="font-medium">Ubicación:</span>
                                <span>
                                  {selectedConcert.venues.cities.name}
                                  {selectedConcert.venues.cities.countries?.name &&
                                    `, ${selectedConcert.venues.cities.countries.name}`}
                                </span>
                              </div>
                            )}
                            {selectedConcert.date && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="font-medium">Fecha:</span>
                                <span>{formatDate(selectedConcert.date).day}/{formatDate(selectedConcert.date).month}/{formatDate(selectedConcert.date).year}</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {selectedConcert.description && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Descripción</h4>
                              <p className="text-muted-foreground text-xs leading-relaxed">
                                {selectedConcert.description}
                              </p>
                            </div>
                          )}

                          {/* Setlist */}
                          <div>
                            <h4 className="font-semibold mb-2 text-sm flex items-center">
                              <Music className="h-4 w-4 mr-2" />
                              Setlist
                            </h4>

                            {loadingSetlist ? (
                              <LoadingSpinnerMini message="Cargando setlist..." />
                            ) : setlist.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {setlist.map((song) => (
                                  <div key={song.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-medium flex-shrink-0">
                                        {song.position}
                                      </span>
                                      <div>
                                        <p className="font-medium text-xs">{song.song_name}</p>
                                        {song.artist_name && (
                                          <p className="text-xs text-muted-foreground">{song.artist_name}</p>
                                        )}
                                      </div>
                                    </div>
                                    {song.duration_seconds && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDuration(song.duration_seconds)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-xs py-4 text-center">
                                El setlist aún no está disponible
                              </p>
                            )}
                          </div>

                          {/* View Full Page Button */}
                          <div className="border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground text-center mb-2">
                              Ver información completa de precios, fechas de preventa y más
                            </p>
                            <Button
                              variant="outline"
                              className="w-full"
                              size="sm"
                              asChild
                            >
                              <Link to={`/concerts/${selectedConcert.slug}`}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Ver página completa
                              </Link>
                            </Button>
                          </div>

                          {/* Tickets Button */}
                          {selectedConcert.ticket_url && (
                            <Button
                              className="w-full"
                              size="sm"
                              onClick={() => window.open(selectedConcert.ticket_url!, '_blank')}
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Comprar Entradas
                            </Button>
                          )}
                        </TabsContent>

                        <TabsContent value="community">
                          <ConcertCommunity
                            concertId={selectedConcert.id}
                            concertTitle={selectedConcert.title}
                          />
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop grid layout
  return (
    <section className="py-6 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground font-fira">Próximos conciertos</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/concerts">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {displayConcerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayConcerts.map((concert) => {
              const dateInfo = concert.date ? formatDate(concert.date) : { day: 0, month: '', year: 0 };

              return (
                <Dialog key={concert.id}>
                  <DialogTrigger asChild>
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => {
                        setSelectedConcert(concert);
                        fetchSetlist(concert.id);
                      }}
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={concert.artist_image_url || getDefaultImage()}
                          alt={concert.artists?.name || concert.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />

                        <Badge className="absolute top-3 left-3 bg-green-500 text-white text-xs">
                          Próximamente
                        </Badge>

                        <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center shadow-lg">
                          <span className="text-xs font-medium">{dateInfo.month}</span>
                          <div className="text-xl font-bold leading-none">{dateInfo.day}</div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {concert.title}
                        </h3>

                        <p className="text-primary font-medium text-sm mb-3">
                          {concert.artists?.name || 'Artista por confirmar'}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{concert.venues?.name}</span>
                          </div>

                          {concert.venues?.cities && (
                            <div className="flex items-center text-muted-foreground text-xs">
                              <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {concert.venues.cities.name}
                                {concert.venues.cities.countries?.name &&
                                  `, ${concert.venues.cities.countries.name}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{selectedConcert?.title}</DialogTitle>
                    </DialogHeader>

                    {selectedConcert && (
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="details">Detalles</TabsTrigger>
                          <TabsTrigger value="community">Comunidad</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6">
                          {/* Two Column Layout for Desktop */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column - Image */}
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={selectedConcert.artist_image_url || getDefaultImage()}
                                alt={selectedConcert.artists?.name || selectedConcert.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Right Column - Details */}
                            <div className="space-y-4">
                              {/* Attendance Buttons */}
                              <div>
                                <h4 className="font-semibold mb-2">¿Vas a asistir?</h4>
                                <ConcertAttendanceButtons concertId={selectedConcert.id} />
                              </div>

                              {/* Concert Info */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div>
                                    <span className="font-medium">Artista</span>
                                    <p className="text-muted-foreground">{selectedConcert.artists?.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div>
                                    <span className="font-medium">Venue</span>
                                    <p className="text-muted-foreground">{selectedConcert.venues?.name}</p>
                                  </div>
                                </div>
                                {selectedConcert.venues?.cities && (
                                  <div className="flex items-center space-x-3">
                                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                      <span className="font-medium">Ubicación</span>
                                      <p className="text-muted-foreground">
                                        {selectedConcert.venues.cities.name}
                                        {selectedConcert.venues.cities.countries?.name &&
                                          `, ${selectedConcert.venues.cities.countries.name}`}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {selectedConcert.date && (
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                      <span className="font-medium">Fecha</span>
                                      <p className="text-muted-foreground">
                                        {formatDate(selectedConcert.date).day}/{formatDate(selectedConcert.date).month}/{formatDate(selectedConcert.date).year}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              {selectedConcert.description && (
                                <div>
                                  <h4 className="font-semibold mb-2">Descripción</h4>
                                  <p className="text-muted-foreground text-sm leading-relaxed">
                                    {selectedConcert.description}
                                  </p>
                                </div>
                              )}

                              {/* View Full Page Button */}
                              <div className="border-t border-border pt-4">
                                <p className="text-sm text-muted-foreground text-center mb-3">
                                  Ver información completa de precios, fechas de preventa y más
                                </p>
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  asChild
                                >
                                  <Link to={`/concerts/${selectedConcert.slug}`}>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Ver página completa
                                  </Link>
                                </Button>
                              </div>

                              {/* Tickets Button */}
                              {selectedConcert.ticket_url && (
                                <Button
                                  className="w-full"
                                  onClick={() => window.open(selectedConcert.ticket_url!, '_blank')}
                                >
                                  <Ticket className="h-4 w-4 mr-2" />
                                  Comprar Entradas
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Setlist - Full Width */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Music className="h-5 w-5 mr-2" />
                              Setlist
                            </h4>

                            {loadingSetlist ? (
                              <LoadingSpinnerMini message="Cargando setlist..." />
                            ) : setlist.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {setlist.map((song) => (
                                  <div key={song.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center font-medium flex-shrink-0">
                                        {song.position}
                                      </span>
                                      <div>
                                        <p className="font-medium text-sm">{song.song_name}</p>
                                        {song.artist_name && (
                                          <p className="text-xs text-muted-foreground">{song.artist_name}</p>
                                        )}
                                      </div>
                                    </div>
                                    {song.duration_seconds && (
                                      <span className="text-sm text-muted-foreground">
                                        {formatDuration(song.duration_seconds)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm py-8 text-center bg-muted/30 rounded-lg">
                                El setlist aún no está disponible
                              </p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="community">
                          <ConcertCommunity
                            concertId={selectedConcert.id}
                            concertTitle={selectedConcert.title}
                          />
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No hay conciertos próximos programados</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingConcertsSection;
