import { motion } from 'framer-motion';
import { useFeaturedPhotos } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import type { FeaturedPhoto } from '@/types/entities';

const ImageAutoSlider = () => {
    const { data: mediaItems = [], isLoading } = useFeaturedPhotos();

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

    const getThumbnail = (item: FeaturedPhoto) => {
        if (item.thumbnail_url) return item.thumbnail_url;
        if (item.media_url) return item.media_url;
        return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop';
    };

    // Duplicate images for seamless infinite loop
    const duplicatedImages = [...mediaItems, ...mediaItems];

    return (
        <section className="relative py-8 md:py-12 bg-gradient-to-b from-background via-background/90 to-background overflow-hidden">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <p className="lg:text-md mb-2 text-center text-xs font-light uppercase tracking-widest text-muted-foreground">
                        Un viaje a través de historias visuales
                    </p>
                    <h2 className="section-title text-center mb-2 md:mb-3">
                        Fotos <span className="text-primary">Destacadas</span>
                    </h2>
                </motion.div>
            </div>

            {/* Scrolling images container with fade masks */}
            <div className="relative w-full">
                {/* Fade mask gradients on sides */}
                <div
                    className="absolute inset-y-0 left-0 w-24 md:w-48 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, hsl(var(--background)) 0%, transparent 100%)'
                    }}
                />
                <div
                    className="absolute inset-y-0 right-0 w-24 md:w-48 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(270deg, hsl(var(--background)) 0%, transparent 100%)'
                    }}
                />

                {/* Infinite scrolling container */}
                <div className="relative overflow-hidden">
                    <motion.div
                        className="flex gap-4 md:gap-6"
                        animate={{
                            x: [0, -50 + '%'],
                        }}
                        transition={{
                            x: {
                                duration: 40,
                                repeat: Infinity,
                                ease: 'linear',
                            },
                        }}
                    >
                        {duplicatedImages.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:brightness-110"
                            >
                                <img
                                    src={getThumbnail(item)}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ImageAutoSlider;
