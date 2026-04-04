export interface WrappedData {
  year: number;
  generatedAt: string;

  // Slide 2: Attendance
  totalConcerts: number;
  totalFestivals: number;
  estimatedHours: number;

  // Slide 3: Top Artist
  topArtistByConcerts: {
    name: string;
    photoUrl: string | null;
    concertCount: number;
    spotifyRank: number | null;
  } | null;

  // Slide 4: Cities/Venues
  citiesVisited: Array<{ name: string; country: string; concertCount: number }>;
  venuesVisited: Array<{ name: string; city: string; concertCount: number }>;
  uniqueCitiesCount: number;
  uniqueVenuesCount: number;

  // Slide 5: Top Genre
  topGenre: string | null;
  genreBreakdown: Array<{ genre: string; count: number }>;

  // Slide 6: Missed Artists
  missedArtists: Array<{
    name: string;
    photoUrl: string | null;
    spotifyRank: number;
    concertTitle: string;
    concertDate: string;
    city: string;
  }>;

  // Slide 7: Fun Facts
  firstConcert: { title: string; date: string; artist: string } | null;
  lastConcert: { title: string; date: string; artist: string } | null;
  busiestMonth: { month: string; count: number } | null;

  // Slide 8: Summary
  totalArtistsSeen: number;

  // Spotify data
  spotifyConnected: boolean;
  spotifyTopArtists: Array<{ name: string; imageUrl: string | null; genres: string[] }>;
  spotifyTopTracks: Array<{ name: string; artist: string; albumImage: string | null }>;

  // Badges earned
  badgesEarned: Array<{ name: string; icon: string; description: string }>;
}

export type WrappedSlideType =
  | 'intro'
  | 'attendance'
  | 'top-artist'
  | 'cities'
  | 'genre'
  | 'missed'
  | 'fun-facts'
  | 'summary';

export interface SpotifyConnection {
  connected: boolean;
  displayName: string | null;
}
