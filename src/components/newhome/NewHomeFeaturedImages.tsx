import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GalleryImage {
    id: string;
    image_url: string;
    title: string;
    description?: string | null;
}

export const NewHomeFeaturedImages = () => {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    // Fetch featured images from media_items table (admin section)
    const { data: images = [], isLoading } = useQuery({
        queryKey: ['featured-images-gallery'],
        queryFn: async () => {
            // Fetch images from media_items table
            const { data: mediaImages, error } = await supabase
                .from('media_items')
                .select('id, title, media_url, summary, type')
                .eq('type', 'image')
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) throw error;

            return (mediaImages || []).map(img => ({
                id: img.id,
                image_url: img.media_url!,
                title: img.title,
                description: img.summary
            })) as GalleryImage[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading) {
        return (
            <section className="py-8 md:py-12 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground animate-pulse">Cargando galería...</p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (images.length === 0) {
        return null;
    }

    return (
        <>
            <section className="py-8 md:py-12 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira mb-4">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Galería de Momentos
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-fira">
                            Galería de Momentos Inolvidables
                        </h2>
                        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                            Revive los mejores momentos capturados en conciertos y festivales
                        </p>
                    </motion.div>

                    {/* Masonry Grid */}
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                        {images.map((image, index) => (
                            <motion.div
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="break-inside-avoid group cursor-pointer"
                                onClick={() => setSelectedImage(image)}
                            >
                                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                                    {/* Image */}
                                    <img
                                        src={image.image_url}
                                        alt={image.title}
                                        className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        loading="lazy"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Zoom Icon */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-10 h-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                            <ZoomIn className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                    </div>

                                    {/* Title Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
                                            {image.title}
                                        </h3>
                                    </div>

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative max-w-6xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>

                            {/* Image */}
                            <img
                                src={selectedImage.image_url}
                                alt={selectedImage.title}
                                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                            />

                            {/* Image Info */}
                            <div className="mt-4 text-center">
                                <h3 className="text-white text-xl font-bold mb-2">{selectedImage.title}</h3>
                                {selectedImage.description && (
                                    <p className="text-white/80 text-sm">{selectedImage.description}</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
