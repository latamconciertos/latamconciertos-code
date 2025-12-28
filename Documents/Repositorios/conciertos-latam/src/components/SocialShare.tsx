import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { socialIconMap } from './SocialIcons';

interface SocialNetwork {
  id: string;
  name: string;
  icon_name: string;
  url_template: string;
  display_order: number;
}

interface SocialShareProps {
  url: string;
  title: string;
  setlistData?: {
    concertTitle: string;
    artistName?: string;
    date?: string;
    concertImage?: string;
    songs: Array<{
      song_name: string;
      artist_name?: string;
    }>;
  };
}

export function SocialShare({ url, title, setlistData }: SocialShareProps) {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    fetchActiveNetworks();
  }, []);

  const fetchActiveNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_networks')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error fetching social networks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareUrl = (template: string) => {
    return template
      .replace('{url}', encodeURIComponent(url))
      .replace('{title}', encodeURIComponent(title));
  };

  const generateSetlistImage = async () => {
    if (!setlistData) return;
    
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-setlist-image', {
        body: setlistData
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setShowImageDialog(true);
      } else {
        throw new Error('No se recibió la imagen');
      }
    } catch (error) {
      console.error('Error generating setlist image:', error);
      toast.error('Error al generar la imagen del setlist');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleShare = (shareUrl: string) => {
    // Si hay datos de setlist, generar imagen primero
    if (setlistData) {
      generateSetlistImage();
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `setlist-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagen descargada');
  };

  const shareImageToNetwork = (network: SocialNetwork) => {
    if (!generatedImageUrl) return;
    
    // Primero descargar la imagen automáticamente
    downloadImage();
    
    // Luego abrir la red social para que el usuario la comparta manualmente
    const shareUrl = generateShareUrl(network.url_template);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    toast.info(`Imagen descargada. Ahora súbela en ${network.name}`);
  };

  if (loading) return null;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {setlistData ? (
          <Button
            onClick={() => generateSetlistImage()}
            disabled={generatingImage}
            className="gap-2"
          >
            {generatingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generar con IA
              </>
            )}
          </Button>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">Compartir:</span>
            {networks.map((network) => {
              const IconComponent = socialIconMap[network.icon_name];
              if (!IconComponent) return null;

              const shareUrl = generateShareUrl(network.url_template);

              return (
                <Button
                  key={network.id}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(shareUrl, '_blank', 'width=600,height=400')}
                  title={`Compartir en ${network.name}`}
                >
                  <IconComponent size={16} />
                </Button>
              );
            })}
          </>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Imagen del Setlist Generada</DialogTitle>
          </DialogHeader>
          {generatedImageUrl && (
            <div className="space-y-4">
              <img 
                src={generatedImageUrl} 
                alt="Setlist generado"
                className="w-full rounded-lg"
              />
              <div className="space-y-3">
                <Button 
                  onClick={downloadImage}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Imagen
                </Button>
                
                {/* Botones de redes sociales */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Compartir en:</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {networks.map((network) => {
                      const IconComponent = socialIconMap[network.icon_name];
                      if (!IconComponent) return null;

                      return (
                        <Button
                          key={network.id}
                          variant="outline"
                          size="sm"
                          onClick={() => shareImageToNetwork(network)}
                          className="flex items-center gap-2"
                        >
                          <IconComponent size={16} />
                          {network.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                La imagen se descargará automáticamente al hacer clic en una red social
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
