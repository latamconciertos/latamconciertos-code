import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotifyChartCard } from "./SpotifyChartCard";
import type { ChartTrack, ChartArtist } from "@/types/spotify";
import { LATIN_AMERICAN_COUNTRIES } from "@/types/spotify";
import { Music2, TrendingUp, ChevronRight } from "lucide-react";
export const SpotifyCharts = () => {
  const [selectedCountry, setSelectedCountry] = useState(LATIN_AMERICAN_COUNTRIES[0]);
  const [tracks, setTracks] = useState<ChartTrack[]>([]);
  const [artists, setArtists] = useState<ChartArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Import supabase here to avoid circular dependencies
        const {
          supabase
        } = await import('@/integrations/supabase/client');

        // Fetch tracks from database
        const {
          data: tracksData,
          error: tracksError
        } = await supabase.from('spotify_chart_tracks').select('*').eq('country_code', selectedCountry.code).order('position');
        if (tracksError) throw tracksError;

        // Fetch artists from database
        const {
          data: artistsData,
          error: artistsError
        } = await supabase.from('spotify_chart_artists').select('*').eq('country_code', selectedCountry.code).order('position');
        if (artistsError) throw artistsError;
        if (!tracksData || tracksData.length === 0) {
          throw new Error('No hay datos disponibles para este país');
        }

        // Convert database tracks to ChartTrack format
        const chartTracks: ChartTrack[] = tracksData.map(track => ({
          id: track.track_id,
          name: track.track_name,
          artists: track.artist_names.split(', ').map(name => ({
            name
          })),
          album: {
            name: track.album_name,
            images: [{
              url: track.album_image_url || ''
            }]
          },
          external_urls: {
            spotify: track.spotify_url
          },
          duration_ms: track.duration_ms || 0,
          position: track.position,
          popularity: track.popularity
        }));
        setTracks(chartTracks);

        // Convert database artists to ChartArtist format
        const chartArtists: ChartArtist[] = (artistsData || []).map(artist => ({
          id: artist.artist_id,
          name: artist.artist_name,
          images: [{
            url: artist.artist_image_url || '',
            height: 640,
            width: 640
          }],
          position: artist.position,
          popularity: artist.popularity || 0,
          genres: artist.genres?.split(', '),
          external_urls: {
            spotify: artist.spotify_url
          }
        }));
        setArtists(chartArtists);

        // Reset show all states when country changes
        setShowAllTracks(false);
        setShowAllArtists(false);
      } catch (err) {
        console.error('Error fetching charts:', err);
        setError('No hay datos disponibles. El administrador debe actualizar los charts.');
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, [selectedCountry]);
  return <section className="py-8 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="section-title">Top 10 Conciertos Latam</h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-4">
            Descubre las canciones y artistas más escuchados en {selectedCountry.name}
          </p>

          {/* Country Selector */}
          <div className="flex justify-center">
            <Select value={selectedCountry.code} onValueChange={code => {
            const country = LATIN_AMERICAN_COUNTRIES.find(c => c.code === code);
            if (country) setSelectedCountry(country);
          }}>
              <SelectTrigger className="w-64 bg-card">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LATIN_AMERICAN_COUNTRIES.map(country => <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Canciones
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Artistas
            </TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {loading && <div className="flex gap-4 overflow-x-auto pb-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-48 w-[280px] rounded-xl flex-shrink-0" />)}
            </div>}

          {/* Error State */}
          {error && !loading && <div className="text-center py-12">
              <p className="text-destructive text-lg">{error}</p>
            </div>}

          {/* Tracks Tab */}
          {!loading && !error && <TabsContent value="tracks" className="animate-fade-in">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {tracks.slice(0, showAllTracks ? 10 : 5).map(track => <SpotifyChartCard key={track.id} item={track} type="track" />)}
              </div>
              {tracks.length > 5 && <div className="flex justify-center mt-6">
                  <Button onClick={() => setShowAllTracks(!showAllTracks)} variant="outline" className="gap-2">
                    {showAllTracks ? "Ver menos" : "Ver más"}
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAllTracks ? "rotate-90" : ""}`} />
                  </Button>
                </div>}
            </TabsContent>}

          {/* Artists Tab */}
          {!loading && !error && <TabsContent value="artists" className="animate-fade-in">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {artists.slice(0, showAllArtists ? 10 : 5).map(artist => <SpotifyChartCard key={artist.id} item={artist} type="artist" />)}
              </div>
              {artists.length > 5 && <div className="flex justify-center mt-6">
                  <Button onClick={() => setShowAllArtists(!showAllArtists)} variant="outline" className="gap-2">
                    {showAllArtists ? "Ver menos" : "Ver más"}
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAllArtists ? "rotate-90" : ""}`} />
                  </Button>
                </div>}
            </TabsContent>}
        </Tabs>

      </div>
    </section>;
};