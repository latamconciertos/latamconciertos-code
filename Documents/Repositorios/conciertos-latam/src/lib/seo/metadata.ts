/**
 * Metadata Generators
 * 
 * Functions to generate SEO metadata for pages.
 */

import { SEO_CONFIG, COUNTRY_SEO, type CountryCode } from './constants';

interface PageMetadata {
    title: string;
    description: string;
    keywords: string[];
    image?: string;
    url: string;
    type?: 'website' | 'article';
}

/**
 * Generate metadata for home page
 */
export function generateHomeMetadata(): PageMetadata {
    return {
        title: 'Conciertos en LATAM 2026 | Próximos Shows y Festivales',
        description: 'Encuentra los mejores conciertos y festivales en Colombia, México, Argentina, Chile, Perú y toda Latinoamérica. Compra tickets y no te pierdas tu artista favorito en 2026.',
        keywords: [
            'conciertos latam',
            'festivales música latinoamérica',
            'tickets conciertos',
            'shows 2026',
            'conciertos colombia',
            'conciertos méxico',
            'conciertos argentina',
        ],
        image: SEO_CONFIG.defaultImage,
        url: '',
        type: 'website',
    };
}

/**
 * Generate metadata for country page
 */
export function generateCountryMetadata(countryCode: CountryCode): PageMetadata {
    const country = COUNTRY_SEO[countryCode];
    const citiesText = country.cities.slice(0, 3).join(', ');

    return {
        title: `Conciertos en ${country.name} 2026 | Próximos Shows en ${citiesText}`,
        description: `Descubre todos los conciertos y festivales en ${country.name} 2026. Los mejores artistas en ${citiesText} y más. Compra tickets para ver tus shows favoritos.`,
        keywords: [
            ...country.keywords,
            'tickets',
            'boletos',
            'entradas',
            '2026',
        ],
        image: SEO_CONFIG.defaultImage,
        url: `/conciertos/${country.name.toLowerCase()}`,
        type: 'website',
    };
}

/**
 * Generate metadata for concert detail page
 */
export function generateConcertMetadata(concert: any): PageMetadata {
    const artist = concert.artists?.name || 'Artista';
    const venue = concert.venues?.name || 'Venue';
    const city = concert.venues?.cities?.name || 'Ciudad';
    const date = new Date(concert.date).toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return {
        title: `${artist} en ${venue} ${city} - ${date} | Tickets`,
        description: `${artist} ${concert.title ? `presenta ${concert.title}` : ''} en ${venue}, ${city} el ${date}. Compra tickets y no te pierdas este increíble show.`,
        keywords: [
            artist.toLowerCase(),
            `${artist.toLowerCase()} ${city.toLowerCase()}`,
            `tickets ${artist.toLowerCase()}`,
            `concierto ${artist.toLowerCase()}`,
            venue.toLowerCase(),
        ],
        image: concert.artists?.photo_url || concert.image_url || SEO_CONFIG.defaultImage,
        url: `/conciertos/${concert.slug || concert.id}`,
        type: 'article',
    };
}

/**
 * Generate metadata for festival detail page
 */
export function generateFestivalMetadata(festival: any): PageMetadata {
    const venue = festival.venues?.name || 'Venue';
    const city = festival.venues?.cities?.name || 'Ciudad';
    const startDate = new Date(festival.start_date).toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const description = festival.description
        ? festival.description.substring(0, 155)
        : `${festival.name} en ${venue}, ${city}. Festival de música con los mejores artistas. Compra tus tickets ahora.`;

    return {
        title: `${festival.name} ${festival.edition ? festival.edition : ''} | ${city} - Tickets`,
        description,
        keywords: [
            festival.name.toLowerCase(),
            'festival',
            `festival ${city.toLowerCase()}`,
            `${festival.name.toLowerCase()} tickets`,
            city.toLowerCase(),
        ],
        image: festival.image_url || SEO_CONFIG.defaultImage,
        url: `/festivales/${festival.slug || festival.id}`,
        type: 'article',
    };
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
    return `${SEO_CONFIG.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate hreflang alternates for multi-country pages
 */
export function generateHreflangAlternates(basePath: string) {
    return Object.entries(COUNTRY_SEO).map(([code, country]) => ({
        hreflang: `es-${code}`,
        href: `${SEO_CONFIG.siteUrl}${basePath}/${country.name.toLowerCase()}`,
    }));
}
