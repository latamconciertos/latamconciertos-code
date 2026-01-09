// Shared types for Concerts Admin components
export interface Concert {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    date: string | null;
    image_url: string | null;
    ticket_url: string | null;
    ticket_prices_html?: string | null;
    artist_id: string | null;
    venue_id: string | null;
    promoter_id: string | null;
    event_type: 'concert' | 'festival';
    is_featured: boolean;
    spotify_embed_url?: string | null;
    created_at: string;
}

export interface Artist {
    id: string;
    name: string;
}

export interface Venue {
    id: string;
    name: string;
    cities?: {
        name: string;
    };
}

export interface Promoter {
    id: string;
    name: string;
}

export interface ConcertFilters {
    search: string;
    eventType: string;
    status: string;
    artistId: string;
    venueId: string;
    promoterId: string;
    featured: boolean | null;
}
