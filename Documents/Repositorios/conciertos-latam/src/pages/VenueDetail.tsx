import { useParams, Link } from 'react-router-dom';
import { Building, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
            <div className="min-h-screen bg-background">
                <Header />
                <LoadingSpinner message="Cargando venue..." />
                <Footer />
            </div>
        );
    }

    if (!venue) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <Building className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Venue no encontrado</h2>
                        <Link to="/venues">
                            <Button>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a venues
                            </Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const upcomingConcerts = concerts.filter(c => new Date(c.date) >= new Date());
    const pastConcerts = concerts.filter(c => new Date(c.date) < new Date());

    console.log('VenueDetail render:', {
        venueId: venue.id,
        venueName: venue.name,
        totalConcerts: concerts.length,
        upcomingCount: upcomingConcerts.length,
        pastCount: pastConcerts.length,
        concerts
    });

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
        "url": `https://www.conciertoslatam.app/venues/${venue.cities?.slug}/${venue.slug}`,
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
            <div className="min-h-screen bg-background">
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
                        {/* Background Banner */}
                        <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                            {venue.image_url && (
                                <div className="absolute inset-0 opacity-20">
                                    <img
                                        src={venue.image_url}
                                        alt=""
                                        className="w-full h-full object-cover blur-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Venue Card Floating */}
                        <div className="container mx-auto px-4">
                            <div className="relative -mt-52 md:-mt-64 mb-8">
                                <Card className="overflow-hidden shadow-2xl border-2">
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                                            {/* Venue Icon/Image */}
                                            <div className="flex-shrink-0">
                                                {venue.image_url ? (
                                                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden ring-4 ring-primary/20 shadow-xl">
                                                        <img
                                                            src={venue.image_url}
                                                            alt={venue.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden ring-4 ring-primary/20 shadow-xl bg-primary/10 flex items-center justify-center">
                                                        <Building className="h-24 w-24 text-primary" />
                                                    </div>
                                                )}
                                                <Badge className="mt-4 w-full justify-center py-2">
                                                    <Building className="h-4 w-4 mr-2" />
                                                    Venue Verificado
                                                </Badge>
                                            </div>

                                            {/* Venue Info */}
                                            <div className="flex-1 text-center md:text-left">
                                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                                                    {venue.name}
                                                </h1>

                                                <div className="space-y-2 mb-6">
                                                    {venue.cities && (
                                                        <div className="flex items-center gap-2 justify-center md:justify-start text-lg">
                                                            <MapPin className="h-5 w-5 text-primary" />
                                                            <span className="font-medium">
                                                                {venue.cities.name}
                                                                {venue.cities.countries && `, ${venue.cities.countries.name}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {venue.address && (
                                                        <p className="text-muted-foreground">
                                                            {venue.address}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                    {venue.capacity && (
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                                                            <Users className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-semibold">
                                                                Capacidad: {venue.capacity.toLocaleString()} personas
                                                            </span>
                                                        </div>
                                                    )}
                                                    {upcomingConcerts.length > 0 && (
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-semibold">
                                                                {upcomingConcerts.length} {upcomingConcerts.length === 1 ? 'Concierto Próximo' : 'Conciertos Próximos'}
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
                                <h2 className="text-2xl md:text-3xl font-bold mb-6">Próximos Conciertos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingConcerts.map((concert) => {
                                        const monthShort = formatInBogota(concert.date, 'MMM').toUpperCase();
                                        const day = formatInBogota(concert.date, 'd');

                                        return (
                                            <Link key={concert.id} to={`/concerts/${concert.slug}`}>
                                                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0">
                                                    <div className="relative overflow-hidden">
                                                        <img
                                                            src={concert.image_url || concert.artists?.photo_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop"}
                                                            alt={concert.title}
                                                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                        {/* Date Badge - Top Right */}
                                                        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg border border-border">
                                                            <div className="text-2xl font-bold leading-none">{day}</div>
                                                            <div className="text-xs font-medium text-muted-foreground mt-0.5">{monthShort}</div>
                                                        </div>

                                                    </div>
                                                    <CardContent className="p-5 space-y-3">
                                                        {/* Artist Name */}
                                                        {concert.artists && (
                                                            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                                                {concert.artists.name}
                                                            </p>
                                                        )}
                                                        {/* Concert Title */}
                                                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                            {concert.title}
                                                        </h3>
                                                        {/* Location */}
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <MapPin className="h-4 w-4 flex-shrink-0" />
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
                                <h2 className="text-2xl md:text-3xl font-bold mb-6">Conciertos Pasados</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastConcerts.slice(0, 6).map((concert) => (
                                        <Link key={concert.id} to={`/concerts/${concert.slug}`}>
                                            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer opacity-75 hover:opacity-100">
                                                <div className="flex gap-4 p-4">
                                                    <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                                                        <img
                                                            src={concert.image_url || concert.artists?.photo_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop"}
                                                            alt={concert.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-foreground line-clamp-2 mb-1">
                                                            {concert.title}
                                                        </h4>
                                                        {concert.artists && (
                                                            <p className="text-sm text-muted-foreground mb-1">
                                                                {concert.artists.name}
                                                            </p>
                                                        )}
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatDisplayDate(concert.date)}
                                                        </Badge>
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
                                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">No hay conciertos registrados</h3>
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
