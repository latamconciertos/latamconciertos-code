export interface Artist {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    photo_url: string | null;
    social_links: Record<string, string> | null;
    created_at: string;
}

export interface ArtistFormData {
    name: string;
    slug: string;
    bio: string;
    photo_url: string;
    social_links: Record<string, string>;
}
