import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, MapPin, Ticket, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ModernConcertCard } from './ModernConcertCard';
import { useUpcomingConcerts } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { spotifyService } from '@/lib/spotify';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConcertWithImage {
    id: string;
    title: string;
    slug: string;
    date: string;
    image_url: string | null;
    artist_image_url?: string;
    ticket_url: string | null;
    description: string | null;
    artists?: {
        name: string;
        photo_url: string | null;
    } | null;
    venues?: {
        name: string;
        cities?: {
            name: string;
            countries?: {
                name: string;
            } | null;
        } | null;
    } | null;
}

export const NewHomeUpcomingConcerts = () => {
    const [concertsWithImages, setConcertsWithImages] = useState<ConcertWithImage[]>([]);
    const [selectedConcert, setSelectedConcert] = useState<ConcertWithImage | null>(null);

    const { data: concertsData, isLoading } = useUpcomingConcerts(6);
    const concerts = concertsData ?? [];

    useEffect(() => {
        const fetchArtistImages = async () => {
            if (concerts.length === 0) {
                setConcertsWithImages([]);
                return;
            }

            const BATCH_SIZE = 3;
            const withImages: ConcertWithImage[] = [];

            for (let i = 0; i < concerts.length; i += BATCH_SIZE) {
                const batch = concerts.slice(i, i + BATCH_SIZE);

                const batchResults = await Promise.all(
                    batch.map(async (concert) => {
                        if (concert.artists?.name) {
                            try {
                                const artistImage = await spotifyService.getArtistImage(
                                    concert.artists.name,
                                    concert.artists.photo_url || undefined
                                );
                                return { ...concert, artist_image_url: artistImage } as ConcertWithImage;
                            } catch (error) {
                                console.error('Error fetching artist image:', error);
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
    }, [concertsData]);


    const getDefaultImage = () => getDefaultImageUtil('concert');
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
        <section className="w-full py-8 md:py-12 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-fira">
                        Próximos conciertos
                    </h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                        Los conciertos más esperados de Latinoamérica
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayConcerts.map((concert) => (
                        <Dialog key={concert.id}>
                            <DialogTrigger asChild>
                                <div onClick={() => setSelectedConcert(concert)}>
                                    <ModernConcertCard concert={concert} />
                                </div>
                            </DialogTrigger>

                            <DialogContent className="max-w-[100vw] sm:max-w-lg md:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden p-0 gap-0 rounded-none sm:rounded-2xl bg-background border-0 sm:border">
                                <DialogTitle className="sr-only">
                                    {selectedConcert?.title}
                                </DialogTitle>

                                {selectedConcert && (
                                    <div className="flex flex-col h-full sm:h-auto">
                                        {/* Hero image — aspect ratio preserved */}
                                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden shrink-0">
                                            <img
                                                src={selectedConcert.artist_image_url || getDefaultImage()}
                                                alt={selectedConcert.artists?.name || selectedConcert.title}
                                                className="w-full h-full object-cover object-top"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

                                            {/* Info overlaid at bottom of image */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                                                {selectedConcert.artists?.name && (
                                                    <span className="inline-block bg-white/15 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full">
                                                        {selectedConcert.artists.name}
                                                    </span>
                                                )}
                                                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight font-fira">
                                                    {selectedConcert.title}
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                                                    {selectedConcert.venues?.name && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {selectedConcert.venues.name}
                                                            {selectedConcert.venues.cities?.name && `, ${selectedConcert.venues.cities.name}`}
                                                        </span>
                                                    )}
                                                    {selectedConcert.date && (
                                                        <span className="flex items-center gap-1 capitalize">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {format(parseISO(selectedConcert.date), "EEE d 'de' MMM", { locale: es })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scrollable content */}
                                        <div className="flex-1 overflow-y-auto">
                                            {/* Attendance + Actions */}
                                            <div className="px-5 py-4 space-y-4">
                                                <ConcertAttendanceButtons concertId={selectedConcert.id} compact />

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 rounded-xl h-11 text-sm font-semibold"
                                                        asChild
                                                    >
                                                        <Link to={`/concerts/${selectedConcert.slug}`}>
                                                            <ArrowRight className="h-4 w-4 mr-1.5" />
                                                            Ver detalles
                                                        </Link>
                                                    </Button>
                                                    {selectedConcert.ticket_url && (
                                                        <Button
                                                            className="flex-1 rounded-xl h-11 text-sm font-semibold"
                                                            onClick={() => window.open(selectedConcert.ticket_url!, '_blank')}
                                                        >
                                                            <Ticket className="h-4 w-4 mr-1.5" />
                                                            Entradas
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Community section */}
                                            <div className="border-t border-border/40 px-5 py-4">
                                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    Comunidad
                                                </h3>
                                                <ConcertCommunity
                                                    concertId={selectedConcert.id}
                                                    concertTitle={selectedConcert.title}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <Button asChild variant="outline" size="lg" className="rounded-lg px-6 py-3">
                        <Link to="/concerts">
                            Ver todos los conciertos
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};
