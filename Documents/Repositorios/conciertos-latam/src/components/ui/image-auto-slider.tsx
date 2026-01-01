import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedPhotos } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import type { FeaturedPhoto } from '@/types/entities';

const ImageAutoSlider = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { data: mediaItems = [], isLoading } = useFeaturedPhotos();

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;

        const scrollAmount = 400; // Scroll by ~1.5 images
        const newPosition = direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount;

        scrollContainerRef.current.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        });
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

    const getThumbnail = (item: FeaturedPhoto) => {
        if (item.thumbnail_url) return item.thumbnail_url;
        if (item.media_url) return item.media_url;
        return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop';
    };

    return (
        <section className="relative py-8 md:py-12 bg-gradient-to-b from-background via-background/90 to-background overflow-hidden">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="text-center">
                    <p className="lg:text-md mb-2 text-center text-xs font-light uppercase tracking-widest text-muted-foreground">
                        Un viaje a través de historias visuales
                    </p>
                    <h2 className="section-title text-center mb-2 md:mb-3">
                        Fotos <span className="text-primary">Destacadas</span>
                    </h2>
                </div>
            </div>

            {/* Scrolling images container with navigation */}
            <div className="relative w-full group">
                {/* Navigation Buttons - Desktop only */}
                <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                {/* Fade mask gradients on sides */}
                <div
                    className="absolute inset-y-0 left-0 w-16 md:w-24 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, hsl(var(--background)) 0%, transparent 100%)'
                    }}
                />
                <div
                    className="absolute inset-y-0 right-0 w-16 md:w-24 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(270deg, hsl(var(--background)) 0%, transparent 100%)'
                    }}
                />

                {/* Horizontal scroll container */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <div className="flex gap-4 md:gap-6 px-4 md:px-8">
                        {mediaItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:brightness-110 cursor-pointer"
                            >
                                <img
                                    src={getThumbnail(item)}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS to hide scrollbar */}
            <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
};

export default ImageAutoSlider;
