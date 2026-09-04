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
      {/* "Evolución Nocturna": el diálogo se monta en un portal, así que lleva su propio contexto oscuro */}
      <DialogContent className="dark font-fira max-w-5xl max-h-[90vh] overflow-y-auto rounded-[20px] border-linea bg-noche text-texto">
        {festival && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-[0.01em] text-texto">{festival.name}</DialogTitle>
              {festival.edition && (
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-verde">Edición {festival.edition}</p>
              )}
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Festival Image - Square */}
              <div className="relative w-full aspect-square rounded-[20px] border border-linea bg-superficie-2 overflow-hidden">
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
                  <TabsList className="grid w-full grid-cols-3 h-auto rounded-none bg-transparent p-0 border-b border-linea">
                    {[
                      { value: 'details', label: 'Detalles' },
                      { value: 'lineup', label: 'Lineup' },
                      { value: 'community', label: 'Comunidad' },
                    ].map(({ value, label }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-texto-2 data-[state=active]:border-verde data-[state=active]:bg-transparent data-[state=active]:text-texto data-[state=active]:shadow-none"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    {festival.start_date && (
                      <div>
                        <h3 className="text-sm font-semibold text-texto-2 mb-1">Fecha</h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-periwinkle" />
                          <p className="text-lg">
                            {formatDateRange(festival.start_date, festival.end_date)}
                          </p>
                        </div>
                      </div>
                    )}

                    {festival.venues && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-texto-2 mb-1">Venue</h3>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-periwinkle" />
                            <p className="text-lg">{festival.venues.name}</p>
                          </div>
                        </div>

                        {festival.venues.cities && (
                          <div>
                            <h3 className="text-sm font-semibold text-texto-2 mb-1">Ubicación</h3>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-periwinkle" />
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
                        <h3 className="text-sm font-semibold text-texto-2 mb-1">Descripción</h3>
                        <p className="text-texto-2">{festival.description}</p>
                      </div>
                    )}

                    {festival.ticket_url && (
                      <Button
                        className="w-full rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95"
                        size="lg"
                        onClick={() => window.open(festival.ticket_url!, '_blank')}
                      >
                        <Ticket className="h-5 w-5 mr-2" />
                        Comprar entradas
                      </Button>
                    )}

                    {festival.website_url && (
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto"
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
                        className="w-full gap-2 rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto"
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
                            className="flex items-center gap-3 p-3 rounded-2xl border border-linea bg-superficie hover:bg-superficie-2 transition-colors"
                          >
                            <span className="font-display text-2xl font-extrabold text-verde w-8 leading-none">{index + 1}</span>
                            <p className="font-semibold text-texto">{artist}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 text-periwinkle/40 mx-auto mb-3" />
                        <p className="text-texto-2">Lineup por confirmar</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="community" className="pt-4">
                    <div className="text-center py-8">
                      <p className="text-texto-2">
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
