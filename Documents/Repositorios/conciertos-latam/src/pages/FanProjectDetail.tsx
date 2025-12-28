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
  const { saveSequence, isPreloaded } = useFanProjectStorage();

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
      const { data, error } = await supabase
        .from('fan_project_color_sequences')
        .select('sequence, mode')
        .eq('fan_project_song_id', songId)
        .eq('venue_section_id', selectedSection)
        .single();

      if (error) throw error;

      const success = saveSequence(
        projectId!, 
        songId, 
        selectedSection,
        data.sequence as any,
        data.mode as 'fixed' | 'strobe'
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
        <div className="min-h-screen flex items-center justify-center pt-20">
          <p className="text-muted-foreground">Proyecto no encontrado</p>
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
        
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold">{project.name}</h1>
                  <p className="text-lg text-muted-foreground">{project.concert.title}</p>
                </div>
                <Lightbulb className="h-12 w-12 text-primary shrink-0" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.instructions || project.description}
                  </p>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Tu localidad:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSection 
                          ? sections.find(s => s.id === selectedSection)?.name || 'Seleccionada'
                          : 'No seleccionada'
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSectionModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Canciones</h2>
              
              <div className="grid gap-4">
                {songs.map((song) => {
                  const preloaded = isPreloaded(projectId!, song.id, selectedSection);
                  
                  return (
                    <Card key={song.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Music className="h-5 w-5 text-primary shrink-0" />
                              <h3 className="font-semibold text-lg truncate">
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

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant={preloaded ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => handlePreload(song.id)}
                              disabled={!selectedSection}
                            >
                              {preloaded ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Actualizar
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Precargar
                                </>
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => navigate(`/fan-projects/${projectId}/song/${song.id}/light`)}
                              disabled={!preloaded}
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
