import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  bucket?: string;
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  bucket = 'articles',
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 56.25, // 16:9 aspect ratio
    x: 0,
    y: 21.875, // Center vertically
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image with CORS-safe method
  useEffect(() => {
    const loadImage = async () => {
      if (!imageUrl || !open) return;
      
      setLoading(true);
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('Error al cargar la imagen');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageUrl, open]);

  const getCroppedImg = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    const pixelCrop = completedCrop;

    if (!image || !pixelCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        throw new Error('Error al recortar la imagen');
      }

      // Upload to Supabase
      const fileName = `cropped-${Date.now()}.jpg`;
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onCropComplete(publicUrl);
      onOpenChange(false);
      toast.success('Miniatura generada correctamente');
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast.error('Error al procesar la imagen: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Encuadrar miniatura</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Desplaza el rectángulo para seleccionar el área que deseas usar como miniatura
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/20 rounded-lg p-4">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando imagen...</p>
            </div>
          ) : imageSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={16 / 9}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </ReactCrop>
          ) : (
            <p className="text-sm text-muted-foreground">Error al cargar la imagen</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing || loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={processing || !completedCrop || loading}
          >
            {processing ? 'Procesando...' : 'Guardar miniatura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
