import { useState } from 'react';
import { Upload, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploadProps {
  onMediaUploaded: (url: string) => void;
  currentMediaUrl?: string;
  type: 'video' | 'image';
}

export const MediaUpload = ({ onMediaUploaded, currentMediaUrl, type }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentMediaUrl || null);
  const { toast } = useToast();

  const uploadMedia = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onMediaUploaded(publicUrl);

      toast({
        title: "Éxito",
        description: `${type === 'video' ? 'Video' : 'Imagen'} subido correctamente`,
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const expectedType = type === 'video' ? 'video/' : 'image/';
    if (!file.type.startsWith(expectedType)) {
      toast({
        title: "Error",
        description: `Solo se permiten archivos de ${type === 'video' ? 'video' : 'imagen'}`,
        variant: "destructive",
      });
      return;
    }

    const maxSize = type === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB video, 10MB image
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `El archivo debe ser menor a ${type === 'video' ? '500MB' : '10MB'}`,
        variant: "destructive",
      });
      return;
    }

    uploadMedia(file);
  };

  return (
    <div className="space-y-4">
      <Label>{type === 'video' ? 'Video' : 'Imagen'}</Label>
      
      {previewUrl && (
        <div className="relative w-full rounded-lg overflow-hidden border">
          {type === 'video' ? (
            <video 
              src={previewUrl} 
              controls
              className="w-full h-auto max-h-96"
            />
          ) : (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById(`media-upload-${type}`)?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              {type === 'video' ? (
                <Video className="w-4 h-4 mr-2" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-2" />
              )}
              Examinar...
            </>
          )}
        </Button>
        
        <Input
          id={`media-upload-${type}`}
          type="file"
          accept={type === 'video' ? 'video/*' : 'image/*'}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      <p className="text-sm text-muted-foreground">
        {type === 'video' 
          ? 'Formatos permitidos: .mp4, .mov, .avi, .flv, .mkv, .webm (máximo 500MB)'
          : 'Formatos permitidos: .jpg, .png, .gif, .webp (máximo 10MB)'}
      </p>
    </div>
  );
};
