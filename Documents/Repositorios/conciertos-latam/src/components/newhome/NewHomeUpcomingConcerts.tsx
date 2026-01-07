import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, MapPin, Ticket, Music, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernConcertCard } from './ModernConcertCard';
import { useUpcomingConcerts } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { spotifyService } from '@/lib/spotify';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';

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

    const { data: concerts = [], isLoading } = useUpcomingConcerts(6);

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
    }, [concerts]);

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('es', { month: 'short' }),
            year: date.getFullYear()
        };
    };

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

                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-background via-background to-muted/20">
                                <DialogHeader className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 p-6 pb-4">
                                    <div className="flex items-start gap-4">
                                        <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1.5 font-bold shrink-0">
                                            <Music className="h-4 w-4 mr-1.5" />
                                            Concierto
                                        </Badge>
                                        <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight text-foreground font-fira">
                                            {selectedConcert?.title}
                                        </DialogTitle>
                                    </div>
                                </DialogHeader>

                                <div className="p-6 md:p-8">
                                    {selectedConcert && (
                                        <Tabs defaultValue="details" className="w-full">
                                            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-muted/50">
                                                <TabsTrigger
                                                    value="details"
                                                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    Detalles
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="community"
                                                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Comunidad
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="details" className="space-y-6 mt-0">
                                                <div className="grid md:grid-cols-[2fr_3fr] gap-6 md:gap-8">
                                                    {/* Image with premium styling */}
                                                    <div className="relative">
                                                        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-1 shadow-2xl">
                                                            <div className="w-full h-full rounded-xl overflow-hidden bg-muted">
                                                                <img
                                                                    src={selectedConcert.artist_image_url || getDefaultImage()}
                                                                    alt={selectedConcert.artists?.name || selectedConcert.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-br from-primary to-blue-500" />
                                                    </div>

                                                    {/* Details */}
                                                    <div className="space-y-6">
                                                        {/* Attendance */}
                                                        <div className="space-y-3">
                                                            <Badge variant="outline" className="text-sm px-3 py-1">
                                                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                                                Asistencia
                                                            </Badge>
                                                            <ConcertAttendanceButtons concertId={selectedConcert.id} />
                                                        </div>

                                                        {/* Info Cards */}
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Información del Evento</h4>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <Music className="h-5 w-5 text-primary" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs text-muted-foreground font-medium">Artista</p>
                                                                        <p className="text-sm font-semibold text-foreground truncate">{selectedConcert.artists?.name}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                                        <MapPin className="h-5 w-5 text-primary" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs text-muted-foreground font-medium">Venue</p>
                                                                        <p className="text-sm font-semibold text-foreground truncate">{selectedConcert.venues?.name}</p>
                                                                    </div>
                                                                </div>

                                                                {selectedConcert.venues?.cities && (
                                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                                                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                                            <MapPin className="h-5 w-5 text-primary" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs text-muted-foreground font-medium">Ciudad</p>
                                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                                {selectedConcert.venues.cities.name}
                                                                                {selectedConcert.venues.cities.countries?.name &&
                                                                                    `, ${selectedConcert.venues.cities.countries.name}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {selectedConcert.date && (
                                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                                                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                            <Calendar className="h-5 w-5 text-blue-500" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-xs text-muted-foreground font-medium">Fecha</p>
                                                                            <Badge variant="secondary" className="mt-1 font-bold">
                                                                                {formatDate(selectedConcert.date).day} {formatDate(selectedConcert.date).month} {formatDate(selectedConcert.date).year}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        {selectedConcert.description && (
                                                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                                                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                                    Descripción
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                                    {selectedConcert.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="grid md:grid-cols-2 gap-3 pt-6 border-t border-border/50">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full rounded-lg h-12 font-semibold hover:bg-muted"
                                                        asChild
                                                    >
                                                        <Link to={`/concerts/${selectedConcert.slug}`}>
                                                            <ArrowRight className="h-4 w-4 mr-2" />
                                                            Ver página completa
                                                        </Link>
                                                    </Button>

                                                    {selectedConcert.ticket_url && (
                                                        <Button
                                                            className="w-full rounded-lg h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                                            onClick={() => window.open(selectedConcert.ticket_url!, '_blank')}
                                                        >
                                                            <Ticket className="h-4 w-4 mr-2" />
                                                            Comprar Entradas
                                                        </Button>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="community" className="mt-0">
                                                <ConcertCommunity
                                                    concertId={selectedConcert.id}
                                                    concertTitle={selectedConcert.title}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    )}
                                </div>
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
