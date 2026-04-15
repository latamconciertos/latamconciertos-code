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
  aspectRatio?: number;
  title?: string;
  description?: string;
}

function getInitialCrop(aspectRatio: number): Crop {
  if (aspectRatio >= 1) {
    // Landscape or square: full width, height derived from ratio
    const height = 100 / aspectRatio;
    return { unit: '%', width: 100, height, x: 0, y: (100 - height) / 2 };
  } else {
    // Portrait: full height, width derived from ratio
    const width = 100 * aspectRatio;
    return { unit: '%', width, height: 100, x: (100 - width) / 2, y: 0 };
  }
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  bucket = 'articles',
  aspectRatio = 16 / 9,
  title = 'Encuadrar miniatura',
  description = 'Desplaza el rectángulo para seleccionar el área que deseas usar como miniatura',
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Crop>(() => getInitialCrop(aspectRatio));
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset crop when aspect ratio changes
  useEffect(() => {
    setCrop(getInitialCrop(aspectRatio));
    setCompletedCrop(null);
  }, [aspectRatio]);

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

    // Use the real pixel dimensions from the original image, not the preview size
    const realWidth = pixelCrop.width * scaleX;
    const realHeight = pixelCrop.height * scaleY;

    canvas.width = realWidth;
    canvas.height = realHeight;

    // High-quality smoothing for resize operations
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      realWidth,
      realHeight,
      0,
      0,
      realWidth,
      realHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        throw new Error('Error al recortar la imagen');
      }

      const fileName = `cropped-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
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
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
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
              aspect={aspectRatio}
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
            {processing ? 'Procesando...' : 'Guardar encuadre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
