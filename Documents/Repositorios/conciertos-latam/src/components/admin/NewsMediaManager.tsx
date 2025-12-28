import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, GripVertical, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaItem {
  id?: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string;
  position: number;
}

interface NewsMediaManagerProps {
  articleId?: string;
  initialMedia?: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

export const NewsMediaManager = ({ articleId, initialMedia = [], onChange }: NewsMediaManagerProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMedia);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validaciones
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB images, 50MB videos
    if (file.size > maxSize) {
      toast.error(`El archivo es muy grande. Máximo ${type === 'image' ? '5MB' : '50MB'}`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('articles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(filePath);

      const newItem: MediaItem = {
        media_type: type,
        media_url: publicUrl,
        caption: '',
        position: mediaItems.length,
      };

      const updatedMedia = [...mediaItems, newItem];
      setMediaItems(updatedMedia);
      onChange(updatedMedia);
      toast.success(`${type === 'image' ? 'Imagen' : 'Video'} agregado`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...mediaItems];
    updated[index].caption = caption;
    setMediaItems(updated);
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = mediaItems.filter((_, i) => i !== index);
    // Reajustar posiciones
    updated.forEach((item, i) => {
      item.position = i;
    });
    setMediaItems(updated);
    onChange(updated);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === mediaItems.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...mediaItems];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    // Actualizar posiciones
    updated.forEach((item, i) => {
      item.position = i;
    });

    setMediaItems(updated);
    onChange(updated);
  };

  const copyPlaceholder = (index: number, type: 'image' | 'video') => {
    const placeholder = type === 'image' ? `[IMAGEN:${index}]` : `[VIDEO:${index}]`;
    navigator.clipboard.writeText(placeholder);
    toast.success('Código copiado al portapapeles');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div>
            <input
              type="file"
              id="upload-image"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'image')}
              disabled={uploading}
            />
            <Label htmlFor="upload-image">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('upload-image')?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Agregar Imagen
              </Button>
            </Label>
          </div>

          <div>
            <input
              type="file"
              id="upload-video"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'video')}
              disabled={uploading}
            />
            <Label htmlFor="upload-video">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('upload-video')?.click()}
              >
                <Video className="h-4 w-4 mr-2" />
                Agregar Video
              </Button>
            </Label>
          </div>
        </div>
        
        {mediaItems.length > 0 && (
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
            <p className="font-medium mb-1">Para insertar en el contenido:</p>
            <p>Copia el código del medio y pégalo en el editor de texto donde quieras que aparezca.</p>
          </div>
        )}
      </div>

      {mediaItems.length > 0 && (
        <div className="space-y-3">
          {mediaItems.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-shrink-0">
                    {item.media_type === 'image' ? (
                      <img
                        src={item.media_url}
                        alt={item.caption || 'Media'}
                        className="w-24 h-24 object-cover rounded"
                      />
                    ) : (
                      <video
                        src={item.media_url}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.media_type === 'image' ? (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {item.media_type === 'image' ? 'Imagen' : 'Video'} #{index + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyPlaceholder(index, item.media_type)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar código
                      </Button>
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                      {item.media_type === 'image' ? `[IMAGEN:${index}]` : `[VIDEO:${index}]`}
                    </code>
                    <Input
                      placeholder="Descripción (opcional)"
                      value={item.caption || ''}
                      onChange={(e) => updateCaption(index, e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
