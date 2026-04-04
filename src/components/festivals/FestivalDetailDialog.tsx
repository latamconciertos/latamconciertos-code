import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Globe, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FestivalAttendanceButtons from '@/components/FestivalAttendanceButtons';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import type { FestivalWithRelations } from '@/types/entities/festival';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const getDefaultImage = () => getDefaultImageUtil('festival');

const formatDateRange = (startDate: string, endDate?: string | null) => {
  const start = parseISO(startDate);
  const startDay = format(start, 'd', { locale: es });
  const startMonth = format(start, 'MMM', { locale: es });

  if (!endDate) {
    return `${startDay} ${startMonth}`;
  }

  const end = parseISO(endDate);
  const endDay = format(end, 'd', { locale: es });

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }

  const endMonth = format(end, 'MMM', { locale: es });
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export interface FestivalDetailDialogProps {
  festival: FestivalWithRelations | null;
  onClose: () => void;
}

export const FestivalDetailDialog = ({ festival, onClose }: FestivalDetailDialogProps) => {
  return (
    <Dialog open={!!festival} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {festival && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{festival.name}</DialogTitle>
              {festival.edition && (
                <p className="text-lg text-muted-foreground">Edición {festival.edition}</p>
              )}
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Festival Image - Square */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <img
                  src={optimizeUnsplashUrl(
                    festival.image_url || getDefaultImage(),
                    { width: 800, height: 800, quality: 90 }
                  )}
                  alt={festival.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Column */}
              <div className="space-y-6">
                {/* Attendance Buttons */}
                <div className="flex justify-center md:justify-start">
                  <FestivalAttendanceButtons festivalId={festival.id} />
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="lineup">Lineup</TabsTrigger>
                    <TabsTrigger value="community">Comunidad</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    {festival.start_date && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <p className="text-lg">
                            {formatDateRange(festival.start_date, festival.end_date)}
                          </p>
                        </div>
                      </div>
                    )}

                    {festival.venues && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Venue</h3>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <p className="text-lg">{festival.venues.name}</p>
                          </div>
                        </div>

                        {festival.venues.cities && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-primary" />
                              <p className="text-lg">
                                {festival.venues.cities.name}
                                {festival.venues.cities.countries?.name &&
                                  `, ${festival.venues.cities.countries.name}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {festival.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                        <p className="text-muted-foreground">{festival.description}</p>
                      </div>
                    )}

                    {festival.ticket_url && (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(festival.ticket_url!, '_blank')}
                      >
                        <Ticket className="h-5 w-5 mr-2" />
                        Comprar Entradas
                      </Button>
                    )}

                    {festival.website_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(festival.website_url!, '_blank')}
                      >
                        <Globe className="h-5 w-5 mr-2" />
                        Sitio Web Oficial
                      </Button>
                    )}

                    {/* Link to full festival detail page */}
                    <Link to={`/festivals/${festival.slug}`} className="block">
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

                  <TabsContent value="lineup" className="pt-4">
                    {festival.lineup_artists && festival.lineup_artists.length > 0 ? (
                      <div className="space-y-2">
                        {festival.lineup_artists.map((artist, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}.</span>
                            <p className="font-semibold">{artist}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">Lineup por confirmar</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="community" className="pt-4">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        La funcionalidad de comunidad estará disponible próximamente
                      </p>
                    </div>
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
