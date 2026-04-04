import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Music, Globe, Info, ListMusic, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { SocialShare } from '@/components/SocialShare';
import { LoadingSpinnerMini } from '@/components/ui/loading-spinner';
import type { ConcertPageItem } from '@/hooks/queries/useConcertsPage';
import { useSetlistByConcert } from '@/hooks/queries/useSetlists';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import { formatDate } from './ConcertCard';

export interface ConcertDetailDialogProps {
  concert: ConcertPageItem | null;
  onClose: () => void;
}

const getDefaultImage = () => getDefaultImageUtil('concert');

export const ConcertDetailDialog = ({ concert, onClose }: ConcertDetailDialogProps) => {
  // Setlist query for selected concert
  const { data: setlist = [], isLoading: loadingSetlist } = useSetlistByConcert(
    concert?.id || ''
  );

  return (
    <Dialog open={!!concert} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {concert && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{concert.title}</DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Concert Image - Square */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <img
                  src={concert.artist_image_url || getDefaultImage()}
                  alt={concert.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Column */}
              <div className="space-y-6">
                {/* Attendance Buttons */}
                <div className="flex justify-center md:justify-start">
                  <ConcertAttendanceButtons concertId={concert.id} />
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="setlist">Setlist</TabsTrigger>
                    <TabsTrigger value="community">Comunidad</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    {concert.artists?.name && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Artista</h3>
                        <p className="text-lg font-semibold text-primary">{concert.artists.name}</p>
                      </div>
                    )}

                    {concert.date && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <p className="text-lg">{formatDate(concert.date).fullDate}</p>
                        </div>
                      </div>
                    )}

                    {concert.venues && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Lugar</h3>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <p className="text-lg">{concert.venues.name}</p>
                          </div>
                        </div>

                        {concert.venues.cities && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-primary" />
                              <p className="text-lg">
                                {concert.venues.cities.name}
                                {concert.venues.cities.countries?.name &&
                                  `, ${concert.venues.cities.countries.name}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {concert.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                        <p className="text-muted-foreground">{concert.description}</p>
                      </div>
                    )}

                    {concert.ticket_url && (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(concert.ticket_url!, '_blank')}
                      >
                        <Ticket className="h-5 w-5 mr-2" />
                        Comprar Entradas
                      </Button>
                    )}

                    {/* Link to full concert detail page */}
                    <Link to={`/concerts/${concert.slug}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Info className="h-5 w-5" />
                        Ver página completa
                      </Button>
                    </Link>
                  </TabsContent>

                  <TabsContent value="setlist" className="pt-4">
                    {loadingSetlist ? (
                      <div className="text-center py-8">
                        <LoadingSpinnerMini message="Cargando setlist..." />
                      </div>
                    ) : setlist && setlist.length > 0 ? (
                      <div className="space-y-4">
                        <SocialShare
                          url={`https://www.conciertoslatam.app/concerts#${concert.slug}`}
                          title={`Setlist de ${concert.title}`}
                          setlistData={{
                            concertTitle: concert.title,
                            artistName: concert.artists?.name,
                            date: concert.date ?? undefined,
                            songs: setlist.map((song: any) => ({
                              song_name: song.song_name,
                              artist_name: song.artist_name || undefined
                            }))
                          }}
                        />
                        <div className="space-y-2">
                          {setlist.map((song: any, index) => (
                            <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}.</span>
                              <div className="flex-1">
                                <p className="font-semibold">{song.song_name}</p>
                                {song.artist_name && (
                                  <p className="text-sm text-muted-foreground">{song.artist_name}</p>
                                )}
                                {song.notes && (
                                  <p className="text-sm text-muted-foreground italic">{song.notes}</p>
                                )}
                              </div>
                              {song.spotify_url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(song.spotify_url!, '_blank')}
                                >
                                  <Music className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* View Full Page Button */}
                        <div className="border-t border-border pt-3 mt-4">
                          <p className="text-xs text-muted-foreground text-center mb-2">
                            Ver información completa de precios, fechas de preventa y más
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                            asChild
                          >
                            <Link to={`/concerts/${concert?.slug}`}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Ver página completa
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ListMusic className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No hay setlist disponible aún</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="community" className="pt-4">
                    <ConcertCommunity
                      concertId={concert.id}
                      concertTitle={concert.title}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
