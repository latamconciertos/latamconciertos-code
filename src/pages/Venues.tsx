import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// Pills de filtro "Evolución Nocturna": seleccionada con gradiente firma, resto sobre superficie
const pillBase = 'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300';
const pillActive = `${pillBase} bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)]`;
const pillInactive = `${pillBase} bg-superficie border border-linea text-texto-2 hover:text-texto hover:border-[rgba(231,4,133,.35)]`;

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
        "url": "https://www.conciertoslatam.com/venues",
        "numberOfItems": venues.length,
        "itemListElement": venues.slice(0, 10).map((venue, index) => ({
            "@type": "MusicVenue",
            "position": index + 1,
            "name": venue.name,
            "address": venue.address || venue.location,
            "url": `https://www.conciertoslatam.com/venues/${venue.cities?.slug || 'venue'}/${venue.slug}`
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
            {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
            <div className="dark font-fira min-h-screen bg-noche text-texto">
                <Header />

                <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16">
                    <Breadcrumbs items={[{ label: 'Venues' }]} />

                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <span className="eyebrow-nocturno mb-3">Recintos musicales</span>
                        <h1 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-4">
                            Venues de Conciertos
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
                            Los principales estadios, arenas, teatros y foros de eventos musicales en América Latina
                        </p>
                    </div>

                    {/* Country Filter */}
                    <div className="mb-4">
                        {isMobile ? (
                            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                                <div className="flex gap-2 min-w-max pb-2">
                                    <button
                                        onClick={() => handleCountryChange('all')}
                                        className={selectedCountry === 'all' ? pillActive : pillInactive}
                                        aria-pressed={selectedCountry === 'all'}
                                    >
                                        Todos
                                    </button>
                                    {countries.map((country) => (
                                        <button
                                            key={country.id}
                                            onClick={() => handleCountryChange(country.id)}
                                            className={selectedCountry === country.id ? pillActive : pillInactive}
                                            aria-pressed={selectedCountry === country.id}
                                        >
                                            {country.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="inline-flex flex-wrap justify-center gap-2">
                                    <button
                                        onClick={() => handleCountryChange('all')}
                                        className={selectedCountry === 'all' ? pillActive : pillInactive}
                                        aria-pressed={selectedCountry === 'all'}
                                    >
                                        Todos los países
                                    </button>
                                    {countries.map((country) => (
                                        <button
                                            key={country.id}
                                            onClick={() => handleCountryChange(country.id)}
                                            className={selectedCountry === country.id ? pillActive : pillInactive}
                                            aria-pressed={selectedCountry === country.id}
                                        >
                                            {country.name}
                                        </button>
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
                                        <button
                                            onClick={() => setSelectedCity('all')}
                                            className={selectedCity === 'all' ? pillActive : pillInactive}
                                            aria-pressed={selectedCity === 'all'}
                                        >
                                            Todas las ciudades
                                        </button>
                                        {cities.map((city) => (
                                            <button
                                                key={city.id}
                                                onClick={() => setSelectedCity(city.id)}
                                                className={selectedCity === city.id ? pillActive : pillInactive}
                                                aria-pressed={selectedCity === city.id}
                                            >
                                                {city.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <div className="inline-flex flex-wrap justify-center gap-2">
                                        <button
                                            onClick={() => setSelectedCity('all')}
                                            className={selectedCity === 'all' ? pillActive : pillInactive}
                                            aria-pressed={selectedCity === 'all'}
                                        >
                                            Todas las ciudades
                                        </button>
                                        {cities.map((city) => (
                                            <button
                                                key={city.id}
                                                onClick={() => setSelectedCity(city.id)}
                                                className={selectedCity === city.id ? pillActive : pillInactive}
                                                aria-pressed={selectedCity === city.id}
                                            >
                                                {city.name}
                                            </button>
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
                                    <Card className="group overflow-hidden rounded-[20px] border-linea bg-superficie hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                                        {venue.image_url && (
                                            <div className="relative h-40 overflow-hidden bg-superficie-2">
                                                <img
                                                    src={venue.image_url}
                                                    alt={venue.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {/* Overlay oscuro desde abajo para que el texto respire */}
                                                <div
                                                    className="absolute inset-0"
                                                    style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
                                                />
                                                {venue.capacity && (
                                                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-linea bg-noche/80 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-verde">
                                                        <Users className="h-3 w-3" aria-hidden="true" />
                                                        {venue.capacity.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-4">
                                                {!venue.image_url && (
                                                    <div className="bg-periwinkle/10 p-3 rounded-2xl flex-shrink-0">
                                                        <Building className="h-8 w-8 text-periwinkle" aria-hidden="true" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg text-texto group-hover:text-periwinkle transition-colors mb-2 truncate">
                                                        {venue.name}
                                                    </h3>
                                                    {venue.cities && (
                                                        <div className="flex items-center gap-1 text-sm text-texto-2 mb-2">
                                                            <MapPin className="h-4 w-4 flex-shrink-0 text-periwinkle" aria-hidden="true" />
                                                            <span className="truncate">
                                                                {venue.cities.name}
                                                                {venue.cities.countries && `, ${venue.cities.countries.name}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {venue.address && (
                                                        <p className="text-sm text-texto-2 line-clamp-2 mb-3">
                                                            {venue.address}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        {venue.capacity && !venue.image_url && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-linea bg-superficie-2 px-2.5 py-1 text-xs font-semibold text-texto-2">
                                                                <Users className="h-3 w-3 text-verde" aria-hidden="true" />
                                                                <span className="text-verde">{venue.capacity.toLocaleString()}</span> personas
                                                            </span>
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
                            <Building className="h-24 w-24 text-periwinkle/40 mx-auto mb-4" aria-hidden="true" />
                            <h3 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-2">No hay venues disponibles</h3>
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
