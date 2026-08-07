import { useParams, Link } from 'react-router-dom';
import { Building, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDisplayDate, formatInBogota } from '@/lib/timezone';
import { useVenueDetail, useVenueDetailConcerts } from '@/hooks/queries';

const VenueDetail = () => {
    const { venueSlug } = useParams();

    const { data: venue, isLoading: venueLoading } = useVenueDetail(venueSlug);
    const { data: concerts = [] } = useVenueDetailConcerts(venue?.id);

    if (venueLoading) {
        return (
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />
                <LoadingSpinner message="Cargando venue..." />
                <Footer />
            </div>
        );
    }

    if (!venue) {
        return (
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <Building className="h-24 w-24 text-periwinkle/40 mx-auto mb-4" aria-hidden="true" />
                        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-6">Venue no encontrado</h2>
                        <Link to="/venues" className="btn-nocturno-secundario">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a venues
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const upcomingConcerts = concerts.filter(c => new Date(c.date) >= new Date());
    const pastConcerts = concerts.filter(c => new Date(c.date) < new Date());

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "MusicVenue",
        "name": venue.name,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": venue.cities?.name,
            "addressCountry": venue.cities?.countries?.name,
            "streetAddress": venue.address
        },
        "maximumAttendeeCapacity": venue.capacity,
        "url": `https://www.conciertoslatam.com/venues/${venue.cities?.slug}/${venue.slug}`,
        "event": upcomingConcerts.map(concert => ({
            "@type": "MusicEvent",
            "name": concert.title,
            "startDate": concert.date,
            "performer": {
                "@type": "MusicGroup",
                "name": concert.artists?.name
            }
        }))
    };

    return (
        <>
            <SEO
                title={`${venue.name} - ${venue.cities?.name} | Conciertos y Eventos 2026`}
                description={`Descubre todos los conciertos y eventos en ${venue.name}, ${venue.cities?.name}. ${upcomingConcerts.length} shows próximos. Capacidad: ${venue.capacity?.toLocaleString()} personas. Entradas, fechas y más información.`}
                keywords={`${venue.name}, ${venue.name} conciertos, ${venue.name} eventos, ${venue.cities?.name}, ${venue.cities?.countries?.name}, ${venue.name} entradas, ${venue.name} tickets, conciertos ${venue.cities?.name}, eventos ${venue.cities?.name}`}
                image={venue.image_url || undefined}
                url={`/venues/${venue.cities?.slug}/${venue.slug}`}
                structuredData={structuredData}
            />
            {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />

                <main className="pt-24 pb-12">
                    <div className="container mx-auto px-4">
                        <Breadcrumbs items={[
                            { label: 'Venues', href: '/venues' },
                            { label: venue.cities?.name || '', href: `/venues?city=${venue.cities?.slug}` },
                            { label: venue.name }
                        ]} />
                    </div>

                    {/* Hero Section */}
                    <div className="relative">
                        {/* Background Banner — glow cobalto sobre la noche, nunca cobalto plano */}
                        <div className="relative h-64 md:h-80 bg-noche overflow-hidden">
                            {venue.image_url && (
                                <div className="absolute inset-0 opacity-20">
                                    <img
                                        src={venue.image_url}
                                        alt=""
                                        className="w-full h-full object-cover blur-sm"
                                    />
                                </div>
                            )}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'linear-gradient(180deg, rgba(0,74,173,.3), rgba(7,13,31,.4) 55%, #070D1F)' }}
                                aria-hidden="true"
                            />
                        </div>

                        {/* Venue Card Floating */}
                        <div className="container mx-auto px-4">
                            <div className="relative -mt-52 md:-mt-64 mb-8">
                                <Card className="overflow-hidden rounded-[20px] border-linea bg-superficie shadow-[0_20px_50px_rgba(0,0,0,.5)]">
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                                            {/* Venue Icon/Image */}
                                            <div className="flex-shrink-0">
                                                {venue.image_url ? (
                                                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-1 ring-linea bg-superficie-2">
                                                        <img
                                                            src={venue.image_url}
                                                            alt={venue.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-1 ring-linea bg-periwinkle/10 flex items-center justify-center">
                                                        <Building className="h-24 w-24 text-periwinkle" aria-hidden="true" />
                                                    </div>
                                                )}
                                                <span className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-verde/30 bg-noche/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-verde">
                                                    <Building className="h-4 w-4" aria-hidden="true" />
                                                    Venue Verificado
                                                </span>
                                            </div>

                                            {/* Venue Info */}
                                            <div className="flex-1 text-center md:text-left">
                                                <h1 className="font-display uppercase text-3xl md:text-4xl lg:text-5xl font-black tracking-[0.01em] leading-[0.95] text-texto mb-3">
                                                    {venue.name}
                                                </h1>

                                                <div className="space-y-2 mb-6">
                                                    {venue.cities && (
                                                        <div className="flex items-center gap-2 justify-center md:justify-start text-lg">
                                                            <MapPin className="h-5 w-5 text-periwinkle" aria-hidden="true" />
                                                            <span className="font-medium">
                                                                {venue.cities.name}
                                                                {venue.cities.countries && `, ${venue.cities.countries.name}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {venue.address && (
                                                        <p className="text-texto-2">
                                                            {venue.address}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                    {venue.capacity && (
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-linea bg-superficie-2">
                                                            <Users className="h-4 w-4 text-periwinkle" aria-hidden="true" />
                                                            <span className="text-sm font-semibold">
                                                                Capacidad: <span className="text-verde">{venue.capacity.toLocaleString()}</span> personas
                                                            </span>
                                                        </div>
                                                    )}
                                                    {upcomingConcerts.length > 0 && (
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-linea bg-superficie-2">
                                                            <Calendar className="h-4 w-4 text-periwinkle" aria-hidden="true" />
                                                            <span className="text-sm font-semibold">
                                                                <span className="text-verde">{upcomingConcerts.length}</span> {upcomingConcerts.length === 1 ? 'Concierto Próximo' : 'Conciertos Próximos'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Concerts Section */}
                    <div className="container mx-auto px-4">
                        {upcomingConcerts.length > 0 && (
                            <div className="mb-12">
                                <h2 className="font-display uppercase text-2xl md:text-3xl font-extrabold tracking-[0.01em] leading-none mb-6">Próximos Conciertos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingConcerts.map((concert) => {
                                        const monthShort = formatInBogota(concert.date, 'MMM').toUpperCase();
                                        const day = formatInBogota(concert.date, 'd');

                                        return (
                                            <Link key={concert.id} to={`/concerts/${concert.slug}`}>
                                                <Card className="group overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                                                    <div className="relative overflow-hidden bg-superficie-2">
                                                        <img
                                                            src={concert.image_url || concert.artists?.photo_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop"}
                                                            alt={concert.title}
                                                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                        {/* Overlay oscuro desde abajo para que el texto respire */}
                                                        <div
                                                            className="absolute inset-0"
                                                            style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
                                                        />
                                                        {/* Chip de fecha: número grande en verde, Big Shoulders */}
                                                        <div className="absolute top-3 right-3 rounded-2xl border border-linea bg-noche/80 backdrop-blur-sm px-3 py-2 text-center min-w-[56px]">
                                                            <div className="font-display text-2xl font-extrabold text-verde leading-none">{day}</div>
                                                            <div className="font-fira text-[10px] uppercase tracking-[0.12em] text-texto-2 mt-0.5">{monthShort}</div>
                                                        </div>

                                                    </div>
                                                    <CardContent className="p-5 space-y-3">
                                                        {/* Artist Name */}
                                                        {concert.artists && (
                                                            <p className="text-xs font-semibold text-periwinkle uppercase tracking-[0.14em]">
                                                                {concert.artists.name}
                                                            </p>
                                                        )}
                                                        {/* Concert Title */}
                                                        <h3 className="font-bold text-lg text-texto group-hover:text-periwinkle transition-colors line-clamp-2">
                                                            {concert.title}
                                                        </h3>
                                                        {/* Location */}
                                                        <div className="flex items-center gap-2 text-sm text-texto-2">
                                                            <MapPin className="h-4 w-4 flex-shrink-0 text-periwinkle" aria-hidden="true" />
                                                            <span className="truncate">{venue.cities?.name}</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {pastConcerts.length > 0 && (
                            <div>
                                <h2 className="font-display uppercase text-2xl md:text-3xl font-extrabold tracking-[0.01em] leading-none mb-6">Conciertos Pasados</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastConcerts.slice(0, 6).map((concert) => (
                                        <Link key={concert.id} to={`/concerts/${concert.slug}`}>
                                            <Card className="group overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] transition-all duration-300 cursor-pointer opacity-75 hover:opacity-100">
                                                <div className="flex gap-4 p-4">
                                                    <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-superficie-2">
                                                        <img
                                                            src={concert.image_url || concert.artists?.photo_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop"}
                                                            alt={concert.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-texto line-clamp-2 mb-1">
                                                            {concert.title}
                                                        </h4>
                                                        {concert.artists && (
                                                            <p className="text-sm text-texto-2 mb-1">
                                                                {concert.artists.name}
                                                            </p>
                                                        )}
                                                        <span className="inline-flex items-center rounded-full border border-linea bg-superficie-2 px-2.5 py-1 text-xs text-texto-2">
                                                            {formatDisplayDate(concert.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {concerts.length === 0 && (
                            <div className="text-center py-12">
                                <Calendar className="h-16 w-16 text-periwinkle/40 mx-auto mb-4" aria-hidden="true" />
                                <h3 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-2">No hay conciertos registrados</h3>
                                <p className="text-muted-foreground">
                                    Aún no hay conciertos programados en este venue.
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default VenueDetail;
