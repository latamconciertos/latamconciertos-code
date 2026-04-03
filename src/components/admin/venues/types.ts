// Shared types for Venues Admin components
export interface Venue {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    capacity: number | null;
    website: string | null;
    city_id: string | null;
    country: string | null;
    created_at: string;
    updated_at?: string;
    cities?: {
        id: string;
        name: string;
        slug?: string;
        country_id: string;
        countries?: {
            id: string;
            name: string;
            iso_code?: string;
        };
    };
}

export interface Country {
    id: string;
    name: string;
    iso_code: string;
    continent?: string;
}

export interface City {
    id: string;
    name: string;
    slug: string;
    country_id: string;
    countries?: Country;
}

export interface VenueFormData {
    name: string;
    slug: string;
    location: string;
    capacity: number;
    website: string;
    city_id: string;
    country: string;
}
