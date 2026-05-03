import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calendar, MapPin, Music } from 'lucide-react';
import { formatDisplayDate } from '@/lib/timezone';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useFanProjects } from '@/hooks/queries/useFanProjects';

const FanProjects = () => {
  const navigate = useNavigate();

  // Use React Query for automatic caching and data fetching
  const { data: projects = [], isLoading } = useFanProjects();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      // Data fetching handled by React Query hook
    };

    checkAuth();
  }, [navigate]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { day: '', month: '', year: '' };

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('es', { month: 'short' }),
      year: date.getFullYear().toString(),
    };
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <LoadingSpinnerInline message="Cargando proyectos..." />
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate stats
  const totalSongs = projects.reduce((acc, p) => acc + p.songs_count, 0);

  return (
    <>
      <SEO
        title="Fan Projects - Conciertos LATAM"
        description="Únete a los proyectos de fans y sé parte del espectáculo de luces en los conciertos. Descarga secuencias y participa sin consumir datos."
        keywords="fan projects, proyectos de fans, luces concierto, secuencias, participación fans, conciertos interactivos"
      />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16" itemScope itemType="https://schema.org/CollectionPage">
          {/* Editorial Hero */}
          <header className="text-center mt-6 mb-10 md:mb-14">
            <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
              El show lo hacemos juntos
            </p>
            <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-4" itemProp="name">
              Fan Projects
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed" itemProp="description">
              Únete al espectáculo de luces. Descarga las secuencias antes del concierto y volvete parte del show — sin consumir datos.
            </p>

            {/* Stats — editorial */}
            <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mt-8 md:mt-10">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {projects.length}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  {projects.length === 1 ? 'Proyecto' : 'Proyectos'}
                </span>
              </div>
              {totalSongs > 0 && (
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    {totalSongs}
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    {totalSongs === 1 ? 'Canción' : 'Canciones'}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  Miles
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  De fans
                </span>
              </div>
            </div>
          </header>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="text-center max-w-md mx-auto py-16 md:py-24 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border border-border/60 mb-6">
                <Lightbulb className="h-9 w-9 text-muted-foreground/40" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                Próximamente
              </p>
              <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground mb-3">
                Sin proyectos activos
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Volvé pronto. Cuando un artista active un proyecto de luces para su próximo concierto, aparece acá.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {projects.map((project) => {
                const dateInfo = formatDate(project.concert.date);
                const imageUrl = project.concert.artist?.photo_url || project.concert.image_url || getDefaultImage();

                return (
                  <Card
                    key={project.id}
                    className="group overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer"
                    onClick={() => navigate(`/fan-projects/${project.id}`)}
                  >
                    {/* Image Section */}
                    <div className="relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`${project.concert.artist?.name || 'Artista'} - ${project.concert.title}`}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500 text-white font-bold px-3 py-1">
                          Activo
                        </Badge>
                      </div>

                      {/* Date Circle */}
                      {project.concert.date && (
                        <time
                          dateTime={project.concert.date}
                          className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-16 h-16 flex flex-col items-center justify-center text-center shadow-lg"
                        >
                          <span className="text-xs font-medium">{dateInfo.month}</span>
                          <span className="text-lg font-bold leading-none">{dateInfo.day}</span>
                        </time>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col h-[280px]">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                            {project.concert.title}
                          </h3>
                          {project.concert.artist && (
                            <p className="text-primary font-semibold text-lg mb-1">
                              {project.concert.artist.name}
                            </p>
                          )}
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            {project.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {project.concert.venue && (
                            <div className="flex items-center text-muted-foreground text-sm">
                              <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                              <span className="font-medium line-clamp-1">
                                {project.concert.venue.name}
                              </span>
                            </div>
                          )}

                          {project.concert.date && (
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                              <span className="line-clamp-1">
                                {formatDisplayDate(project.concert.date)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center text-muted-foreground text-sm">
                            <Music className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                            <span>
                              <strong className="text-foreground">{project.songs_count}</strong> canciones disponibles
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full group/btn mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/fan-projects/${project.id}`);
                        }}
                        aria-label={`Ver proyecto ${project.concert.title}`}
                      >
                        <Lightbulb className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" aria-hidden="true" />
                        Ver Proyecto
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main >

        <Footer />
      </div >
    </>
  );
};

export default FanProjects;
