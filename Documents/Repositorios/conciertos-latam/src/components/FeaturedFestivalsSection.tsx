import { PartyPopper, MapPin, ArrowRight, Music, Calendar, Globe, Ticket, Info, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FestivalAttendanceButtons from '@/components/FestivalAttendanceButtons';
import { optimizeUnsplashUrl } from '@/lib/imageOptimization';
import { useState } from 'react';

const FeaturedFestivalsSection = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedFestival, setSelectedFestival] = useState<any>(null);

  const { data: festivals = [], isLoading } = useQuery({
    queryKey: ['festivals', 'upcoming', 4],
    queryFn: async () => {
      const result = await festivalService.getUpcoming(4);
      return result.data || [];
    },
  });

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es', { month: 'short' }),
      year: date.getFullYear()
    };
  };

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

  const getDefaultImage = () => "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop";

  const handleFestivalClick = (festival: any) => {
    setSelectedFestival(festival);
  };

  const handleCloseDialog = () => {
    setSelectedFestival(null);
  };

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando festivales..." />
        </div>
      </section>
    );
  }

  if (festivals.length === 0) {
    return null;
  }

  // Mobile horizontal scroll layout
  if (isMobile) {
    return (
      <section className="py-4 bg-background">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Próximos Festivales</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/festivals" className="text-xs">
                Ver todos
              </Link>
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {festivals.map((festival) => {
              const dateInfo = formatDate(festival.start_date);

              return (
                <Card
                  key={festival.id}
                  className="flex-shrink-0 w-[280px] overflow-hidden cursor-pointer group shadow-md"
                  onClick={() => handleFestivalClick(festival)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={festival.image_url || getDefaultImage()}
                      alt={festival.name}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {festival.edition && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
                        Edición {festival.edition}
                      </Badge>
                    )}

                    <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-lg px-2 py-1 text-center shadow-lg">
                      <span className="text-xs font-medium">{dateInfo.month}</span>
                      <div className="text-base font-bold leading-none">{dateInfo.day}</div>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                      {festival.name}
                    </h3>

                    {festival.venues && (
                      <>
                        <div className="flex items-center text-muted-foreground text-xs mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{festival.venues.name}</span>
                        </div>

                        {festival.venues.cities && (
                          <div className="flex items-center text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {festival.venues.cities.name}
                              {festival.venues.cities.countries?.name &&
                                `, ${festival.venues.cities.countries.name}`}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Festival Details Dialog - Mobile */}
        <Dialog open={!!selectedFestival} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            {selectedFestival && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl">{selectedFestival.name}</DialogTitle>
                  {selectedFestival.edition && (
                    <p className="text-base sm:text-lg text-muted-foreground">Edición {selectedFestival.edition}</p>
                  )}
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Festival Image */}
                  <div className="relative w-full aspect-video md:aspect-square rounded-lg overflow-hidden">
                    <img
                      src={optimizeUnsplashUrl(
                        selectedFestival.image_url || getDefaultImage(),
                        { width: 800, height: 800, quality: 90 }
                      )}
                      alt={selectedFestival.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Column */}
                  <div className="space-y-4 md:space-y-6">
                    {/* Attendance Buttons */}
                    <div className="flex justify-center md:justify-start">
                      <FestivalAttendanceButtons festivalId={selectedFestival.id} />
                    </div>

                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Detalles</TabsTrigger>
                        <TabsTrigger value="lineup">Lineup</TabsTrigger>
                        <TabsTrigger value="community">Comunidad</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 pt-4">
                        {selectedFestival.start_date && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-primary" />
                              <p className="text-base sm:text-lg">
                                {formatDateRange(selectedFestival.start_date, selectedFestival.end_date)}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedFestival.venues && (
                          <>
                            <div>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Venue</h3>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <p className="text-base sm:text-lg">{selectedFestival.venues.name}</p>
                              </div>
                            </div>

                            {selectedFestival.venues.cities && (
                              <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-primary" />
                                  <p className="text-base sm:text-lg">
                                    {selectedFestival.venues.cities.name}
                                    {selectedFestival.venues.cities.countries?.name &&
                                      `, ${selectedFestival.venues.cities.countries.name}`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {selectedFestival.description && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                            <p className="text-muted-foreground">{selectedFestival.description}</p>
                          </div>
                        )}

                        {selectedFestival.ticket_url && (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => window.open(selectedFestival.ticket_url, '_blank')}
                          >
                            <Ticket className="h-5 w-5 mr-2" />
                            Comprar Entradas
                          </Button>
                        )}

                        <Link to={`/festivals/${selectedFestival.slug}`} className="block">
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
                        <div className="text-center py-8">
                          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">Lineup por confirmar</p>
                        </div>
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
      </section>
    );
  }

  // Desktop grid layout
  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground font-fira">Próximos Festivales</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/festivals">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {festivals.map((festival) => {
            const dateInfo = formatDate(festival.start_date);

            return (
              <Card
                key={festival.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleFestivalClick(festival)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={festival.image_url || getDefaultImage()}
                    alt={festival.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {festival.edition && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">
                      Edición {festival.edition}
                    </Badge>
                  )}

                  <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center shadow-lg">
                    <span className="text-xs font-medium">{dateInfo.month}</span>
                    <div className="text-xl font-bold leading-none">{dateInfo.day}</div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {festival.name}
                  </h3>

                  <div className="space-y-1">
                    {festival.venues && (
                      <>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{festival.venues.name}</span>
                        </div>

                        {festival.venues.cities && (
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {festival.venues.cities.name}
                              {festival.venues.cities.countries?.name &&
                                `, ${festival.venues.cities.countries.name}`}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Festival Details Dialog */}
      <Dialog open={!!selectedFestival} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          {selectedFestival && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl">{selectedFestival.name}</DialogTitle>
                {selectedFestival.edition && (
                  <p className="text-base sm:text-lg text-muted-foreground">Edición {selectedFestival.edition}</p>
                )}
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Festival Image - Square */}
                <div className="relative w-full aspect-video md:aspect-square rounded-lg overflow-hidden">
                  <img
                    src={optimizeUnsplashUrl(
                      selectedFestival.image_url || getDefaultImage(),
                      { width: 800, height: 800, quality: 90 }
                    )}
                    alt={selectedFestival.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content Column */}
                <div className="space-y-4 md:space-y-6">
                  {/* Attendance Buttons */}
                  <div className="flex justify-center md:justify-start">
                    <FestivalAttendanceButtons festivalId={selectedFestival.id} />
                  </div>

                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="lineup">Lineup</TabsTrigger>
                      <TabsTrigger value="community">Comunidad</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 pt-4">
                      {selectedFestival.start_date && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <p className="text-base sm:text-lg">
                              {formatDateRange(selectedFestival.start_date, selectedFestival.end_date)}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedFestival.venues && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Venue</h3>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              <p className="text-base sm:text-lg">{selectedFestival.venues.name}</p>
                            </div>
                          </div>

                          {selectedFestival.venues.cities && (
                            <div>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                              <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <p className="text-base sm:text-lg">
                                  {selectedFestival.venues.cities.name}
                                  {selectedFestival.venues.cities.countries?.name &&
                                    `, ${selectedFestival.venues.cities.countries.name}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {selectedFestival.description && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                          <p className="text-muted-foreground">{selectedFestival.description}</p>
                        </div>
                      )}

                      {selectedFestival.ticket_url && (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => window.open(selectedFestival.ticket_url, '_blank')}
                        >
                          <Ticket className="h-5 w-5 mr-2" />
                          Comprar Entradas
                        </Button>
                      )}

                      <Link to={`/festivals/${selectedFestival.slug}`} className="block">
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
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">Lineup por confirmar</p>
                      </div>
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
    </section>
  );
};

export default FeaturedFestivalsSection;
