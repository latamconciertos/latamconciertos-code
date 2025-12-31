import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeaturedVideos } from '@/hooks/queries';
import DOMPurify from 'dompurify';

interface MediaItem {
  id: string;
  title: string;
  summary: string | null;
  media_url: string | null;
  embed_code: string | null;
  thumbnail_url: string | null;
}

const FeaturedVideosSection = () => {
  const { data: videos = [], isLoading } = useFeaturedVideos(6);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  // Get optimal thumbnail for video
  const getThumbnail = (video: MediaItem): string => {
    // Priority 1: Explicit thumbnail_url
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }

    // Priority 2: Extract from YouTube embed
    if (video.embed_code) {
      const youtubeMatch = video.embed_code.match(/youtube\.com\/embed\/([^?"]+)/);
      if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
      }
    }

    // Priority 3: Fallback
    return 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=675&fit=crop';
  };

  // Sanitize and prepare embed code for safe rendering
  const getSafeEmbedCode = (embedCode: string): string => {
    // Sanitize the embed code
    const sanitized = DOMPurify.sanitize(embedCode, {
      ALLOWED_TAGS: ['iframe'],
      ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'loading']
    });

    // Ensure iframe has proper attributes for responsive and lazy loading
    return sanitized
      .replace('<iframe', '<iframe loading="lazy" class="w-full h-full"')
      .replace(/width="[^"]*"/, '')
      .replace(/height="[^"]*"/, '');
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Cargando videos destacados...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no videos, don't render the section
  if (videos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-16 bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="lg:text-md mb-2 text-center text-xs font-light uppercase tracking-widest text-muted-foreground">
              Contenido Exclusivo
            </p>
            <h2 className="section-title text-center mb-2 md:mb-3">
              Videos <span className="text-primary">Destacados</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Los mejores momentos de conciertos y festivales en América Latina
            </p>
          </motion.div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  {/* Thumbnail */}
                  <img
                    src={getThumbnail(video)}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center transform scale-100 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-2 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                      {video.title}
                    </h3>
                    {video.summary && (
                      <p className="text-white/80 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        {video.summary}
                      </p>
                    )}
                  </div>

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl bg-background rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Video Container */}
              <div className="aspect-video w-full bg-black">
                {selectedVideo.embed_code ? (
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{
                      __html: getSafeEmbedCode(selectedVideo.embed_code)
                    }}
                  />
                ) : selectedVideo.media_url ? (
                  <video
                    src={selectedVideo.media_url}
                    controls
                    autoPlay
                    className="w-full h-full"
                    controlsList="nodownload"
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Video no disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedVideo.title}</h3>
                  {selectedVideo.summary && (
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedVideo.summary}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeaturedVideosSection;
