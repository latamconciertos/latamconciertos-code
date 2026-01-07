import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotifyChartCard } from "@/components/SpotifyChartCard";
import type { ChartTrack, ChartArtist } from "@/types/spotify";
import { LATIN_AMERICAN_COUNTRIES } from "@/types/spotify";
import { Music2, TrendingUp, ChevronRight } from "lucide-react";

export const NewHomeSpotifyCharts = () => {
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
                const { supabase } = await import('@/integrations/supabase/client');

                // Fetch tracks from database
                const { data: tracksData, error: tracksError } = await supabase
                    .from('spotify_chart_tracks')
                    .select('*')
                    .eq('country_code', selectedCountry.code)
                    .order('position');

                if (tracksError) throw tracksError;

                // Fetch artists from database
                const { data: artistsData, error: artistsError } = await supabase
                    .from('spotify_chart_artists')
                    .select('*')
                    .eq('country_code', selectedCountry.code)
                    .order('position');

                if (artistsError) throw artistsError;

                if (!tracksData || tracksData.length === 0) {
                    throw new Error('No hay datos disponibles para este país');
                }

                // Convert database tracks to ChartTrack format
                const chartTracks: ChartTrack[] = tracksData.map(track => ({
                    id: track.track_id,
                    name: track.track_name,
                    artists: track.artist_names.split(', ').map(name => ({ name })),
                    album: {
                        name: track.album_name,
                        images: [{ url: track.album_image_url || '' }]
                    },
                    external_urls: { spotify: track.spotify_url },
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
                    external_urls: { spotify: artist.spotify_url }
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

    return (
        <section className="py-8 md:py-12 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header - Modern Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira mb-4">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Top 10 LATAM
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-fira">
                        Top 10 Conciertos Latam
                    </h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">
                        Descubre las canciones y artistas más escuchados en {selectedCountry.name}
                    </p>

                    {/* Country Selector - Enhanced Design */}
                    <div className="flex justify-center">
                        <Select
                            value={selectedCountry.code}
                            onValueChange={code => {
                                const country = LATIN_AMERICAN_COUNTRIES.find(c => c.code === code);
                                if (country) setSelectedCountry(country);
                            }}
                        >
                            <SelectTrigger className="w-72 bg-card border-2 hover:border-primary transition-colors">
                                <SelectValue>
                                    <span className="flex items-center gap-3">
                                        <span className="text-2xl">{selectedCountry.flag}</span>
                                        <span className="font-semibold">{selectedCountry.name}</span>
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {LATIN_AMERICAN_COUNTRIES.map(country => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <span className="flex items-center gap-3">
                                            <span className="text-xl">{country.flag}</span>
                                            <span>{country.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                {/* Tabs - Modern Design */}
                <Tabs defaultValue="tracks" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-muted/50">
                        <TabsTrigger value="tracks" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Music2 className="w-4 h-4" />
                            <span className="font-semibold">Canciones</span>
                        </TabsTrigger>
                        <TabsTrigger value="artists" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-semibold">Artistas</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-56 w-[280px] rounded-2xl flex-shrink-0" />
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-destructive/10 rounded-2xl"
                        >
                            <p className="text-destructive text-lg font-semibold">{error}</p>
                        </motion.div>
                    )}

                    {/* Tracks Tab */}
                    {!loading && !error && (
                        <TabsContent value="tracks">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide justify-start"
                            >
                                {tracks.slice(0, showAllTracks ? 10 : 6).map((track, index) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <SpotifyChartCard item={track} type="track" />
                                    </motion.div>
                                ))}
                            </motion.div>
                            {tracks.length > 6 && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        onClick={() => setShowAllTracks(!showAllTracks)}
                                        variant="outline"
                                        className="gap-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                                    >
                                        {showAllTracks ? "Ver menos" : "Ver más"}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showAllTracks ? "rotate-90" : ""}`} />
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* Artists Tab */}
                    {!loading && !error && (
                        <TabsContent value="artists">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide justify-start"
                            >
                                {artists.slice(0, showAllArtists ? 10 : 6).map((artist, index) => (
                                    <motion.div
                                        key={artist.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <SpotifyChartCard item={artist} type="artist" />
                                    </motion.div>
                                ))}
                            </motion.div>
                            {artists.length > 6 && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        onClick={() => setShowAllArtists(!showAllArtists)}
                                        variant="outline"
                                        className="gap-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                                    >
                                        {showAllArtists ? "Ver menos" : "Ver más"}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showAllArtists ? "rotate-90" : ""}`} />
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </section>
    );
};
