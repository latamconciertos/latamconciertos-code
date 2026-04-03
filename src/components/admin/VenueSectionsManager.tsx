import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VenueSection {
  id: string;
  name: string;
  code: string;
  display_order: number;
}

interface VenueSectionsManagerProps {
  projectId: string;
}

export const VenueSectionsManager = ({ projectId }: VenueSectionsManagerProps) => {
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<VenueSection | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    loadSections();
  }, [projectId]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_sections')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('display_order');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las localidades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSection) {
        const { error } = await supabase
          .from('venue_sections')
          .update({
            name: formData.name,
            code: formData.code.toUpperCase(),
          })
          .eq('id', editingSection.id);

        if (error) throw error;

        toast({
          title: 'Sección actualizada',
          description: 'La sección ha sido actualizada exitosamente',
        });
      } else {
        const maxOrder = sections.length > 0 
          ? Math.max(...sections.map(s => s.display_order))
          : -1;

        const { error } = await supabase
          .from('venue_sections')
          .insert({
            fan_project_id: projectId,
            name: formData.name,
            code: formData.code.toUpperCase(),
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: 'Sección creada',
          description: 'La sección ha sido creada exitosamente',
        });
      }

      setShowDialog(false);
      setEditingSection(null);
      resetForm();
      loadSections();
    } catch (error: any) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la sección',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (section: VenueSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      code: section.code,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sección?')) return;

    try {
      const { error } = await supabase
        .from('venue_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sección eliminada',
        description: 'La sección ha sido eliminada exitosamente',
      });

      loadSections();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sección',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
    });
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando secciones...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Localidades del Proyecto</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configura las localidades específicas para este proyecto de luces
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingSection(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Sección
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'Editar Sección' : 'Nueva Sección'}
                </DialogTitle>
                <DialogDescription>
                  Configura una nueva localidad/sección del venue
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Sección</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Platea, VIP, General Norte"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ej: PLATEA, VIP, GEN_N"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Código único para identificar esta sección
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSection ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay localidades configuradas para este proyecto</p>
            <p className="text-sm mt-2">
              Agrega las localidades disponibles (Platea, VIP, General, etc.)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{section.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {section.code}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(section)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
