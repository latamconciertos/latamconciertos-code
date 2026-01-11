import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calendar, MapPin } from 'lucide-react';
import { formatDisplayDate } from '@/lib/timezone';

interface FanProject {
  id: string;
  name: string;
  description: string;
  concert: {
    id: string;
    title: string;
    date: string;
    image_url: string;
    artist: {
      name: string;
    } | null;
    venue: {
      name: string;
      location: string;
    } | null;
  };
  songs_count: number;
}

const FanProjects = () => {
  const [projects, setProjects] = useState<FanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
      loadProjects();
    };

    checkAuth();
  }, [navigate]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_projects')
        .select(`
          id,
          name,
          description,
          concert:concerts (
            id,
            title,
            date,
            image_url,
            artist:artists (name),
            venue:venues (name, location)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get song counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project: any) => {
          const { count } = await supabase
            .from('fan_project_songs')
            .select('*', { count: 'exact', head: true })
            .eq('fan_project_id', project.id);

          return {
            ...project,
            songs_count: count || 0,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error loading fan projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SEO
        title="Fan Projects - Conciertos LATAM"
        description="Únete a los proyectos de fans y sé parte del espectáculo de luces en los conciertos"
      />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 pt-28 sm:pt-32 pb-20 min-h-[calc(100vh-200px)]">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Hero Section - Mobile optimized */}
            <div className="text-center space-y-3 sm:space-y-4 px-2">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <Lightbulb className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                  Fan Projects
                </h1>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Únete a los proyectos de luces y sé parte del espectáculo. Descarga las secuencias antes del concierto y participa sin consumir datos.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 sm:py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-sm sm:text-base text-muted-foreground">Cargando proyectos...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4 sm:mb-6">
                  <Lightbulb className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                </div>
                <p className="text-base sm:text-lg text-muted-foreground font-medium">
                  No hay proyectos activos en este momento
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Vuelve pronto para ver los próximos eventos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/20"
                  >
                    {project.concert.image_url && (
                      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/5 to-muted relative group">
                        <img
                          src={project.concert.image_url}
                          alt={project.concert.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg sm:text-xl line-clamp-2 leading-tight">
                          {project.concert.title}
                        </CardTitle>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {project.songs_count}
                        </Badge>
                      </div>
                      {project.concert.artist && (
                        <p className="text-sm font-semibold text-primary mb-1">
                          {project.concert.artist.name}
                        </p>
                      )}
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                        {project.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                      <div className="space-y-2 text-sm">
                        {project.concert.date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="font-medium">
                              {formatDisplayDate(project.concert.date)}
                            </span>
                          </div>
                        )}
                        {project.concert.venue && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1 text-xs sm:text-sm">
                              {project.concert.venue.name} - {project.concert.venue.location}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full h-11 sm:h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                        onClick={() => navigate(`/fan-projects/${project.id}`)}
                      >
                        Ver Proyecto
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FanProjects;
