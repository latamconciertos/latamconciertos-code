import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, GripVertical, Music, Search, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { spotifyService, SpotifyTrack } from '@/lib/spotify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SetlistSong {
  id: string;
  concert_id: string;
  song_name: string;
  artist_name: string | null;
  position: number;
  duration_seconds: number | null;
  notes: string | null;
  spotify_track_id: string | null;
  spotify_url: string | null;
}

interface SetlistManagerProps {
  concertId: string;
  concertTitle: string;
}

export const SetlistManager = ({ concertId, concertTitle }: SetlistManagerProps) => {
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    song_name: '',
    artist_name: '',
    duration_seconds: '',
    notes: '',
    spotify_track_id: '',
    spotify_url: '',
  });

  useEffect(() => {
    fetchSetlist();
  }, [concertId]);

  const fetchSetlist = async () => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .select('*')
      .eq('concert_id', concertId)
      .order('position');

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el setlist",
        variant: "destructive",
      });
    } else {
      setSongs(data || []);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await spotifyService.searchTrack(searchQuery, formData.artist_name);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    setFormData({
      ...formData,
      song_name: track.name,
      artist_name: track.artists[0]?.name || '',
      duration_seconds: Math.floor(track.duration_ms / 1000).toString(),
      spotify_track_id: track.id,
      spotify_url: track.external_urls.spotify,
    });
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newPosition = songs.length > 0 ? Math.max(...songs.map(s => s.position)) + 1 : 1;

    const songData = {
      concert_id: concertId,
      song_name: formData.song_name,
      artist_name: formData.artist_name || null,
      position: newPosition,
      duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
      notes: formData.notes || null,
      spotify_track_id: formData.spotify_track_id || null,
      spotify_url: formData.spotify_url || null,
    };

    const { error } = await supabase
      .from('setlist_songs')
      .insert([songData]);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la canción",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Canción agregada al setlist",
      });
      resetForm();
      fetchSetlist();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta canción?')) return;

    const { error } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la canción",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Canción eliminada del setlist",
      });
      fetchSetlist();
    }
  };

  const handleMoveUp = async (song: SetlistSong, index: number) => {
    if (index === 0) return;
    
    const prevSong = songs[index - 1];
    
    await supabase.from('setlist_songs').update({ position: prevSong.position }).eq('id', song.id);
    await supabase.from('setlist_songs').update({ position: song.position }).eq('id', prevSong.id);
    
    fetchSetlist();
  };

  const handleMoveDown = async (song: SetlistSong, index: number) => {
    if (index === songs.length - 1) return;
    
    const nextSong = songs[index + 1];
    
    await supabase.from('setlist_songs').update({ position: nextSong.position }).eq('id', song.id);
    await supabase.from('setlist_songs').update({ position: song.position }).eq('id', nextSong.id);
    
    fetchSetlist();
  };

  const resetForm = () => {
    setFormData({
      song_name: '',
      artist_name: '',
      duration_seconds: '',
      notes: '',
      spotify_track_id: '',
      spotify_url: '',
    });
    setShowForm(false);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Music className="w-5 h-5" />
            Setlist - {concertTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Canción
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nueva Canción</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowSearch(true)}>
                <Search className="w-4 h-4 mr-2" />
                Buscar en Spotify
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="song_name">Nombre de la Canción *</Label>
                  <Input
                    id="song_name"
                    value={formData.song_name}
                    onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="artist_name">Artista</Label>
                  <Input
                    id="artist_name"
                    value={formData.artist_name}
                    onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_seconds">Duración (segundos)</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  />
                </div>
                {formData.spotify_url && (
                  <div className="flex items-end">
                    <a 
                      href={formData.spotify_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Music className="w-4 h-4" />
                      Ver en Spotify
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Agregar</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {songs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay canciones en el setlist</p>
            </CardContent>
          </Card>
        ) : (
          songs.map((song, index) => (
            <Card key={song.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveUp(song, index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveDown(song, index)}
                        disabled={index === songs.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                      <span className="font-bold text-lg">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{song.song_name}</h4>
                        {song.spotify_url && (
                          <a 
                            href={song.spotify_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <Music className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {song.artist_name && <span>Artista: {song.artist_name}</span>}
                        <span>Duración: {formatDuration(song.duration_seconds)}</span>
                      </div>
                      {song.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{song.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(song.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buscar Canción en Spotify</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar canción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {isSearching && <p className="text-center text-muted-foreground">Buscando...</p>}
            <div className="space-y-2">
              {searchResults.map((track) => (
                <Card 
                  key={track.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectTrack(track)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {track.album.images[0] && (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.album.name}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{track.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};