import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Music, Globe, Users, ArrowLeft, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import FestivalAttendanceButtons from '@/components/FestivalAttendanceButtons';
import { SocialShare } from '@/components/SocialShare';
import { useFestivalDetail } from '@/hooks/queries/useFestivalDetail';
import { withTicketTracking } from '@/lib/ticketUrl';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const FestivalDetail = () => {
    const { slug } = useParams();
    const { data, isLoading } = useFestivalDetail(slug);

    const festival = data?.festival;
    const lineup = data?.lineup || [];

    const isUpcoming = festival?.start_date ? new Date(festival.start_date) >= new Date() : true;

    const formatDateRange = (startDate: string | null, endDate?: string | null) => {
        if (!startDate) return 'Fecha por confirmar';

        const start = parseISO(startDate);
        const startDay = format(start, 'd', { locale: es });
        const startMonth = format(start, 'MMM', { locale: es });

        if (!endDate) {
            return `${startDay} ${startMonth}`;
        }

        const end = parseISO(endDate);
        const endDay = format(end, 'd', { locale: es });

        if (start.getMonth() === end.getMonth()) {
            return `${startDay} - ${endDay} ${startMonth}`;
        }

        const endMonth = format(end, 'MMM', { locale: es });
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    };

    if (isLoading) {
        return (
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />
                <LoadingSpinner message="Cargando festival..." />
                <Footer />
            </div>
        );
    }

    if (!festival) {
        return (
            <>
                <SEO
                    title="Festival no encontrado"
                    description="El festival que buscas no existe o ha sido eliminado."
                    url={`/festivals/${slug}`}
                />
                {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
                <div className="dark font-fira min-h-screen bg-noche text-texto">
                    <Header />
                    <div className="container mx-auto px-4 py-24">
                        <div className="text-center">
                            <PartyPopper className="h-24 w-24 text-periwinkle/40 mx-auto mb-4" />
                            <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-4">Festival no encontrado</h1>
                            <p className="text-muted-foreground mb-8">
                                El festival que buscas no existe o ha sido eliminado.
                            </p>
                            <Link to="/festivals" className="btn-nocturno-secundario">
                                <ArrowLeft className="h-4 w-4" />
                                Ver todos los festivales
                            </Link>
                        </div>
                    </div>
                    <Footer />
                </div>
            </>
        );
    }

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Festival",
        "name": festival.name,
        "description": festival.description || `Festival ${festival.name}${festival.edition ? ` - Edición ${festival.edition}` : ''}`,
        "image": festival.image_url,
        "startDate": festival.start_date || undefined,
        "endDate": festival.end_date || undefined,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": festival.venues ? {
            "@type": "Place",
            "name": festival.venues.name,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": festival.venues.cities?.name || "",
                "addressCountry": festival.venues.cities?.countries?.name || ""
            }
        } : undefined,
        "organizer": {
            "@type": "Organization",
            "name": "Conciertos Latam",
            "url": "https://www.conciertoslatam.com"
        },
        "offers": festival.ticket_url ? {
            "@type": "Offer",
            "url": festival.ticket_url,
            "availability": "https://schema.org/InStock"
        } : undefined
    };

    return (
        <>
            <SEO
                title={`${festival.name}${festival.edition ? ` ${festival.edition}` : ''}`}
                description={festival.description || `Toda la información sobre ${festival.name}. Fecha, lugar, entradas y más.`}
                keywords={`${festival.name}, festival, entradas, ${festival.venues?.cities?.name || ''}`}
                image={festival.image_url || undefined}
                url={`/festivals/${festival.slug}`}
                structuredData={structuredData}
            />
            {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />

                <main className="pt-20 sm:pt-24 pb-12">
                    <div className="container mx-auto px-4">
                        <Breadcrumbs items={[
                            { label: 'Festivales', href: '/festivals' },
                            { label: festival.name }
                        ]} />

                        {/* Hero Section */}
                        <div className="relative mb-6 sm:mb-8">
                            <div className="h-48 sm:h-64 md:h-96 rounded-[20px] border border-linea bg-superficie-2 overflow-hidden">
                                <img
                                    src={festival.image_url || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=600&fit=crop"}
                                    alt={festival.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay oscuro desde abajo para que el texto respire */}
                                <div
                                    className="absolute inset-0 rounded-[20px]"
                                    style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(7,13,31,.9))' }}
                                />
                            </div>

                            {/* Floating Favorite Button */}
                            <div className="absolute top-4 right-4 z-10">
                                <FestivalAttendanceButtons festivalId={festival.id} variant="card-favorite" />
                            </div>

                            {/* Festival Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-4">
                                    {festival.edition && (
                                        <span className="inline-flex items-center rounded-full border border-verde/30 bg-noche/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-verde">
                                            Edición {festival.edition}
                                        </span>
                                    )}
                                    {isUpcoming ? (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-verde/30 bg-noche/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-verde">
                                            <span className="h-1.5 w-1.5 rounded-full bg-verde punto-vivo" aria-hidden="true" />
                                            Próximo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-linea bg-noche/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-texto-2">
                                            Finalizado
                                        </span>
                                    )}
                                </div>
                                <h1 className="font-display uppercase text-2xl sm:text-4xl md:text-6xl font-black tracking-[0.01em] leading-[0.95] text-texto mb-1 sm:mb-2 line-clamp-2">
                                    {festival.name}
                                </h1>
                            </div>
                        </div>

                        {/* Mobile Layout: Stack everything */}
                        <div className="lg:hidden space-y-4">
                            {/* 1. Lineup - Lo más importante primero */}
                            {lineup && lineup.length > 0 && (
                                <Card className="rounded-[20px] border-linea bg-superficie">
                                    <CardContent className="p-4">
                                        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <Music className="h-4 w-4 text-periwinkle" />
                                            Lineup
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {lineup.map((lineupItem) => (
                                                <div
                                                    key={lineupItem.id}
                                                    className="group relative overflow-hidden rounded-2xl border border-linea bg-superficie-2 p-3 hover:border-[rgba(231,4,133,.35)] transition-all duration-300"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {lineupItem.artistImage ? (
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-superficie-2">
                                                                <img
                                                                    src={lineupItem.artistImage}
                                                                    alt={lineupItem.artists.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-periwinkle/10 flex items-center justify-center group-hover:bg-periwinkle/20 transition-colors">
                                                                <Music className="h-4 w-4 text-periwinkle" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-foreground truncate group-hover:text-periwinkle transition-colors">
                                                                {lineupItem.artists.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 2. Detalles del evento */}
                            <Card className="rounded-[20px] border-linea bg-superficie">
                                <CardContent className="p-4 space-y-3">
                                    <h3 className="font-bold text-base">Detalles del festival</h3>

                                    <div className="space-y-2.5">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm">Fecha</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {formatDateRange(festival.start_date, festival.end_date)}
                                                </p>
                                            </div>
                                        </div>

                                        {festival.venues && (
                                            <>
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm">Venue</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {festival.venues.name}
                                                        </p>
                                                    </div>
                                                </div>

                                                {festival.venues.cities && (
                                                    <div className="flex items-start gap-3">
                                                        <Globe className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm">Ubicación</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {festival.venues.cities.name}
                                                                {festival.venues.cities.countries?.name && `, ${festival.venues.cities.countries.name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {festival.promoters && (
                                            <div className="flex items-start gap-3">
                                                <Users className="h-4 w-4 text-periwinkle mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm">Promotor</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {festival.promoters.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isUpcoming && festival.ticket_url && (
                                        <Button className="w-full mt-3 rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95" size="sm" asChild>
                                            <a
                                                href={withTicketTracking(festival.ticket_url)}
                                                target="_blank"
                                                rel="sponsored noopener noreferrer"
                                            >
                                                <Ticket className="h-4 w-4 mr-2" />
                                                Comprar Entradas
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 3. ¿Vas a asistir? */}
                            <Card className="rounded-[20px] border-linea bg-superficie">
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-base mb-3">¿Vas a asistir?</h3>
                                    <FestivalAttendanceButtons festivalId={festival.id} />
                                </CardContent>
                            </Card>

                            {/* 4. Compartir */}
                            <Card className="rounded-[20px] border-linea bg-superficie">
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-base mb-3">Compartir</h3>
                                    <SocialShare
                                        title={festival.name}
                                        url={`https://www.conciertoslatam.com/festivals/${festival.slug}`}
                                    />
                                </CardContent>
                            </Card>

                            {/* 5. Description */}
                            {festival.description && (
                                <Card className="rounded-[20px] border-linea bg-superficie">
                                    <CardContent className="p-4">
                                        <h2 className="text-base font-bold mb-3">Acerca del festival</h2>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {festival.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden lg:grid grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="col-span-2 space-y-8">
                                {/* Description */}
                                {festival.description && (
                                    <Card className="rounded-[20px] border-linea bg-superficie">
                                        <CardContent className="p-6">
                                            <h2 className="text-xl font-bold mb-4">Acerca del festival</h2>
                                            <p className="text-muted-foreground whitespace-pre-line">
                                                {festival.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Lineup */}
                                {lineup && lineup.length > 0 && (
                                    <Card className="rounded-[20px] border-linea bg-superficie">
                                        <CardContent className="p-6">
                                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Music className="h-5 w-5 text-periwinkle" />
                                                Lineup
                                            </h2>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {lineup.map((lineupItem) => (
                                                    <div
                                                        key={lineupItem.id}
                                                        className="group relative overflow-hidden rounded-2xl border border-linea bg-superficie-2 p-4 hover:border-[rgba(231,4,133,.35)] transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lineupItem.artistImage ? (
                                                                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-superficie-2">
                                                                    <img
                                                                        src={lineupItem.artistImage}
                                                                        alt={lineupItem.artists.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-periwinkle/10 flex items-center justify-center group-hover:bg-periwinkle/20 transition-colors">
                                                                    <Music className="h-5 w-5 text-periwinkle" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-foreground truncate group-hover:text-periwinkle transition-colors">
                                                                    {lineupItem.artists.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* 1. Event Details Card */}
                                <Card className="rounded-[20px] border-linea bg-superficie">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-lg">Detalles del festival</h3>

                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Calendar className="h-5 w-5 text-periwinkle mt-0.5" />
                                                <div>
                                                    <p className="font-medium">Fecha</p>
                                                    <p className="text-sm text-muted-foreground capitalize">
                                                        {formatDateRange(festival.start_date, festival.end_date)}
                                                    </p>
                                                </div>
                                            </div>

                                            {festival.venues && (
                                                <>
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="h-5 w-5 text-periwinkle mt-0.5" />
                                                        <div>
                                                            <p className="font-medium">Venue</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {festival.venues.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {festival.venues.cities && (
                                                        <div className="flex items-start gap-3">
                                                            <Globe className="h-5 w-5 text-periwinkle mt-0.5" />
                                                            <div>
                                                                <p className="font-medium">Ubicación</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {festival.venues.cities.name}
                                                                    {festival.venues.cities.countries?.name && `, ${festival.venues.cities.countries.name}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {festival.promoters && (
                                                <div className="flex items-start gap-3">
                                                    <Users className="h-5 w-5 text-periwinkle mt-0.5" />
                                                    <div>
                                                        <p className="font-medium">Promotor</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {festival.promoters.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isUpcoming && festival.ticket_url && (
                                            <Button className="w-full mt-4 rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95" asChild>
                                                <a
                                                    href={withTicketTracking(festival.ticket_url)}
                                                    target="_blank"
                                                    rel="sponsored noopener noreferrer"
                                                >
                                                    <Ticket className="h-4 w-4 mr-2" />
                                                    Comprar Entradas
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 2. Attendance */}
                                <Card className="rounded-[20px] border-linea bg-superficie">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-lg mb-4">¿Vas a asistir?</h3>
                                        <FestivalAttendanceButtons festivalId={festival.id} />
                                    </CardContent>
                                </Card>

                                {/* 3. Share */}
                                <Card className="rounded-[20px] border-linea bg-superficie">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-lg mb-4">Compartir</h3>
                                        <SocialShare
                                            title={festival.name}
                                            url={`https://www.conciertoslatam.com/festivals/${festival.slug}`}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default FestivalDetail;
