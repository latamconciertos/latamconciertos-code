import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AdSpace } from './AdSpace';
import { PhotoGallery } from './ui/photo-gallery';
import { useFeaturedPhotos } from '@/hooks/queries';
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

const FeaturedPhotosSection = () => {
  const { data: mediaItems = [], isLoading } = useFeaturedPhotos(6);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getThumbnail = (item: MediaItem) => {
    if (item.thumbnail_url) {
      return item.thumbnail_url;
    }
    
    if (item.type === 'image' && item.media_url) {
      return item.media_url;
    }
    
    return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop';
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando galería..." />
        </div>
      </section>
    );
  }

  if (mediaItems.length === 0) {
    return null;
  }

  const galleryPhotos = mediaItems.map((item: any) => ({
    id: item.id,
    src: getThumbnail(item),
    alt: item.title,
    title: item.title,
    summary: item.summary,
  }));

  return (
    <>
      <section className="py-8 md:py-10 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PhotoGallery 
            photos={galleryPhotos}
            onPhotoClick={(photo) => {
              const item = mediaItems.find((m: any) => m.id === photo.id);
              if (item) handleMediaClick(item as MediaItem);
            }}
            animationDelay={0.3}
          />

          <div className="mt-12">
            <AdSpace position="content" page="homepage" />
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{selectedMedia?.title}</DialogTitle>
            {selectedMedia?.summary && (
              <DialogDescription className="text-sm">
                {selectedMedia.summary}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedMedia && selectedMedia.media_url && (
            <div className="relative w-full rounded-lg overflow-hidden">
              <img 
                src={selectedMedia.media_url} 
                alt={selectedMedia.title}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeaturedPhotosSection;
