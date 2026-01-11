import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionSelectModal } from '@/components/SectionSelectModal';
import { useFanProjectStorage } from '@/hooks/useFanProjectStorage';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Download, Check, Edit, Music } from 'lucide-react';

interface VenueSection {
  id: string;
  name: string;
  code: string;
}

interface Song {
  id: string;
  song_name: string;
  artist_name: string | null;
  duration_seconds: number;
}

interface FanProject {
  id: string;
  name: string;
  description: string;
  instructions: string;
  concert: {
    title: string;
    date: string;
    venue: {
      name: string;
      id: string;
    } | null;
  };
}

const FanProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    saveSequence,
    isPreloaded,
    preloadProjectSection,
    loadSequencesFromSupabase
  } = useFanProjectStorage();

  const [project, setProject] = useState<FanProject | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
      loadProjectData(session.user.id);
    };

    checkAuth();
  }, [projectId, navigate]);

  const loadProjectData = async (uid: string) => {
    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('fan_projects')
        .select(`
          id,
          name,
          description,
          instructions,
          concert:concerts (
            title,
            date,
            venue:venues (id, name)
          )
        `)
        .eq('id', projectId)
        .eq('status', 'active')
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load venue sections for this project
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('venue_sections')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('display_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Load songs
      const { data: songsData, error: songsError } = await supabase
        .from('fan_project_songs')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('position');

      if (songsError) throw songsError;
      setSongs(songsData || []);

      // Check if user has already selected a section
      const { data: participantData } = await supabase
        .from('fan_project_participants')
        .select('venue_section_id')
        .eq('fan_project_id', projectId)
        .eq('user_id', uid)
        .single();

      if (participantData) {
        setSelectedSection(participantData.venue_section_id);
      } else {
        setShowSectionModal(true);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('fan_project_participants')
        .upsert(
          {
            fan_project_id: projectId!,
            user_id: userId,
            venue_section_id: sectionId,
          },
          {
            onConflict: 'user_id,fan_project_id',
          }
        );

      if (error) throw error;

      setSelectedSection(sectionId);
      setShowSectionModal(false);
      toast({
        title: 'Localidad guardada',
        description: 'Tu localidad ha sido guardada exitosamente',
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar tu localidad',
        variant: 'destructive',
      });
    }
  };


  const handlePreload = async (songId: string) => {
    if (!selectedSection) {
      toast({
        title: 'Selecciona tu localidad',
        description: 'Primero debes seleccionar tu localidad',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Try CDN-optimized bulk loading first
      const cdnSuccess = await preloadProjectSection(projectId!, selectedSection);

      if (cdnSuccess) {
        // CDN load successful - all songs preloaded at once
        toast({
          title: '✅ Todas las secuencias descargadas',
          description: 'Todas las canciones están listas para usar sin conexión (CDN optimizado)',
        });
        return;
      }

      // Fallback to individual Supabase loading (original method)
      console.info('Using Supabase fallback for individual song');
      const supabaseData = await loadSequencesFromSupabase(projectId!, songId, selectedSection);

      if (!supabaseData) {
        throw new Error('No se pudo cargar la secuencia');
      }

      const success = saveSequence(
        projectId!,
        songId,
        selectedSection,
        supabaseData.sequence as any,
        supabaseData.mode
      );

      if (success) {
        toast({
          title: 'Secuencia descargada',
          description: 'La secuencia está lista para usar sin conexión',
        });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error preloading sequence:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar la secuencia',
        variant: 'destructive',
      });
    }
  };


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4">
              <Lightbulb className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg sm:text-xl font-semibold text-foreground">Proyecto no encontrado</p>
            <p className="text-sm text-muted-foreground">El proyecto que buscas no existe o fue eliminado</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${project.name} - Fan Projects`}
        description={project.description || ''}
      />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 pt-28 sm:pt-32 pb-20 min-h-[calc(100vh-200px)]">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Header Section - Mobile optimized */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                    {project.name}
                  </h1>
                  <p className="text-base sm:text-lg text-primary font-semibold truncate">
                    {project.concert.title}
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10">
                    <Lightbulb className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                </div>
              </div>

              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {project.instructions || project.description}
                  </p>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-primary/5 to-muted rounded-xl border-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-foreground mb-1">Tu localidad:</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {selectedSection
                          ? sections.find(s => s.id === selectedSection)?.name || 'Seleccionada'
                          : 'No seleccionada'
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 ml-3 h-9 sm:h-10"
                      onClick={() => setShowSectionModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                      <span className="sm:hidden">Cambiar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Songs Section - Mobile optimized */}
            <div className="space-y-4 sm:space-y-5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Canciones</h2>

              <div className="grid gap-3 sm:gap-4">
                {songs.map((song) => {
                  const preloaded = isPreloaded(projectId!, song.id, selectedSection);

                  return (
                    <Card key={song.id} className="border-2 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Music className="h-5 w-5 text-primary shrink-0" />
                              <h3 className="font-semibold text-base sm:text-lg truncate">
                                {song.song_name}
                              </h3>
                            </div>
                            {song.artist_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {song.artist_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Duración: {formatDuration(song.duration_seconds)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:shrink-0">
                            <Button
                              variant={preloaded ? "secondary" : "outline"}
                              size="lg"
                              onClick={() => handlePreload(song.id)}
                              disabled={!selectedSection}
                              className="w-full sm:w-auto h-12 font-semibold text-base"
                            >
                              {preloaded ? (
                                <>
                                  <Check className="h-5 w-5 mr-2" />
                                  Actualizar
                                </>
                              ) : (
                                <>
                                  <Download className="h-5 w-5 mr-2" />
                                  Precargar
                                </>
                              )}
                            </Button>

                            <Button
                              size="lg"
                              onClick={() => navigate(`/fan-projects/${projectId}/song/${song.id}/light`)}
                              disabled={!preloaded}
                              className="w-full sm:w-auto h-12 font-semibold text-base"
                            >
                              Entrar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <SectionSelectModal
        open={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        sections={sections}
        onSelect={handleSectionSelect}
        defaultValue={selectedSection}
      />
    </>
  );
};

export default FanProjectDetail;
