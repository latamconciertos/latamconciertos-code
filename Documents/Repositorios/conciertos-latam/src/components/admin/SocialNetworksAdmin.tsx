import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SocialNetwork {
  id: string;
  name: string;
  icon_name: string;
  url_template: string;
  display_order: number;
  active: boolean;
}

export function SocialNetworksAdmin() {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon_name: '',
    url_template: '',
    active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_networks')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error fetching social networks:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las redes sociales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing network
        const { error } = await supabase
          .from('social_networks')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Actualizado",
          description: "Red social actualizada exitosamente",
        });
      } else {
        // Create new network
        const maxOrder = Math.max(...networks.map(n => n.display_order), 0);
        const { error } = await supabase
          .from('social_networks')
          .insert({
            ...formData,
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: "Creado",
          description: "Red social creada exitosamente",
        });
      }

      resetForm();
      fetchNetworks();
    } catch (error) {
      console.error('Error saving social network:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la red social",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (network: SocialNetwork) => {
    setEditingId(network.id);
    setFormData({
      name: network.name,
      icon_name: network.icon_name,
      url_template: network.url_template,
      active: network.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta red social?')) return;

    try {
      const { error } = await supabase
        .from('social_networks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "Red social eliminada exitosamente",
      });
      fetchNetworks();
    } catch (error) {
      console.error('Error deleting social network:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la red social",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('social_networks')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: active ? "Activado" : "Desactivado",
        description: `Red social ${active ? 'activada' : 'desactivada'} exitosamente`,
      });
      fetchNetworks();
    } catch (error) {
      console.error('Error toggling social network:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      icon_name: '',
      url_template: '',
      active: true,
    });
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Redes Sociales</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las redes sociales que aparecerán para compartir noticias
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nueva'} Red Social</CardTitle>
            <CardDescription>
              Las variables {'{url}'} y {'{title}'} se reemplazarán automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Facebook"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon_name">
                  Icono (nombre de Lucide React)
                </Label>
                <Input
                  id="icon_name"
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                  placeholder="Facebook"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ver iconos en: <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lucide.dev</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url_template">URL Template</Label>
                <Input
                  id="url_template"
                  value={formData.url_template}
                  onChange={(e) => setFormData({ ...formData, url_template: e.target.value })}
                  placeholder="https://facebook.com/sharer?u={url}"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Activo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Actualizar' : 'Crear'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales Configuradas</CardTitle>
            <CardDescription>
              {networks.length} redes sociales configuradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Icono</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">{network.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {network.icon_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={network.active}
                        onCheckedChange={(checked) => toggleActive(network.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(network)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(network.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
