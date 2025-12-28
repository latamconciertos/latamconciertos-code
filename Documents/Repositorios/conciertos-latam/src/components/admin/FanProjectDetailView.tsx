import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      active: { variant: 'default', label: 'Activo' },
      completed: { variant: 'outline', label: 'Completado' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Proyecto no encontrado</p>
        <Button onClick={onBack} variant="outline">
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
          <Button onClick={onBack} variant="outline" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold">{project.name}</h2>
            {getStatusBadge(project.status)}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Concierto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-lg font-semibold">{project.concert.title}</p>
            {project.concert.date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDisplayDate(project.concert.date)}
                </span>
              </div>
            )}
            {project.concert.venue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {project.concert.venue.name} - {project.concert.venue.location}
                </span>
              </div>
            )}
          </div>
          
          {project.description && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">{project.description}</p>
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
