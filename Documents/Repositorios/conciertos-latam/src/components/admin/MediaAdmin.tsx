import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Video, Image as ImageIcon, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MediaUpload } from './MediaUpload';
import { ImageCropDialog } from './ImageCropDialog';

interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  media_url: string | null;
  embed_code: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  position: number;
  summary: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export const MediaAdmin = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as 'video' | 'image',
    media_url: '',
    embed_code: '',
    thumbnail_url: '',
    featured: false,
    position: 0,
    summary: '',
    status: 'draft',
    expires_at: '',
  });

  const [useEmbed, setUseEmbed] = useState(false);

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setMediaItems((data || []) as MediaItem[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const mediaData = {
        ...formData,
        author_id: user.id,
        expires_at: formData.expires_at || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('media_items')
          .update(mediaData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Éxito", description: "Elemento actualizado" });
      } else {
        const { error } = await supabase
          .from('media_items')
          .insert([mediaData]);

        if (error) throw error;
        toast({ title: "Éxito", description: "Elemento creado" });
      }

      resetForm();
      fetchMediaItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Éxito", description: "Elemento eliminado" });
      fetchMediaItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MediaItem) => {
    setEditingItem(item);
    setIsCreating(true);
    setFormData({
      title: item.title,
      type: item.type,
      media_url: item.media_url || '',
      embed_code: item.embed_code || '',
      thumbnail_url: item.thumbnail_url || '',
      featured: item.featured,
      position: item.position,
      summary: item.summary || '',
      status: item.status,
      expires_at: item.expires_at || '',
    });
    setUseEmbed(!!item.embed_code);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'video',
      media_url: '',
      embed_code: '',
      thumbnail_url: '',
      featured: false,
      position: 0,
      summary: '',
      status: 'draft',
      expires_at: '',
    });
    setEditingItem(null);
    setIsCreating(false);
    setUseEmbed(false);
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (isCreating) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}
          </h2>
          <Button variant="outline" onClick={resetForm}>
            Volver
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título del elemento"
                      required
                    />
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'video' | 'image') => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Imagen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant={!useEmbed ? 'default' : 'outline'}
                        onClick={() => setUseEmbed(false)}
                      >
                        Subir Archivo
                      </Button>
                      <Button
                        type="button"
                        variant={useEmbed ? 'default' : 'outline'}
                        onClick={() => setUseEmbed(true)}
                      >
                        Código Embed
                      </Button>
                    </div>

                    {!useEmbed ? (
                      <MediaUpload
                        type={formData.type}
                        onMediaUploaded={(url) => setFormData({ ...formData, media_url: url })}
                        currentMediaUrl={formData.media_url}
                      />
                    ) : (
                      <div>
                        <Label>Código de inserción</Label>
                        <Textarea
                          value={formData.embed_code}
                          onChange={(e) => setFormData({ ...formData, embed_code: e.target.value })}
                          placeholder="<iframe src='...'></iframe>"
                          rows={4}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Miniatura para el Home (Thumbnail)</Label>
                    <div className="space-y-2">
                      {formData.media_url && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowCropDialog(true)}
                        >
                          <Crop className="h-4 w-4 mr-2" />
                          Recortar imagen existente como miniatura
                        </Button>
                      )}
                      <MediaUpload
                        type="image"
                        onMediaUploaded={(url) => setFormData({ ...formData, thumbnail_url: url })}
                        currentMediaUrl={formData.thumbnail_url}
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta imagen se mostrará en la sección de videos destacados del Home
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div>
                      <Label>Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="archived">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Resumen</Label>
                      <Textarea
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        placeholder="Descripción breve..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Fecha de caducidad</Label>
                      <Input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Destacar</Label>
                      <Switch
                        checked={formData.featured}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, featured: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label>Posición en lista</Label>
                      <Input
                        type="number"
                        value={formData.position}
                        onChange={(e) => 
                          setFormData({ ...formData, position: parseInt(e.target.value) })
                        }
                        min="0"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              <Button type="submit" className="w-full">
                {editingItem ? 'Actualizar' : 'Publicar'}
              </Button>
            </div>
          </div>
        </form>

        {/* Image Crop Dialog */}
        {formData.media_url && (
          <ImageCropDialog
            open={showCropDialog}
            onOpenChange={setShowCropDialog}
            imageUrl={formData.media_url}
            onCropComplete={(url) => setFormData({ ...formData, thumbnail_url: url })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Medios</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Elemento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="space-y-3">
              {item.media_url && (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {item.type === 'video' ? (
                    <video src={item.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              
              <div className="flex items-start gap-2">
                {item.type === 'video' ? (
                  <Video className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.status} {item.featured && '• Destacado'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mediaItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay elementos. Crea uno nuevo para comenzar.
        </div>
      )}
    </div>
  );
};
