// CDN Sequence Types
export interface CDNColorBlock {
    start: number;
    end: number;
    color: string;
    strobeColor2?: string; // Second color for strobe effect
}

export interface CDNSongSequence {
    song_id: string;
    song_name: string;
    artist_name: string | null;
    duration_seconds: number;
    mode: 'fixed' | 'strobe';
    strobeSpeed?: number; // Speed in milliseconds for strobe effect
    sequence: CDNColorBlock[];
}

export interface CDNProjectSequences {
    project_id: string;
    project_name: string;
    section_id: string;
    section_name: string;
    concert_id: string;
    generated_at: string; // ISO timestamp
    version: string; // Semver for cache busting
    songs: CDNSongSequence[];
}

export interface CDNSequenceMetadata {
    project_id: string;
    sections: {
        section_id: string;
        section_name: string;
        url: string;
        size_bytes: number;
    }[];
    total_songs: number;
    generated_at: string;
}
