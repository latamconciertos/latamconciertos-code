import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Palette, Music, Search } from 'lucide-react';
import { spotifyService, SpotifyTrack } from '@/lib/spotify';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Song {
  id: string;
  song_name: string;
  artist_name: string | null;
  duration_seconds: number;
  position: number;
}

interface FanProjectSongsManagerProps {
  projectId: string;
  onEditSequence: (songId: string, songName: string) => void;
}

export const FanProjectSongsManager = ({ projectId, onEditSequence }: FanProjectSongsManagerProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    song_name: '',
    artist_name: '',
    duration_minutes: '',
    duration_seconds: '',
  });

  const [spotifySearch, setSpotifySearch] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);

  useEffect(() => {
    loadSongs();
  }, [projectId]);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_project_songs')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('position');

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las canciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSeconds = 
      (parseInt(formData.duration_minutes) || 0) * 60 + 
      (parseInt(formData.duration_seconds) || 0);

    if (totalSeconds <= 0) {
      toast({
        title: 'Error',
        description: 'La duración debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSong) {
        const { error } = await supabase
          .from('fan_project_songs')
          .update({
            song_name: formData.song_name,
            artist_name: formData.artist_name || null,
            duration_seconds: totalSeconds,
          })
          .eq('id', editingSong.id);

        if (error) throw error;

        toast({
          title: 'Canción actualizada',
          description: 'La canción ha sido actualizada exitosamente',
        });
      } else {
        const maxPosition = songs.length > 0 
          ? Math.max(...songs.map(s => s.position))
          : -1;

        const { error } = await supabase
          .from('fan_project_songs')
          .insert({
            fan_project_id: projectId,
            song_name: formData.song_name,
            artist_name: formData.artist_name || null,
            duration_seconds: totalSeconds,
            position: maxPosition + 1,
          });

        if (error) throw error;

        toast({
          title: 'Canción agregada',
          description: 'La canción ha sido agregada exitosamente',
        });
      }

      setShowDialog(false);
      setEditingSong(null);
      resetForm();
      loadSongs();
    } catch (error: any) {
      console.error('Error saving song:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la canción',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    const minutes = Math.floor(song.duration_seconds / 60);
    const seconds = song.duration_seconds % 60;
    setFormData({
      song_name: song.song_name,
      artist_name: song.artist_name || '',
      duration_minutes: minutes.toString(),
      duration_seconds: seconds.toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta canción?')) return;

    try {
      const { error } = await supabase
        .from('fan_project_songs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Canción eliminada',
        description: 'La canción ha sido eliminada exitosamente',
      });

      loadSongs();
    } catch (error: any) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la canción',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      song_name: '',
      artist_name: '',
      duration_minutes: '',
      duration_seconds: '',
    });
    setSpotifySearch('');
    setSpotifyResults([]);
  };

  const handleSpotifySearch = async () => {
    if (!spotifySearch.trim()) return;

    setSearchingSpotify(true);
    try {
      const results = await spotifyService.searchTrack(spotifySearch);
      setSpotifyResults(results);
      
      if (results.length === 0) {
        toast({
          title: 'No se encontraron resultados',
          description: 'Intenta con otro término de búsqueda',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error searching Spotify:', error);
      toast({
        title: 'Error al buscar en Spotify',
        description: error.message || 'No se pudo realizar la búsqueda',
        variant: 'destructive',
      });
    } finally {
      setSearchingSpotify(false);
    }
  };

  const handleSelectSpotifyTrack = (track: SpotifyTrack) => {
    const durationSeconds = Math.floor(track.duration_ms / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    setFormData({
      song_name: track.name,
      artist_name: track.artists.map(a => a.name).join(', '),
      duration_minutes: minutes.toString(),
      duration_seconds: seconds.toString(),
    });

    setSpotifyResults([]);
    setSpotifySearch('');
    
    toast({
      title: 'Canción cargada',
      description: `${track.name} - ${track.artists[0].name}`,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando canciones...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Canciones del Proyecto</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega las canciones y configura las secuencias de colores
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingSong(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Canción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSong ? 'Editar Canción' : 'Nueva Canción'}
                </DialogTitle>
                <DialogDescription>
                  Agrega una canción al proyecto de luces
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Spotify Search Section */}
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="spotify_search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar en Spotify
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="spotify_search"
                      value={spotifySearch}
                      onChange={(e) => setSpotifySearch(e.target.value)}
                      placeholder="Busca una canción en Spotify..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSpotifySearch();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSpotifySearch}
                      disabled={searchingSpotify || !spotifySearch.trim()}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {spotifyResults.length > 0 && (
                    <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                      <div className="p-2 space-y-1">
                        {spotifyResults.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => handleSelectSpotifyTrack(track)}
                            className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {track.album.images[0] && (
                                <img
                                  src={track.album.images[0].url}
                                  alt={track.album.name}
                                  className="w-10 h-10 rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {track.artists.map(a => a.name).join(', ')}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="song_name">Nombre de la Canción</Label>
                  <Input
                    id="song_name"
                    value={formData.song_name}
                    onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                    placeholder="Ej: Hype Boy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist_name">Artista (opcional)</Label>
                  <Input
                    id="artist_name"
                    value={formData.artist_name}
                    onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                    placeholder="Ej: NewJeans"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duración</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        placeholder="Minutos"
                        required
                      />
                    </div>
                    <span className="flex items-center">:</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={formData.duration_seconds}
                        onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                        placeholder="Segundos"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Duración total de la secuencia de luces
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSong ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay canciones en este proyecto</p>
            <p className="text-sm mt-2">
              Agrega canciones para configurar las secuencias de luces
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{song.song_name}</p>
                    {song.artist_name && (
                      <p className="text-sm text-muted-foreground">{song.artist_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Duración: {formatDuration(song.duration_seconds)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onEditSequence(song.id, song.song_name)}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Configurar Colores
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(song)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(song.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
