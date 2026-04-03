/**
 * SEO Constants
 * 
 * Centralized SEO configuration for the application.
 */

export const SEO_CONFIG = {
    siteName: 'Conciertos LATAM',
    siteUrl: 'https://www.conciertoslatam.app',
    defaultImage: '/og-image.png',
    twitterHandle: '@conciertoslatam',

    organizationSchema: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Conciertos LATAM',
        url: 'https://www.conciertoslatam.app',
        logo: 'https://www.conciertoslatam.app/logo.png',
        description: 'La plataforma líder de conciertos y festivales en Latinoamérica',
        sameAs: [
            // Add social media URLs when available
        ],
    },
} as const;

export const COUNTRY_SEO = {
    CO: {
        name: 'Colombia',
        cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
        keywords: ['conciertos colombia', 'shows bogotá', 'festivales colombia', 'tickets conciertos'],
    },
    MX: {
        name: 'México',
        cities: ['Ciudad de México', 'Guadalajara', 'Monterrey'],
        keywords: ['conciertos méxico', 'shows cdmx', 'festivales méxico', 'boletos conciertos'],
    },
    AR: {
        name: 'Argentina',
        cities: ['Buenos Aires', 'Córdoba', 'Rosario'],
        keywords: ['recitales argentina', 'shows buenos aires', 'festivales argentina'],
    },
    CL: {
        name: 'Chile',
        cities: ['Santiago', 'Valparaíso', 'Concepción'],
        keywords: ['conciertos chile', 'shows santiago', 'festivales chile'],
    },
    PE: {
        name: 'Perú',
        cities: ['Lima', 'Arequipa', 'Cusco'],
        keywords: ['conciertos perú', 'shows lima', 'festivales perú'],
    },
    BR: {
        name: 'Brasil',
        cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'],
        keywords: ['shows brasil', 'shows são paulo', 'festivais brasil'],
    },
    EC: {
        name: 'Ecuador',
        cities: ['Quito', 'Guayaquil', 'Cuenca'],
        keywords: ['conciertos ecuador', 'shows quito', 'festivales ecuador'],
    },
    UY: {
        name: 'Uruguay',
        cities: ['Montevideo', 'Punta del Este'],
        keywords: ['recitales uruguay', 'shows montevideo'],
    },
    PY: {
        name: 'Paraguay',
        cities: ['Asunción'],
        keywords: ['conciertos paraguay', 'shows asunción'],
    },
    VE: {
        name: 'Venezuela',
        cities: ['Caracas', 'Maracaibo', 'Valencia'],
        keywords: ['conciertos venezuela', 'shows caracas'],
    },
} as const;

export type CountryCode = keyof typeof COUNTRY_SEO;
