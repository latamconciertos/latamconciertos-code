/**
 * Schema Generators
 * 
 * Functions to generate Schema.org JSON-LD structured data.
 */

import { SEO_CONFIG } from './constants';

interface SchemaLocation {
    name: string;
    streetAddress?: string;
    addressLocality: string;
    addressCountry: string;
}

interface SchemaPerformer {
    '@type': 'MusicGroup' | 'Person';
    name: string;
}

/**
 * Generate MusicEvent schema for a concert
 */
export function generateConcertSchema(concert: any) {
    const location: SchemaLocation = {
        name: concert.venues?.name || 'Venue TBA',
        addressLocality: concert.venues?.cities?.name || '',
        addressCountry: concert.venues?.cities?.countries?.code || '',
    };

    const performer: SchemaPerformer = {
        '@type': 'MusicGroup',
        name: concert.artists?.name || 'Artist',
    };

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: concert.title || concert.artists?.name,
        description: concert.description || `Concierto de ${concert.artists?.name} en ${location.addressLocality}`,
        startDate: concert.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: location.name,
            address: {
                '@type': 'PostalAddress',
                addressLocality: location.addressLocality,
                addressCountry: location.addressCountry,
            },
        },
        performer,
    };

    // Add image if available
    if (concert.artists?.photo_url || concert.image_url) {
        (schema as any).image = [concert.artists?.photo_url || concert.image_url];
    }

    // Add organizer if available
    if (concert.promoters?.name) {
        (schema as any).organizer = {
            '@type': 'Organization',
            name: concert.promoters.name,
            url: concert.promoters.website || undefined,
        };
    }

    // Add offers if ticket URL is available
    if (concert.ticket_url) {
        (schema as any).offers = {
            '@type': 'Offer',
            url: concert.ticket_url,
            availability: 'https://schema.org/InStock',
            validFrom: new Date().toISOString().split('T')[0],
        };
    }

    return schema;
}

/**
 * Generate MusicFestival schema for a festival
 */
export function generateFestivalSchema(festival: any) {
    const location: SchemaLocation = {
        name: festival.venues?.name || 'Venue TBA',
        addressLocality: festival.venues?.cities?.name || '',
        addressCountry: festival.venues?.cities?.countries?.code || '',
    };

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: festival.name,
        description: festival.description || `Festival ${festival.name}`,
        startDate: festival.start_date,
        endDate: festival.end_date || festival.start_date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: location.name,
            address: {
                '@type': 'PostalAddress',
                addressLocality: location.addressLocality,
                addressCountry: location.addressCountry,
            },
        },
    };

    // Add image if available
    if (festival.image_url) {
        (schema as any).image = [festival.image_url];
    }

    // Add organizer if available
    if (festival.promoters?.name) {
        (schema as any).organizer = {
            '@type': 'Organization',
            name: festival.promoters.name,
            url: festival.promoters.website || undefined,
        };
    }

    // Add performers if lineup is available
    if (festival.lineup && festival.lineup.length > 0) {
        (schema as any).performer = festival.lineup.map((artist: any) => ({
            '@type': 'MusicGroup',
            name: artist.artists?.name || artist.name,
        }));
    }

    // Add offers if ticket URL is available
    if (festival.ticket_url) {
        (schema as any).offers = {
            '@type': 'Offer',
            url: festival.ticket_url,
            availability: 'https://schema.org/InStock',
            validFrom: new Date().toISOString().split('T')[0],
        };
    }

    return schema;
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${SEO_CONFIG.siteUrl}${item.url}`,
        })),
    };
}

/**
 * Get organization schema
 */
export function getOrganizationSchema() {
    return SEO_CONFIG.organizationSchema;
}
