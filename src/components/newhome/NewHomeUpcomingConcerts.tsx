import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowRight, MapPin, Ticket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { StadiumArcs } from './StadiumArcs';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ModernConcertCard } from './ModernConcertCard';
import { useUpcomingNearbyConcerts, queryKeys } from '@/hooks/queries';
import { useUserLocation } from '@/hooks/useUserLocation';
import { LocationPicker } from './LocationPicker';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { withTicketTracking } from '@/lib/ticketUrl';
import { spotifyService } from '@/lib/spotify';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import { getConcertImage } from '@/lib/concertImage';
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
    const [selectedConcert, setSelectedConcert] = useState<ConcertWithImage | null>(null);

    // La agenda se ordena por cercanía al usuario: no tiene sentido que alguien en México
    // abra el home y vea solo fechas de Bogotá.
    const { countryId, countryName, cityName, source, isLoading: locationLoading, setPreferred } =
        useUserLocation();
    const { data: concertsData, isLoading: concertsLoading } = useUpcomingNearbyConcerts({
        countryId,
        cityName,
        limit: 8,
        enabled: !locationLoading,
    });
    const concerts = concertsData ?? [];

    // La imagen de Spotify manda sobre la foto de catálogo, y se resuelve ANTES de
    // pintar la grilla: un solo render con la portada definitiva, en vez de mostrar
    // la de catálogo y reemplazarla a los segundos. El caché del servicio (memoria +
    // localStorage) hace que a partir de la segunda visita esto no cueste espera.
    const { data: concertsWithImages, isLoading: imagesLoading } = useQuery({
        queryKey: queryKeys.concerts.artistImages(concerts.map((c) => c.id)),
        enabled: concerts.length > 0,
        staleTime: Infinity,
        queryFn: async () => {
            const BATCH_SIZE = 3;
            const withImages: ConcertWithImage[] = [];

            for (let i = 0; i < concerts.length; i += BATCH_SIZE) {
                const batch = concerts.slice(i, i + BATCH_SIZE);

                const batchResults = await Promise.all(
                    batch.map(async (concert) => {
                        if (!concert.artists?.name) return concert as ConcertWithImage;
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
                    })
                );

                withImages.push(...batchResults);
            }

            return withImages;
        },
    });

    const isLoading = locationLoading || concertsLoading || (concerts.length > 0 && imagesLoading);

    // Cuando el país elegido todavía no tiene fechas, la sección se rellena con la agenda
    // regional: decirlo explícitamente en vez de titular "en México" mostrando Bogotá.
    const hasLocalConcerts = countryName
        ? concerts.some((c) => c.venues?.cities?.countries?.name === countryName)
        : false;
    const subtitle = !countryName
        ? 'Los shows más esperados de Latinoamérica, con fechas y entradas.'
        : hasLocalConcerts
            ? `Los shows más esperados en ${countryName}, con fechas y entradas.`
            : `Aún no tenemos fechas confirmadas en ${countryName}: mientras tanto, la agenda de Latinoamérica.`;

    const getDefaultImage = () => getDefaultImageUtil('concert');
    // El fallback a `concerts` solo aplica si el query de imágenes falló por completo:
    // mejor cards con foto de catálogo que una sección vacía.
    const displayConcerts = concertsWithImages ?? (concerts as ConcertWithImage[]);

    if (isLoading) {
        return (
            <section className="w-full py-12 md:py-16">
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
        <section className="relative w-full py-12 md:py-16 overflow-hidden">
            {/* Aparición secundaria del elemento firma */}
            <StadiumArcs
                variant="mini"
                className="absolute top-0 right-0 w-[400px] h-[200px] pointer-events-none hidden lg:block"
            />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    eyebrow="Agenda"
                    title="Próximos conciertos"
                    subtitle={subtitle}
                    action={{ label: 'Ver todos los conciertos', to: '/concerts' }}
                    aside={
                        <LocationPicker
                            countryId={countryId}
                            countryName={countryName}
                            source={source}
                            onChange={setPreferred}
                        />
                    }
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {displayConcerts.map((concert) => (
                        <Dialog key={concert.id}>
                            <DialogTrigger asChild>
                                <div onClick={() => setSelectedConcert(concert)}>
                                    <ModernConcertCard concert={concert} />
                                </div>
                            </DialogTrigger>

                            <DialogContent className="flex flex-col max-w-[100vw] sm:max-w-lg md:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden p-0 gap-0 rounded-none sm:rounded-2xl bg-background border-0 sm:border">
                                <DialogTitle className="sr-only">
                                    {selectedConcert?.title}
                                </DialogTitle>

                                {selectedConcert && (
                                    <div className="flex flex-col flex-1 min-h-0">
                                        {/* Hero image — aspect ratio preserved; capped so en pantallas
                                            bajas (13") los botones queden visibles sin scroll */}
                                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] sm:max-h-[38vh] overflow-hidden shrink-0">
                                            <img
                                                src={getConcertImage(selectedConcert, getDefaultImage())}
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
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            {/* Attendance + Actions */}
                                            <div className="px-5 py-4 space-y-4">
                                                <ConcertAttendanceButtons concertId={selectedConcert.id} compact />

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 rounded-full h-11 text-sm font-semibold border-linea bg-transparent hover:bg-superficie-2"
                                                        asChild
                                                    >
                                                        <Link to={`/concerts/${selectedConcert.slug}`}>
                                                            <ArrowRight className="h-4 w-4 mr-1.5" />
                                                            Ver detalles
                                                        </Link>
                                                    </Button>
                                                    {selectedConcert.ticket_url && (
                                                        <Button className="flex-1 rounded-full h-11 text-sm font-semibold border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95" asChild>
                                                            <a
                                                                href={withTicketTracking(selectedConcert.ticket_url)}
                                                                target="_blank"
                                                                rel="sponsored noopener noreferrer"
                                                            >
                                                                <Ticket className="h-4 w-4 mr-1.5" />
                                                                Entradas
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Community section */}
                                            <div className="border-t border-border/40 px-5 py-4">
                                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-fucsia" />
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
            </div>
        </section>
    );
};
