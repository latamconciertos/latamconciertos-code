import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModernConcertCard } from './ModernConcertCard';
import { useUpcomingConcerts } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Link, useNavigate } from 'react-router-dom';
import { spotifyService } from '@/lib/spotify';

interface ConcertWithImage {
    id: string;
    title: string;
    date: string;
    image_url: string | null;
    artist_image_url?: string;
    artists?: {
        name: string;
        photo_url: string | null;
    } | null;
    venues?: {
        name: string;
        cities?: {
            name: string;
        } | null;
    } | null;
}

export const NewHomeUpcomingConcerts = () => {
    const navigate = useNavigate();
    const [concertsWithImages, setConcertsWithImages] = useState<ConcertWithImage[]>([]);

    // Fetch upcoming concerts (limit to 6 for the grid)
    const { data: concerts = [], isLoading } = useUpcomingConcerts(6);

    // Fetch artist images in parallel batches for better performance
    useEffect(() => {
        const fetchArtistImages = async () => {
            if (concerts.length === 0) {
                setConcertsWithImages([]);
                return;
            }

            // Process in batches of 3 for better performance
            const BATCH_SIZE = 3;
            const withImages: ConcertWithImage[] = [];

            for (let i = 0; i < concerts.length; i += BATCH_SIZE) {
                const batch = concerts.slice(i, i + BATCH_SIZE);

                // Fetch images in parallel within each batch
                const batchResults = await Promise.all(
                    batch.map(async (concert) => {
                        if (concert.artists?.name) {
                            try {
                                const artistImage = await spotifyService.getArtistImage(
                                    concert.artists.name,
                                    concert.artists.photo_url || undefined
                                );
                                return { ...concert, artist_image_url: artistImage } as ConcertWithImage;
                            } catch {
                                // Silent fail - no console.error
                                return concert as ConcertWithImage;
                            }
                        }
                        return concert as ConcertWithImage;
                    })
                );

                withImages.push(...batchResults);
            }

            setConcertsWithImages(withImages);
        };

        fetchArtistImages();
    }, [concerts]);

    const handleConcertClick = (concert: any) => {
        // Navigate to concerts page - in future could open modal
        navigate('/concerts');
    };

    const displayConcerts = concertsWithImages.length > 0 ? concertsWithImages : (concerts as ConcertWithImage[]);

    if (isLoading) {
        return (
            <section className="w-full py-16 md:py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        <LoadingSpinnerInline />
                    </div>
                </div>
            </section>
        );
    }

    if (concerts.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-16 md:py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header - Always visible, clickable on mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        Próximos Conciertos
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-fira">
                        Próximos conciertos
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Los conciertos más esperados de Latinoamérica
                    </p>
                </motion.div>

                {/* Concert Cards - Horizontal scroll on mobile, Grid on desktop */}
                <div className="relative">
                    {/* Mobile: Horizontal scroll */}
                    <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-4 snap-x snap-mandatory">
                            {displayConcerts.map((concert, index) => (
                                <div
                                    key={concert.id}
                                    className="flex-none w-[280px] snap-start"
                                >
                                    <ModernConcertCard
                                        concert={concert}
                                        onClick={() => handleConcertClick(concert)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop: Grid layout */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {displayConcerts.map((concert, index) => (
                            <motion.div
                                key={concert.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <ModernConcertCard
                                    concert={concert}
                                    onClick={() => handleConcertClick(concert)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-12"
                >
                    <Link to="/concerts">
                        <Button
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-6 text-base rounded-full transition-all hover:scale-105"
                        >
                            Ver Todos los Conciertos
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

