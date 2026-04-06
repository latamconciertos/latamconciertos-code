import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotifyChartCard } from "@/components/SpotifyChartCard";
import type { ChartTrack, ChartArtist } from "@/types/spotify";
import { LATIN_AMERICAN_COUNTRIES } from "@/types/spotify";
import { Music2, TrendingUp } from "lucide-react";

export const NewHomeSpotifyCharts = () => {
    const [selectedCountry, setSelectedCountry] = useState(LATIN_AMERICAN_COUNTRIES[0]);
    const [tracks, setTracks] = useState<ChartTrack[]>([]);
    const [artists, setArtists] = useState<ChartArtist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCharts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { supabase } = await import('@/integrations/supabase/client');

                const [{ data: tracksData, error: tErr }, { data: artistsData, error: aErr }] = await Promise.all([
                    supabase.from('spotify_chart_tracks').select('*').eq('country_code', selectedCountry.code).order('position'),
                    supabase.from('spotify_chart_artists').select('*').eq('country_code', selectedCountry.code).order('position'),
                ]);

                if (tErr) throw tErr;
                if (aErr) throw aErr;
                if (!tracksData?.length) throw new Error('No hay datos disponibles');

                setTracks((tracksData as any[]).map(t => ({
                    id: t.track_id, name: t.track_name,
                    artists: t.artist_names.split(', ').map((n: string) => ({ name: n })),
                    album: { name: t.album_name, images: [{ url: t.album_image_url || '' }] },
                    external_urls: { spotify: t.spotify_url },
                    duration_ms: t.duration_ms || 0, position: t.position, popularity: t.popularity,
                })));

                setArtists((artistsData || []).map(a => ({
                    id: a.artist_id, name: a.artist_name,
                    images: [{ url: a.artist_image_url || '', height: 640, width: 640 }],
                    position: a.position, popularity: a.popularity || 0,
                    genres: a.genres?.split(', '), external_urls: { spotify: a.spotify_url },
                })));
            } catch (err) {
                console.error('Error fetching charts:', err);
                setError('No hay datos disponibles.');
            } finally {
                setLoading(false);
            }
        };
        fetchCharts();
    }, [selectedCountry]);

    return (
        <section className="py-10 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col items-center sm:items-start sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Top 10 en {selectedCountry.name} {selectedCountry.flag}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Lo más escuchado en Spotify
                        </p>
                    </div>
                    <Select
                        value={selectedCountry.code}
                        onValueChange={code => {
                            const c = LATIN_AMERICAN_COUNTRIES.find(x => x.code === code);
                            if (c) setSelectedCountry(c);
                        }}
                    >
                        <SelectTrigger className="w-52 h-9 text-sm">
                            <SelectValue>
                                <span className="flex items-center gap-2">
                                    <span>{selectedCountry.flag}</span>
                                    <span>{selectedCountry.name}</span>
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {LATIN_AMERICAN_COUNTRIES.map(c => (
                                <SelectItem key={c.code} value={c.code}>
                                    <span className="flex items-center gap-2">
                                        <span>{c.flag}</span>
                                        <span>{c.name}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="tracks" className="w-full">
                    <div className="flex justify-center sm:justify-start mb-6">
                    <TabsList className="w-fit h-9 p-0.5">
                        <TabsTrigger value="tracks" className="text-xs sm:text-sm gap-1.5 px-4">
                            <Music2 className="w-3.5 h-3.5" />
                            Canciones
                        </TabsTrigger>
                        <TabsTrigger value="artists" className="text-xs sm:text-sm gap-1.5 px-4">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Artistas
                        </TabsTrigger>
                    </TabsList>
                    </div>

                    {loading && (
                        <div className="flex gap-4 overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px]">
                                    <Skeleton className="aspect-square rounded-xl mb-2.5" />
                                    <Skeleton className="h-4 w-3/4 mb-1" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-12">
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <TabsContent value="tracks" className="mt-0">
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {tracks.slice(0, 10).map((track) => (
                                        <SpotifyChartCard key={track.id} item={track} type="track" />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="artists" className="mt-0">
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {artists.slice(0, 10).map((artist) => (
                                        <SpotifyChartCard key={artist.id} item={artist} type="artist" />
                                    ))}
                                </div>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
        </section>
    );
};
