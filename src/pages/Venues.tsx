import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
    useVenuesPage,
    useCitiesByCountryForVenues,
    useCountries,
} from '@/hooks/queries';
import type { CountryBasic } from '@/types/entities';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useIsMobile } from '@/hooks/use-mobile';

const Venues = () => {
    const [selectedCountry, setSelectedCountry] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');

    const isMobile = useIsMobile();

    const { data: countriesData = [] } = useCountries();
    const countries = countriesData as unknown as CountryBasic[];
    const { data: cities = [] } = useCitiesByCountryForVenues(selectedCountry);
    const { data: venues = [], isLoading } = useVenuesPage(selectedCountry, selectedCity);

    // Reset city when country changes
    const handleCountryChange = (countryId: string) => {
        setSelectedCountry(countryId);
        setSelectedCity('all');
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Venues de Conciertos en América Latina",
        "description": "Directorio de venues y recintos de eventos musicales en América Latina",
        "url": "https://www.conciertoslatam.app/venues",
        "numberOfItems": venues.length,
        "itemListElement": venues.slice(0, 10).map((venue, index) => ({
            "@type": "MusicVenue",
            "position": index + 1,
            "name": venue.name,
            "address": venue.address || venue.location,
            "url": `https://www.conciertoslatam.app/venues/${venue.cities?.slug || 'venue'}/${venue.slug}`
        }))
    };

    return (
        <>
            <SEO
                title="Venues de Conciertos - Recintos y Estadios Musicales"
                description="Descubre los principales venues y recintos de conciertos en América Latina. Encuentra estadios, arenas, teatros y foros para eventos musicales."
                keywords="venues de conciertos, estadios, arenas, teatros, foros, recintos musicales, América Latina"
                url="/venues"
                structuredData={structuredData}
            />
            <div className="min-h-screen bg-background">
                <Header />

                <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16">
                    <Breadcrumbs items={[{ label: 'Venues' }]} />

                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                            <Building className="h-5 w-5 text-primary" />
                            <span className="text-primary font-semibold">Recintos Musicales</span>
                        </div>
                        <h1 className="page-title mb-4">Venues de Conciertos</h1>
                        <p className="page-subtitle max-w-3xl mx-auto">
                            Los principales estadios, arenas, teatros y foros de eventos musicales en América Latina
                        </p>
                    </div>

                    {/* Country Filter */}
                    <div className="mb-4">
                        {isMobile ? (
                            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                                <div className="flex gap-2 min-w-max pb-2">
                                    <Button
                                        variant={selectedCountry === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleCountryChange('all')}
                                        className="whitespace-nowrap"
                                    >
                                        Todos
                                    </Button>
                                    {countries.map((country) => (
                                        <Button
                                            key={country.id}
                                            variant={selectedCountry === country.id ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleCountryChange(country.id)}
                                            className="whitespace-nowrap"
                                        >
                                            {country.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="inline-flex flex-wrap gap-2 bg-muted p-2 rounded-lg">
                                    <Button
                                        variant={selectedCountry === 'all' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => handleCountryChange('all')}
                                    >
                                        Todos los países
                                    </Button>
                                    {countries.map((country) => (
                                        <Button
                                            key={country.id}
                                            variant={selectedCountry === country.id ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleCountryChange(country.id)}
                                        >
                                            {country.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* City Filter - Only show when country is selected */}
                    {selectedCountry !== 'all' && cities.length > 0 && (
                        <div className="mb-8">
                            {isMobile ? (
                                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                                    <div className="flex gap-2 min-w-max pb-2">
                                        <Button
                                            variant={selectedCity === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSelectedCity('all')}
                                            className="whitespace-nowrap"
                                        >
                                            Todas las ciudades
                                        </Button>
                                        {cities.map((city) => (
                                            <Button
                                                key={city.id}
                                                variant={selectedCity === city.id ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCity(city.id)}
                                                className="whitespace-nowrap"
                                            >
                                                {city.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <div className="inline-flex flex-wrap gap-2 bg-muted/50 p-2 rounded-lg">
                                        <Button
                                            variant={selectedCity === 'all' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setSelectedCity('all')}
                                        >
                                            Todas las ciudades
                                        </Button>
                                        {cities.map((city) => (
                                            <Button
                                                key={city.id}
                                                variant={selectedCity === city.id ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setSelectedCity(city.id)}
                                            >
                                                {city.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Venues Grid */}
                    {isLoading ? (
                        <LoadingSpinnerInline message="Cargando venues..." />
                    ) : venues.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {venues.map((venue) => (
                                <Link
                                    key={venue.id}
                                    to={`/venues/${venue.cities?.slug || 'venue'}/${venue.slug}`}
                                >
                                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                        {venue.image_url && (
                                            <div className="relative h-40 overflow-hidden">
                                                <img
                                                    src={venue.image_url}
                                                    alt={venue.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                {venue.capacity && (
                                                    <Badge className="absolute bottom-3 right-3 bg-primary/90">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {venue.capacity.toLocaleString()}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-4">
                                                {!venue.image_url && (
                                                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                                                        <Building className="h-8 w-8 text-primary" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2 truncate">
                                                        {venue.name}
                                                    </h3>
                                                    {venue.cities && (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                                            <MapPin className="h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {venue.cities.name}
                                                                {venue.cities.countries && `, ${venue.cities.countries.name}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {venue.address && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                            {venue.address}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        {venue.capacity && !venue.image_url && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Users className="h-3 w-3 mr-1" />
                                                                {venue.capacity.toLocaleString()} personas
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Building className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-foreground mb-2">No hay venues disponibles</h3>
                            <p className="text-muted-foreground">
                                {selectedCountry !== 'all' || selectedCity !== 'all'
                                    ? 'No se encontraron venues con los filtros seleccionados.'
                                    : 'Próximamente añadiremos más venues.'}
                            </p>
                        </div>
                    )}
                </main>

                <Footer />
            </div>
        </>
    );
};

export default Venues;
