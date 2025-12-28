import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, Edit, Trash2, Music, Eye } from 'lucide-react';
import { FanProjectDetailView } from './FanProjectDetailView';

interface Concert {
  id: string;
  title: string;
  date: string;
  venue: { name: string } | null;
}

interface FanProject {
  id: string;
  name: string;
  description: string;
  instructions: string;
  status: string;
  concert: Concert;
}

export const FanProjectsAdmin = () => {
  const [projects, setProjects] = useState<FanProject[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<FanProject | null>(null);
  const [viewingProject, setViewingProject] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    concert_id: '',
    name: '',
    description: '',
    instructions: '',
    status: 'draft',
  });

  useEffect(() => {
    loadProjects();
    loadConcerts();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_projects')
        .select(`
          *,
          concert:concerts (
            id,
            title,
            date,
            venue:venues (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConcerts = async () => {
    try {
      const { data, error } = await supabase
        .from('concerts')
        .select(`
          id,
          title,
          date,
          venue:venues (name)
        `)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setConcerts(data || []);
    } catch (error) {
      console.error('Error loading concerts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('fan_projects')
          .update(formData)
          .eq('id', editingProject.id);

        if (error) throw error;

        toast({
          title: 'Proyecto actualizado',
          description: 'El proyecto ha sido actualizado exitosamente',
        });
      } else {
        const { error } = await supabase
          .from('fan_projects')
          .insert(formData);

        if (error) throw error;

        toast({
          title: 'Proyecto creado',
          description: 'El proyecto ha sido creado exitosamente',
        });
      }

      setShowDialog(false);
      setEditingProject(null);
      resetForm();
      loadProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el proyecto',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (project: FanProject) => {
    setEditingProject(project);
    setFormData({
      concert_id: project.concert.id,
      name: project.name,
      description: project.description,
      instructions: project.instructions,
      status: project.status,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
      const { error } = await supabase
        .from('fan_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente',
      });

      loadProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      concert_id: '',
      name: '',
      description: '',
      instructions: '',
      status: 'draft',
    });
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

  // If viewing project details, show the detail view
  if (viewingProject) {
    return (
      <FanProjectDetailView
        projectId={viewingProject}
        onBack={() => setViewingProject(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Fan Projects</h2>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProject(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </DialogTitle>
              <DialogDescription>
                Configura el proyecto de luces para un concierto
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="concert">Concierto</Label>
                <Select
                  value={formData.concert_id}
                  onValueChange={(value) => setFormData({ ...formData, concert_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un concierto" />
                  </SelectTrigger>
                  <SelectContent>
                    {concerts.map((concert) => (
                      <SelectItem key={concert.id} value={concert.id}>
                        {concert.title} - {new Date(concert.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Fan Project Dua Lipa Bogotá"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción breve del proyecto"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instrucciones detalladas para los fans"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProject ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay proyectos creados aún</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {project.name}
                      {getStatusBadge(project.status)}
                    </CardTitle>
                    <CardDescription>
                      {project.concert.title} - {new Date(project.concert.date).toLocaleDateString()}
                      {project.concert.venue && ` • ${project.concert.venue.name}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingProject(project.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
