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
        
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Lightbulb className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Fan Projects</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Únete a los proyectos de luces y sé parte del espectáculo. Descarga las secuencias antes del concierto y participa sin consumir datos.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando proyectos...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay proyectos activos en este momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {project.concert.image_url && (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={project.concert.image_url}
                          alt={project.concert.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl line-clamp-2">
                          {project.concert.title}
                        </CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          {project.songs_count} {project.songs_count === 1 ? 'canción' : 'canciones'}
                        </Badge>
                      </div>
                      {project.concert.artist && (
                        <p className="text-sm font-medium text-muted-foreground">
                          {project.concert.artist.name}
                        </p>
                      )}
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        {project.concert.date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDisplayDate(project.concert.date)}
                            </span>
                          </div>
                        )}
                        {project.concert.venue && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {project.concert.venue.name} - {project.concert.venue.location}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full" 
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
