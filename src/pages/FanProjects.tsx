import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="dark font-fira min-h-screen bg-noche text-texto flex flex-col">
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

      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16" itemScope itemType="https://schema.org/CollectionPage">
          {/* Editorial Hero */}
          <header className="text-center mt-6 mb-10 md:mb-14">
            <span className="eyebrow-nocturno justify-center mb-3">
              El show lo hacemos juntos
            </span>
            <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.01em] leading-[0.92] text-foreground text-balance mb-4" itemProp="name">
              Fan Projects
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed" itemProp="description">
              Únete al espectáculo de luces. Descarga las secuencias antes del concierto y volvete parte del show — sin consumir datos.
            </p>

            {/* Stats — editorial */}
            <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mt-8 md:mt-10">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-[0.01em] leading-none">
                  {projects.length}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  {projects.length === 1 ? 'Proyecto' : 'Proyectos'}
                </span>
              </div>
              {totalSongs > 0 && (
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-[0.01em] leading-none">
                    {totalSongs}
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    {totalSongs === 1 ? 'Canción' : 'Canciones'}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-[0.01em] leading-none">
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-superficie border border-linea mb-6">
                <Lightbulb className="h-9 w-9 text-periwinkle/40" />
              </div>
              <span className="eyebrow-nocturno justify-center mb-2">
                Próximamente
              </span>
              <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-3">
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
                    className="group overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/fan-projects/${project.id}`)}
                  >
                    {/* Image Section */}
                    <div className="relative overflow-hidden bg-superficie-2">
                      <img
                        src={imageUrl}
                        alt={`${project.concert.artist?.name || 'Artista'} - ${project.concert.title}`}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Overlay para que los chips respiren sobre la foto */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
                      />

                      {/* Badge "activo" con punto vivo */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-verde/30 bg-noche/80 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-verde">
                          <span className="h-1.5 w-1.5 rounded-full bg-verde punto-vivo" aria-hidden="true" />
                          Activo
                        </span>
                      </div>

                      {/* Chip de fecha */}
                      {project.concert.date && (
                        <time
                          dateTime={project.concert.date}
                          className="absolute bottom-4 right-4 flex flex-col items-center justify-center rounded-2xl border border-linea bg-noche/80 backdrop-blur-sm px-3 py-2 text-center"
                        >
                          <span className="font-display text-2xl font-extrabold leading-none text-verde">{dateInfo.day}</span>
                          <span className="font-fira text-[10px] uppercase tracking-[0.12em] text-texto-2 mt-0.5">{dateInfo.month}</span>
                        </time>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col h-[280px]">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-bold text-xl text-foreground group-hover:text-periwinkle transition-colors mb-2 line-clamp-2">
                            {project.concert.title}
                          </h3>
                          {project.concert.artist && (
                            <p className="text-periwinkle font-semibold text-xs uppercase tracking-[0.14em] mb-1">
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
                              <MapPin className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
                              <span className="font-medium line-clamp-1">
                                {project.concert.venue.name}
                              </span>
                            </div>
                          )}

                          {project.concert.date && (
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
                              <span className="line-clamp-1">
                                {formatDisplayDate(project.concert.date)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center text-muted-foreground text-sm">
                            <Music className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
                            <span>
                              <strong className="text-foreground">{project.songs_count}</strong> canciones disponibles
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full group/btn mt-4 rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95"
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
