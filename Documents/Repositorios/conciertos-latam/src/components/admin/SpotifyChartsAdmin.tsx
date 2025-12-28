import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music2, TrendingUp, RefreshCw, Plus, Trash2, Save, Search, GripVertical } from "lucide-react";
import { LATIN_AMERICAN_COUNTRIES } from "@/types/spotify";
import { spotifyService } from "@/lib/spotify";
import type { SpotifyTrack, SpotifyArtist } from "@/lib/spotify";

export const SpotifyChartsAdmin = () => {
  const [selectedCountry, setSelectedCountry] = useState(LATIN_AMERICAN_COUNTRIES[0]);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [tracksDraft, setTracksDraft] = useState<any[]>([]);
  const [artistsDraft, setArtistsDraft] = useState<any[]>([]);
  
  // Search states
  const [showTrackSearch, setShowTrackSearch] = useState(false);
  const [showArtistSearch, setShowArtistSearch] = useState(false);
  const [trackSearchQuery, setTrackSearchQuery] = useState("");
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [trackSearchResults, setTrackSearchResults] = useState<SpotifyTrack[]>([]);
  const [artistSearchResults, setArtistSearchResults] = useState<SpotifyArtist[]>([]);
  const [searching, setSearching] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadCharts();
  }, [selectedCountry]);

  const loadCharts = async () => {
    try {
      const { data: tracksData } = await supabase
        .from('spotify_chart_tracks')
        .select('*')
        .eq('country_code', selectedCountry.code)
        .order('position');

      const { data: artistsData } = await supabase
        .from('spotify_chart_artists')
        .select('*')
        .eq('country_code', selectedCountry.code)
        .order('position');

      setTracks(tracksData || []);
      setArtists(artistsData || []);
      setTracksDraft((tracksData || []).map(t => ({ ...t })));
      setArtistsDraft((artistsData || []).map(a => ({ ...a })));
    } catch (error) {
      console.error('Error loading charts:', error);
    }
  };

  const searchTracks = async () => {
    if (!trackSearchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await spotifyService.searchTrack(trackSearchQuery);
      setTrackSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const searchArtists = async () => {
    if (!artistSearchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await spotifyService.searchArtists(artistSearchQuery);
      setArtistSearchResults(results);
    } catch (error) {
      console.error('Error searching artists:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const addTrackFromSearch = (track: SpotifyTrack) => {
    const newTrack = {
      id: crypto.randomUUID(),
      country_code: selectedCountry.code,
      position: tracksDraft.length + 1,
      track_id: track.id,
      track_name: track.name,
      artist_names: track.artists.map(a => a.name).join(', '),
      album_name: track.album.name,
      album_image_url: track.album.images[0]?.url || '',
      spotify_url: track.external_urls.spotify,
      duration_ms: track.duration_ms,
      popularity: track.popularity,
    };
    
    setTracksDraft(prev => [...prev, newTrack]);
    setShowTrackSearch(false);
    setTrackSearchQuery("");
    setTrackSearchResults([]);
    
    toast({
      title: "Canción agregada",
      description: `${track.name} agregada en posición ${tracksDraft.length + 1}`,
    });
  };

  const addArtistFromSearch = (artist: SpotifyArtist) => {
    const newArtist = {
      id: crypto.randomUUID(),
      country_code: selectedCountry.code,
      position: artistsDraft.length + 1,
      artist_id: artist.id,
      artist_name: artist.name,
      artist_image_url: artist.images[0]?.url || '',
      spotify_url: artist.external_urls.spotify,
      popularity: artist.popularity,
      genres: artist.genres?.join(', ') || '',
    };
    
    setArtistsDraft(prev => [...prev, newArtist]);
    setShowArtistSearch(false);
    setArtistSearchQuery("");
    setArtistSearchResults([]);
    
    toast({
      title: "Artista agregado",
      description: `${artist.name} agregado en posición ${artistsDraft.length + 1}`,
    });
  };

  const removeTrack = (index: number) => {
    setTracksDraft(prev => prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, position: i + 1 })));
  };

  const removeArtist = (index: number) => {
    setArtistsDraft(prev => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, position: i + 1 })));
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tracksDraft.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTracks = [...tracksDraft];
    [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
    
    // Actualizar posiciones
    setTracksDraft(newTracks.map((t, i) => ({ ...t, position: i + 1 })));
  };

  const moveArtist = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === artistsDraft.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newArtists = [...artistsDraft];
    [newArtists[index], newArtists[newIndex]] = [newArtists[newIndex], newArtists[index]];
    
    // Actualizar posiciones
    setArtistsDraft(newArtists.map((a, i) => ({ ...a, position: i + 1 })));
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      // Borrar existentes
      await supabase.from('spotify_chart_tracks').delete().eq('country_code', selectedCountry.code);
      await supabase.from('spotify_chart_artists').delete().eq('country_code', selectedCountry.code);

      // Insertar tracks
      if (tracksDraft.length > 0) {
        const { error: tracksError } = await supabase.from('spotify_chart_tracks').insert(
          tracksDraft.map((t, i) => ({
            country_code: selectedCountry.code,
            position: i + 1,
            track_id: t.track_id,
            track_name: t.track_name,
            artist_names: t.artist_names,
            album_name: t.album_name,
            album_image_url: t.album_image_url || null,
            spotify_url: t.spotify_url,
            duration_ms: t.duration_ms ?? null,
            popularity: t.popularity ?? null,
          }))
        );
        
        if (tracksError) throw tracksError;
      }

      // Insertar artistas
      if (artistsDraft.length > 0) {
        const { error: artistsError } = await supabase.from('spotify_chart_artists').insert(
          artistsDraft.map((a, i) => ({
            country_code: selectedCountry.code,
            position: i + 1,
            artist_id: a.artist_id,
            artist_name: a.artist_name,
            artist_image_url: a.artist_image_url || null,
            spotify_url: a.spotify_url,
            popularity: a.popularity ?? null,
            genres: a.genres || null,
          }))
        );
        
        if (artistsError) throw artistsError;
      }

      toast({
        title: "¡Guardado!",
        description: `Charts de ${selectedCountry.name} actualizados exitosamente`,
      });
      
      setEditMode(false);
      await loadCharts();
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartsFromSpotify = async () => {
    setLoading(true);
    try {
      const topTracks = await spotifyService.getTopTracksByMarket(selectedCountry.market, 10);
      
      if (topTracks.length === 0) {
        toast({
          title: "Error",
          description: "No se pudieron obtener datos de Spotify",
          variant: "destructive",
        });
        return;
      }

      for (let i = 0; i < topTracks.length; i++) {
        const track = topTracks[i];
        await supabase
          .from('spotify_chart_tracks')
          .upsert({
            country_code: selectedCountry.code,
            position: i + 1,
            track_id: track.id,
            track_name: track.name,
            artist_names: track.artists.map((a: any) => a.name).join(', '),
            album_name: track.album.name,
            album_image_url: track.album.images[0]?.url,
            spotify_url: track.external_urls.spotify,
            duration_ms: track.duration_ms,
            popularity: track.popularity,
          }, {
            onConflict: 'country_code,position'
          });
      }

      const uniqueArtistIds = Array.from(
        new Set(topTracks.flatMap((track: any) => track.artists.map((a: any) => a.id)))
      ).slice(0, 10);

      const artistsData = await spotifyService.getArtistsByIds(uniqueArtistIds);

      for (let i = 0; i < artistsData.length; i++) {
        const artist = artistsData[i];
        await supabase
          .from('spotify_chart_artists')
          .upsert({
            country_code: selectedCountry.code,
            position: i + 1,
            artist_id: artist.id,
            artist_name: artist.name,
            artist_image_url: artist.images[0]?.url,
            spotify_url: artist.external_urls?.spotify || '',
            popularity: artist.popularity,
            genres: artist.genres?.join(', '),
          }, {
            onConflict: 'country_code,position'
          });
      }

      toast({
        title: "¡Actualizado!",
        description: `Charts de ${selectedCountry.name} actualizados desde Spotify`,
      });

      loadCharts();
    } catch (error) {
      console.error('Error updating charts:', error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar los charts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Charts Spotify</h1>
          <p className="text-muted-foreground mt-2">
            Busca y organiza los tops de canciones y artistas por país
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seleccionar País</CardTitle>
              <CardDescription>
                Elige un país para gestionar sus charts
              </CardDescription>
            </div>
            <Select
              value={selectedCountry.code}
              onValueChange={(code) => {
                const country = LATIN_AMERICAN_COUNTRIES.find(c => c.code === code);
                if (country) {
                  setSelectedCountry(country);
                  setEditMode(false);
                }
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LATIN_AMERICAN_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!editMode && (
              <Button
                onClick={updateChartsFromSpotify}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar desde Spotify
              </Button>
            )}
            
            <Button
              onClick={() => {
                if (editMode) {
                  loadCharts();
                }
                setEditMode(!editMode);
              }}
              variant={editMode ? "outline" : "default"}
              className="gap-2"
            >
              {editMode ? "Cancelar edición" : "Editar manualmente"}
            </Button>

            {editMode && (
              <Button 
                onClick={saveChanges} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Canciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5" />
                Top 10 Canciones
              </CardTitle>
              {editMode && (
                <Dialog open={showTrackSearch} onOpenChange={setShowTrackSearch}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Buscar canción
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Buscar canción en Spotify</DialogTitle>
                      <DialogDescription>
                        Busca canciones para agregar al top
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre de la canción o artista..."
                          value={trackSearchQuery}
                          onChange={(e) => setTrackSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                        />
                        <Button onClick={searchTracks} disabled={searching}>
                          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {trackSearchResults.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => addTrackFromSearch(track)}
                          >
                            {track.album.images[0] && (
                              <img
                                src={track.album.images[0].url}
                                alt={track.name}
                                className="w-12 h-12 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <Plus className="h-5 w-5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tracks.length === 0 && !editMode ? (
              <p className="text-muted-foreground text-center py-8">
                No hay datos. Actualiza o edita los charts para este país.
              </p>
            ) : (
              <div className="space-y-2">
                {(editMode ? tracksDraft : tracks).map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    {editMode && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveTrack(index, 'up')}
                          disabled={index === 0}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveTrack(index, 'down')}
                          disabled={index === tracksDraft.length - 1}
                        >
                          ▼
                        </Button>
                      </div>
                    )}
                    <div className="font-bold text-muted-foreground w-8">
                      #{track.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.track_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist_names}
                      </p>
                    </div>
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTrack(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Artistas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 10 Artistas
              </CardTitle>
              {editMode && (
                <Dialog open={showArtistSearch} onOpenChange={setShowArtistSearch}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Buscar artista
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Buscar artista en Spotify</DialogTitle>
                      <DialogDescription>
                        Busca artistas para agregar al top
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre del artista..."
                          value={artistSearchQuery}
                          onChange={(e) => setArtistSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchArtists()}
                        />
                        <Button onClick={searchArtists} disabled={searching}>
                          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {artistSearchResults.map((artist) => (
                          <div
                            key={artist.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => addArtistFromSearch(artist)}
                          >
                            {artist.images[0] && (
                              <img
                                src={artist.images[0].url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{artist.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {artist.genres?.slice(0, 3).join(', ') || 'Sin géneros'}
                              </p>
                            </div>
                            <Plus className="h-5 w-5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {artists.length === 0 && !editMode ? (
              <p className="text-muted-foreground text-center py-8">
                No hay datos. Actualiza o edita los charts para este país.
              </p>
            ) : (
              <div className="space-y-2">
                {(editMode ? artistsDraft : artists).map((artist, index) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    {editMode && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveArtist(index, 'up')}
                          disabled={index === 0}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveArtist(index, 'down')}
                          disabled={index === artistsDraft.length - 1}
                        >
                          ▼
                        </Button>
                      </div>
                    )}
                    <div className="font-bold text-muted-foreground w-8">
                      #{artist.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{artist.artist_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {artist.genres || 'Sin géneros'}
                      </p>
                    </div>
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArtist(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};