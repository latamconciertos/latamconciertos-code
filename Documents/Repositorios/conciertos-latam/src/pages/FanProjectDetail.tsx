import { useEffect, useState, useMemo } from 'react';
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
import { OfflineStatusBadge } from '@/components/fan-projects/OfflineStatusBadge';
import { OfflineReadyDialog } from '@/components/fan-projects/OfflineReadyDialog';
import { PostDownloadSharePrompt } from '@/components/fan-projects/PostDownloadSharePrompt';
import { indexedDBStorage } from '@/utils/indexedDBStorage';
import { rateLimit } from '@/utils/rateLimit';

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
    id: string;
    title: string;
    artist_name: string;
    artist_image_url: string | null;
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
    preloadSongSequence,
    loadSequencesFromSupabase
  } = useFanProjectStorage();

  const [project, setProject] = useState<FanProject | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [storageType, setStorageType] = useState<'IndexedDB' | 'localStorage'>('IndexedDB');
  const [preloadedSongs, setPreloadedSongs] = useState<Set<string>>(new Set());
  const [gradientColors, setGradientColors] = useState<string[]>([]);

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

    // Setup Realtime subscription for song updates
    const songsSubscription = supabase
      .channel(`fan_project_songs_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'fan_project_songs',
          filter: `fan_project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Songs changed:', payload);
          // Reload project data when songs change
          if (userId) {
            loadProjectData(userId);
          }
        }
      )
      .subscribe();

    return () => {
      songsSubscription.unsubscribe();
    };
  }, [projectId, navigate]);

  // Check which songs are preloaded
  useEffect(() => {
    const checkPreloaded = async () => {
      if (!selectedSection || songs.length === 0) return;

      const preloaded = new Set<string>();
      for (const song of songs) {
        const isLoaded = await isPreloaded(projectId!, song.id, selectedSection);
        if (isLoaded) {
          preloaded.add(song.id);
        }
      }
      setPreloadedSongs(preloaded);
    };

    checkPreloaded();
  }, [songs, selectedSection, projectId, isPreloaded]);

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
            id,
            title,
            date,
            artist_id,
            venue:venues (id, name)
          )
        `)
        .eq('id', projectId)
        .eq('status', 'active')
        .single();

      if (projectError) throw projectError;

      // Get artist data if artist_id exists
      let artistData = null;
      if (projectData.concert?.artist_id) {
        const { data: artist } = await supabase
          .from('artists')
          .select('name, photo_url')
          .eq('id', projectData.concert.artist_id)
          .single();

        artistData = artist;
      }

      // Combine data
      const enrichedProject = {
        ...projectData,
        concert: {
          ...projectData.concert,
          artist_name: artistData?.name || projectData.concert.title.split(' - ')[0] || 'Artista',
          artist_image_url: artistData?.photo_url || null,
        }
      };

      setProject(enrichedProject);

      // Load gradient colors from first song's sequence
      const { data: colorSeqData } = await supabase
        .from('fan_project_color_sequences')
        .select('sequence')
        .eq('fan_project_id', projectId)
        .limit(1)
        .single();

      if (colorSeqData?.sequence && Array.isArray(colorSeqData.sequence)) {
        const colors = colorSeqData.sequence.map((block: any) => block.color).filter(Boolean);
        setGradientColors(colors.slice(0, 3)); // Use first 3 colors
      }

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

  // Rate-limited section selection (10 changes per minute - generous for normal use)
  const handleSectionSelectRateLimited = useMemo(
    () => rateLimit(
      async (sectionId: string) => {
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
      },
      { maxCalls: 10, windowMs: 60000 } // 10 calls per minute
    ),
    [projectId, userId]
  );

  const handleSectionSelect = async (sectionId: string) => {
    try {
      await handleSectionSelectRateLimited(sectionId);
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'No se pudo guardar tu localidad',
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
      // Try bulk loading first (faster)
      const cdnSuccess = await preloadProjectSection(projectId!, selectedSection);

      if (cdnSuccess) {
        // Get storage stats
        const stats = await indexedDBStorage.getStorageStats();
        setPreloadedCount(stats.totalSequences);
        setStorageType(stats.isIndexedDB ? 'IndexedDB' : 'localStorage');
        setShowOfflineDialog(true);

        // Refresh preloaded songs
        const preloaded = new Set<string>();
        for (const song of songs) {
          const isLoaded = await isPreloaded(projectId!, song.id, selectedSection);
          if (isLoaded) {
            preloaded.add(song.id);
          }
        }
        setPreloadedSongs(preloaded);
        return;
      }

      // Fallback to individual loading
      console.info('Using individual song loading');
      const success = await preloadSongSequence(projectId!, songId, selectedSection);

      if (!success) {
        throw new Error('No se pudo cargar la secuencia');
      }

      // Get storage stats
      const stats = await indexedDBStorage.getStorageStats();
      setPreloadedCount(1);
      setStorageType(stats.isIndexedDB ? 'IndexedDB' : 'localStorage');
      setShowOfflineDialog(true);

      // Refresh preloaded songs
      const isLoaded = await isPreloaded(projectId!, songId, selectedSection);
      if (isLoaded) {
        setPreloadedSongs(prev => new Set(prev).add(songId));
      }
    } catch (error) {
      console.error('Error preloading sequence:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar la secuencia. Intenta de nuevo',
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
                  const preloaded = preloadedSongs.has(song.id);

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

      <OfflineReadyDialog
        open={showOfflineDialog}
        onOpenChange={(open) => {
          setShowOfflineDialog(open);
          // Show share prompt after closing offline dialog
          if (!open && preloadedCount > 0) {
            setTimeout(() => setShowSharePrompt(true), 300);
          }
        }}
        sequenceCount={preloadedCount}
        storageType={storageType}
      />

      {project && (
        <PostDownloadSharePrompt
          open={showSharePrompt}
          onOpenChange={setShowSharePrompt}
          fanProject={{
            id: project.id,
            name: project.name,
            concert: {
              artist_name: project.concert.title.split(' - ')[0] || project.concert.artist_name || 'Artista',
              artist_image_url: project.concert.artist_image_url,
              date: project.concert.date,
              venue_name: project.concert.venue?.name || 'Venue',
            },
          }}
          sequenceCount={preloadedCount}
          gradientColors={gradientColors}
        />
      )}
    </>
  );
};

export default FanProjectDetail;
