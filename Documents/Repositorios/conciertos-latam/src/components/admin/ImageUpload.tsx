import { useState } from 'react';
import { Upload, Loader2, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImageCropDialog } from './ImageCropDialog';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  bucket?: string;
  enableCrop?: boolean;
}

export const ImageUpload = ({ onImageUploaded, currentImageUrl, bucket = 'articles', enableCrop = false }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // If crop is enabled, upload temp image first
    if (enableCrop) {
      try {
        setUploading(true);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `temp-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        setTempImageUrl(publicUrl);
        setShowCropDialog(true);
      } catch (error: any) {
        console.error('Error uploading temp image:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo subir la imagen",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    } else {
      uploadImage(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setPreviewUrl(croppedImageUrl);
    onImageUploaded(croppedImageUrl);
    setShowCropDialog(false);
  };

  return (
    <>
      <div className="space-y-4">
        <Label>Imagen {enableCrop && <span className="text-muted-foreground text-xs">(con encuadre)</span>}</Label>
        
        {previewUrl && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                {enableCrop ? (
                  <>
                    <Crop className="w-4 h-4 mr-2" />
                    Subir y Encuadrar
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Imagen
                  </>
                )}
              </>
            )}
          </Button>
          
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {enableCrop && tempImageUrl && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          bucket={bucket}
        />
      )}
    </>
  );
};
