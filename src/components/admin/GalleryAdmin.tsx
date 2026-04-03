import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image as ImageIcon, Video, Loader2, Copy, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileObject } from '@supabase/storage-js';

const BUCKETS = [
  { id: 'articles', name: 'Artículos' },
  { id: 'artist', name: 'Artistas' },
  { id: 'concert', name: 'Conciertos' },
  { id: 'media', name: 'Media' },
];

export const GalleryAdmin = () => {
  const [selectedBucket, setSelectedBucket] = useState('articles');
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [selectedBucket]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los archivos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y videos (MP4, WEBM)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo debe ser menor a 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(selectedBucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast({
        title: 'Éxito',
        description: 'Archivo subido correctamente',
      });

      loadFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el archivo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(selectedBucket)
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Archivo eliminado correctamente',
      });

      loadFiles();
      setDeleteFile(null);
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
    }
  };

  const getFileUrl = (fileName: string) => {
    const { data } = supabase.storage
      .from(selectedBucket)
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copiado',
      description: 'URL copiada al portapapeles',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isImage = (metadata: Record<string, any>) => {
    const mimetype = metadata?.mimetype || '';
    return mimetype.startsWith('image/');
  };
  
  const isVideo = (metadata: Record<string, any>) => {
    const mimetype = metadata?.mimetype || '';
    return mimetype.startsWith('video/');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Galería de Medios</h2>
          <p className="text-muted-foreground">Gestiona archivos en tus buckets de almacenamiento</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Select value={selectedBucket} onValueChange={setSelectedBucket}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUCKETS.map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label htmlFor="file-upload">
            <Button disabled={uploading} asChild>
              <span className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivo
                  </>
                )}
              </span>
            </Button>
          </label>
          <Input
            id="file-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Formatos permitidos: JPG, PNG, GIF, WEBP, MP4, WEBM. Tamaño máximo: 10MB
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay archivos en este bucket</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => {
            const fileUrl = getFileUrl(file.name);
            return (
              <Card key={file.name} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {isImage(file.metadata) ? (
                    <img
                      src={fileUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : isVideo(file.metadata) ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.metadata?.size ? formatFileSize(file.metadata.size) : 'Tamaño desconocido'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(fileUrl)}
                      className="flex-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteFile(file.name)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente del bucket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFile && handleDelete(deleteFile)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};