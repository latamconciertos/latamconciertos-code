import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { FanProjectSongsManager } from './FanProjectSongsManager';
import { ColorSequenceEditor } from './ColorSequenceEditor';
import { VenueSectionsManager } from './VenueSectionsManager';
import { formatDisplayDate } from '@/lib/timezone';

interface Concert {
  id: string;
  title: string;
  date: string;
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
}

interface FanProject {
  id: string;
  name: string;
  description: string;
  instructions: string;
  status: string;
  concert: Concert;
}

interface FanProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

export const FanProjectDetailView = ({ projectId, onBack }: FanProjectDetailViewProps) => {
  const [project, setProject] = useState<FanProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSequence, setEditingSequence] = useState<{
    songId: string;
    songName: string;
  } | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_projects')
        .select(`
          *,
          concert:concerts (
            id,
            title,
            date,
            venue:venues (
              id,
              name,
              location
            )
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data as FanProject);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: 'border-linea bg-superficie-2 text-texto-2', label: 'Borrador' },
      active: { className: 'border-verde/30 bg-verde/10 text-verde', label: 'Activo' },
      completed: { className: 'border-azul-claro/30 bg-azul-claro/10 text-azul-claro', label: 'Completado' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-texto-2 mb-4">Proyecto no encontrado</p>
        <Button onClick={onBack} variant="outline" className="rounded-full border-linea bg-transparent hover:bg-superficie-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // If editing a sequence, show the color editor
  if (editingSequence) {
    return (
      <ColorSequenceEditor
        projectId={projectId}
        songId={editingSequence.songId}
        songName={editingSequence.songName}
        onBack={() => setEditingSequence(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="outline" size="sm" className="mb-2 rounded-full border-linea bg-transparent hover:bg-superficie-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="font-display uppercase tracking-[0.01em] font-extrabold text-3xl text-texto">{project.name}</h2>
            {getStatusBadge(project.status)}
          </div>
        </div>
      </div>

      <Card className="rounded-[20px] border-linea bg-superficie">
        <CardHeader>
          <CardTitle>Información del Concierto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-lg font-semibold">{project.concert.title}</p>
            {project.concert.date && (
              <div className="flex items-center gap-2 text-sm text-texto-2 mt-1">
                <Calendar className="h-4 w-4 text-periwinkle" />
                <span>
                  {formatDisplayDate(project.concert.date)}
                </span>
              </div>
            )}
            {project.concert.venue && (
              <div className="flex items-center gap-2 text-sm text-texto-2">
                <MapPin className="h-4 w-4 text-periwinkle" />
                <span>
                  {project.concert.venue.name} - {project.concert.venue.location}
                </span>
              </div>
            )}
          </div>

          {project.description && (
            <div className="pt-3 border-t border-linea">
              <p className="text-sm text-texto-2">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <VenueSectionsManager projectId={projectId} />

      <FanProjectSongsManager
        projectId={projectId}
        onEditSequence={(songId, songName) => 
          setEditingSequence({ songId, songName })
        }
      />
    </div>
  );
};
