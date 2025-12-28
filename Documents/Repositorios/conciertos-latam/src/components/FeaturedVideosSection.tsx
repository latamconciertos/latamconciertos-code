import { useState } from 'react';
import { Play, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AdSpace } from './AdSpace';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { sanitizeEmbedCode } from '@/lib/sanitize';
import { useFeaturedVideos } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

interface MediaItem {
  id: string;
  title: string;
  summary: string | null;
  type: string;
  media_url: string | null;
  embed_code: string | null;
  thumbnail_url: string | null;
  featured: boolean;
}

const FeaturedVideosSection = () => {
  const { data: mediaItems = [], isLoading } = useFeaturedVideos(6);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getThumbnail = (item: MediaItem) => {
    if (item.thumbnail_url) {
      return item.thumbnail_url;
    }
    
    if (item.embed_code) {
      const youtubeMatch = item.embed_code.match(/youtube\.com\/embed\/([^?"]+)/);
      if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
      }
    }
    
    return 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=450&fit=crop';
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando videos..." />
        </div>
      </section>
    );
  }

  const defaultVideos: MediaItem[] = [
    {
      id: 'default-1',
      title: "Lo mejor del año en conciertos",
      summary: "Highlights",
      type: 'video',
      media_url: null,
      embed_code: null,
      thumbnail_url: null,
      featured: false
    },
    {
      id: 'default-2',
      title: "Entrevista exclusiva: Detrás del escenario",
      summary: "Entrevistas",
      type: 'video',
      media_url: null,
      embed_code: null,
      thumbnail_url: null,
      featured: false
    },
    {
      id: 'default-3',
      title: "Top 10 momentos inolvidables",
      summary: "Top Lists",
      type: 'video',
      media_url: null,
      embed_code: null,
      thumbnail_url: null,
      featured: false
    }
  ];

  const displayItems = mediaItems.length > 0 ? mediaItems : defaultVideos;

  return (
    <>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira">
                <Play className="h-4 w-4 mr-2" />
                Videos destacados
              </Badge>
              <Badge variant="outline" className="text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Lo más visto
              </Badge>
            </div>
          </div>

          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {displayItems.map((item: any) => (
                  <CarouselItem key={item.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div 
                      className="group cursor-pointer relative overflow-hidden rounded-2xl h-[500px] transition-transform duration-300 hover:scale-[1.02]"
                      onClick={() => handleMediaClick(item)}
                    >
                      <img
                        src={getThumbnail(item)}
                        alt={`${item.title} miniatura`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
                      
                      <div className="absolute top-0 left-0 right-0 p-6">
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-3 drop-shadow-lg">
                          {item.title}
                        </h3>
                        {item.summary && (
                          <p className="text-white/80 text-sm mt-2 line-clamp-2 drop-shadow-lg">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary group-hover:bg-primary/90 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-2xl">
                          <Play className="h-10 w-10 text-primary-foreground ml-1" fill="currentColor" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <Badge className="bg-background/90 text-foreground hover:bg-background">
                          Conciertos Latam
                        </Badge>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious className="left-2 h-12 w-12 border-2 bg-background/80 hover:bg-background" />
              <CarouselNext className="right-2 h-12 w-12 border-2 bg-background/80 hover:bg-background" />
            </Carousel>
          </div>

          <div className="mt-8">
            <AdSpace position="content" page="homepage" />
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedMedia?.title}</DialogTitle>
            <DialogDescription>
              {selectedMedia?.summary ?? 'Vista del contenido seleccionado'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.type === 'video' ? (
                selectedMedia.embed_code ? (
                  <div 
                    className="aspect-video w-full rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: sanitizeEmbedCode(selectedMedia.embed_code) }}
                  />
                ) : selectedMedia.media_url ? (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <video 
                      src={selectedMedia.media_url} 
                      controls
                      className="w-full h-full"
                      controlsList="nodownload"
                    >
                      Tu navegador no soporta el elemento de video.
                    </video>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Video no disponible</p>
                  </div>
                )
              ) : null}
              
              {selectedMedia.summary && (
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{selectedMedia.summary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeaturedVideosSection;
