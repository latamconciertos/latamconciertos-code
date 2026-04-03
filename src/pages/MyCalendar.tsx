import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Music, ExternalLink, Download, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMyCalendarConcerts, CalendarConcert } from '@/hooks/queries/useMyCalendar';

type AttendanceType = 'attending' | 'tentative' | 'favorite';

const MyCalendar = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AttendanceType>('attending');

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const { data: concerts = [], isLoading } = useMyCalendarConcerts(userId ?? undefined, activeTab);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
    };
  };

  const exportToICS = () => {
    const icsContent = generateICS(concerts);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis-conciertos.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Calendario exportado');
  };

  const generateICS = (concerts: CalendarConcert[]) => {
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Conciertos Latam//ES\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';

    concerts.forEach(concert => {
      const date = new Date(concert.date);
      const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${concert.id}@conciertoslatam.com\r\n`;
      ics += `DTSTAMP:${dateStr}\r\n`;
      ics += `DTSTART:${dateStr}\r\n`;
      ics += `SUMMARY:${concert.title}\r\n`;
      ics += `DESCRIPTION:Concierto de ${concert.artists?.name || 'Artista'}\r\n`;
      ics += `LOCATION:${concert.venues?.name || ''} - ${concert.venues?.location || ''}\r\n`;
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return ics;
  };

  if (isLoading || !userId) {
    return <LoadingSpinner message="Cargando calendario..." />;
  }

  return (
    <>
      <SEO
        title="Mi Calendario de Conciertos"
        description="Administra los conciertos a los que asistirás, marca tus favoritos y exporta tu calendario personal de eventos musicales"
        keywords="calendario conciertos, eventos musicales, mi calendario, conciertos favoritos, próximos conciertos"
      />
      <Header />
      <main className="min-h-screen bg-background pt-20 sm:pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header - Compact */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Mis Conciertos
              </h1>
              <p className="text-sm text-muted-foreground">
                {concerts.length} evento{concerts.length !== 1 ? 's' : ''}
              </p>
            </div>
            {concerts.length > 0 && (
              <Button onClick={exportToICS} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AttendanceType)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-9 p-0.5 bg-muted/50">
              <TabsTrigger value="attending" className="text-xs sm:text-sm data-[state=active]:bg-background">
                Confirmados
              </TabsTrigger>
              <TabsTrigger value="tentative" className="text-xs sm:text-sm data-[state=active]:bg-background">
                Tentativos
              </TabsTrigger>
              <TabsTrigger value="favorite" className="text-xs sm:text-sm data-[state=active]:bg-background">
                Favoritos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {concerts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">Sin conciertos</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {activeTab === 'attending' && 'No has confirmado asistencia'}
                    {activeTab === 'tentative' && 'Sin conciertos tentativos'}
                    {activeTab === 'favorite' && 'Sin favoritos'}
                  </p>
                  <Button onClick={() => navigate('/concerts')} size="sm" className="h-8 text-xs">
                    Explorar Conciertos
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {concerts.map((concert) => {
                    const dateInfo = formatShortDate(concert.date);
                    return (
                      <Card key={concert.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-0">
                          <Link to={`/concerts/${concert.slug}`} className="flex items-stretch">
                            {/* Date Column */}
                            <div className="flex-shrink-0 w-14 sm:w-16 bg-primary/5 flex flex-col items-center justify-center py-3 border-r border-border/30">
                              <span className="text-lg sm:text-xl font-bold text-primary">{dateInfo.day}</span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">{dateInfo.month}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 p-3 sm:p-4 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
                                {concert.title}
                              </h3>
                              
                              {concert.artists && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                  <Music className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{concert.artists.name}</span>
                                </div>
                              )}
                              
                              {concert.venues && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{concert.venues.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Image */}
                            <div className="flex-shrink-0 w-16 sm:w-20 h-auto">
                              <img
                                src={concert.image_url || concert.artists?.photo_url || '/placeholder.svg'}
                                alt={concert.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>
                          
                          {/* Ticket Button */}
                          {concert.ticket_url && (
                            <div className="px-3 pb-2 pt-0">
                              <Button asChild variant="outline" size="sm" className="w-full h-7 text-xs gap-1">
                                <a href={concert.ticket_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                  Ver Tickets
                                </a>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MyCalendar;
