import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, GripVertical, Music, Search, ChevronUp, ChevronDown, ExternalLink, Download, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { spotifyService, SpotifyTrack } from '@/lib/spotify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  artistName?: string;
}

// ── Types for setlist.fm import ────────────────────────────────────────────────

type SpotifyConfidence = 'exact' | 'partial' | 'not_found';

interface EnrichedSong {
  position: number;
  setlistfm_name: string;
  notes: string | null;
  is_tape: boolean;
  song_name: string;
  artist_name: string | null;
  spotify_track_id: string | null;
  spotify_url: string | null;
  duration_seconds: number | null;
  spotify_confidence: SpotifyConfidence;
}

interface ImportStats {
  total: number;
  exact: number;
  partial: number;
  not_found: number;
}

type ImportPhase = 'idle' | 'loading' | 'preview' | 'importing';

// ── Confidence badge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: SpotifyConfidence }) {
  if (confidence === 'exact') {
    return (
      <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
        <CheckCircle2 className="w-3 h-3" /> Exacto
      </Badge>
    );
  }
  if (confidence === 'partial') {
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
        <AlertCircle className="w-3 h-3" /> Parcial
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 bg-red-500/15 text-red-400 border-red-500/30 text-xs">
      <XCircle className="w-3 h-3" /> No encontrado
    </Badge>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const SetlistManager = ({ concertId, concertTitle, artistName }: SetlistManagerProps) => {
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

  // ── setlist.fm import state ──────────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importPhase, setImportPhase] = useState<ImportPhase>('idle');
  const [importSongs, setImportSongs] = useState<EnrichedSong[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importMeta, setImportMeta] = useState<{ setlist_id: string; source_url: string } | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());

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
      toast({ title: 'Error', description: 'No se pudo cargar el setlist', variant: 'destructive' });
    } else {
      setSongs(data || []);
    }
  };

  // ── Spotify manual search ────────────────────────────────────────────────────

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

  // ── Manual add song ──────────────────────────────────────────────────────────

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
    const { error } = await supabase.from('setlist_songs').insert([songData]);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo agregar la canción', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Canción agregada al setlist' });
      resetForm();
      fetchSetlist();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta canción?')) return;
    const { error } = await supabase.from('setlist_songs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la canción', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Canción eliminada del setlist' });
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
    setFormData({ song_name: '', artist_name: '', duration_seconds: '', notes: '', spotify_track_id: '', spotify_url: '' });
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

  // ── setlist.fm import ────────────────────────────────────────────────────────

  const handleImportSearch = async () => {
    if (!importUrl.trim()) return;
    setImportPhase('loading');
    setImportSongs([]);
    setImportStats(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-setlist', {
        body: { url: importUrl.trim(), artist_name: artistName },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Error desconocido del servidor');

      const { songs: enriched, stats, setlist_id, source_url } = data.data;

      setImportSongs(enriched);
      setImportStats(stats);
      setImportMeta({ setlist_id, source_url });

      // Pre-select exact + partial by default
      const preSelected = new Set<number>(
        (enriched as EnrichedSong[])
          .filter(s => s.spotify_confidence !== 'not_found')
          .map(s => s.position),
      );
      setSelectedSongs(preSelected);
      setImportPhase('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al importar';
      toast({ title: 'Error al importar setlist', description: msg, variant: 'destructive' });
      setImportPhase('idle');
    }
  };

  const toggleSongSelection = (position: number) => {
    setSelectedSongs(prev => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSongs.size === importSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(importSongs.map(s => s.position)));
    }
  };

  const handleImportConfirm = async () => {
    const toImport = importSongs.filter(s => selectedSongs.has(s.position));
    if (!toImport.length) return;

    setImportPhase('importing');

    try {
      // If songs already exist, confirm replacement
      if (songs.length > 0) {
        const confirmed = confirm(
          `Este concierto ya tiene ${songs.length} canciones. ¿Deseas reemplazarlas con las ${toImport.length} importadas?`,
        );
        if (!confirmed) {
          setImportPhase('preview');
          return;
        }
        await supabase.from('setlist_songs').delete().eq('concert_id', concertId);
      }

      const insertData = toImport.map((song, idx) => ({
        concert_id: concertId,
        song_name: song.song_name,
        artist_name: song.artist_name,
        position: idx + 1,
        duration_seconds: song.duration_seconds,
        notes: song.notes,
        spotify_track_id: song.spotify_track_id,
        spotify_url: song.spotify_url,
        status: 'approved',
        is_official: true,
        setlistfm_id: importMeta?.setlist_id ?? null,
        setlistfm_song_name: song.setlistfm_name,
      }));

      const { error } = await supabase.from('setlist_songs').insert(insertData);
      if (error) throw error;

      toast({
        title: '✅ Setlist importado',
        description: `${toImport.length} canciones guardadas correctamente`,
      });

      setShowImport(false);
      setImportPhase('idle');
      setImportUrl('');
      setImportSongs([]);
      setSelectedSongs(new Set());
      fetchSetlist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast({ title: 'Error al guardar', description: msg, variant: 'destructive' });
      setImportPhase('preview');
    }
  };

  const closeImportDialog = () => {
    if (importPhase === 'importing') return;
    setShowImport(false);
    setImportPhase('idle');
    setImportUrl('');
    setImportSongs([]);
    setSelectedSongs(new Set());
    setImportStats(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Music className="w-5 h-5" />
            Setlist — {concertTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowImport(true)}
            size="sm"
            variant="outline"
            className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400"
          >
            <Download className="w-4 h-4 mr-2" />
            Importar de setlist.fm
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Canción
          </Button>
        </div>
      </div>

      {/* Manual add form */}
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
                      <Music className="w-4 h-4" /> Ver en Spotify <ExternalLink className="w-3 h-3" />
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
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Song list */}
      <div className="space-y-2">
        {songs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No hay canciones en el setlist</p>
              <p className="text-sm opacity-70">Importa desde setlist.fm o agrega manualmente</p>
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
                        {song.artist_name && <span>{song.artist_name}</span>}
                        <span>{formatDuration(song.duration_seconds)}</span>
                      </div>
                      {song.notes && <p className="text-sm text-muted-foreground mt-1">{song.notes}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(song.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Spotify manual search dialog ──────────────────────────────────── */}
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
                        <img src={track.album.images[0].url} alt={track.album.name} className="w-12 h-12 rounded" />
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

      {/* ── setlist.fm Import Dialog ──────────────────────────────────────── */}
      <Dialog open={showImport} onOpenChange={(open) => { if (!open) closeImportDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400" />
              Importar Setlist desde setlist.fm
            </DialogTitle>
            <DialogDescription>
              Pega la URL del setlist en setlist.fm. Las canciones se validarán automáticamente en Spotify y se guardarán con el nombre oficial.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* URL input — always visible */}
            <div className="flex gap-2">
              <Input
                placeholder="https://www.setlist.fm/setlist/artista/2026/venue-6b46469e.html"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && importPhase === 'idle' && handleImportSearch()}
                disabled={importPhase === 'loading' || importPhase === 'importing'}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleImportSearch}
                disabled={importPhase === 'loading' || importPhase === 'importing' || !importUrl.trim()}
                variant={importPhase === 'preview' ? 'outline' : 'default'}
              >
                {importPhase === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Loading state */}
            {importPhase === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                <div className="text-center">
                  <p className="font-medium">Obteniendo canciones de setlist.fm...</p>
                  <p className="text-sm mt-1 opacity-70">Validando cada canción en Spotify automáticamente</p>
                </div>
              </div>
            )}

            {/* Preview */}
            {importPhase === 'preview' && importStats && (
              <>
                {/* Stats bar */}
                <div className="flex gap-3 flex-wrap items-center">
                  <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {importStats.exact} exactas
                  </Badge>
                  <Badge className="gap-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5" /> {importStats.partial} parciales
                  </Badge>
                  <Badge className="gap-1.5 bg-red-500/15 text-red-400 border-red-500/30">
                    <XCircle className="w-3.5 h-3.5" /> {importStats.not_found} no encontradas
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {selectedSongs.size} / {importSongs.length} seleccionadas
                  </span>
                </div>

                {/* Select all */}
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Checkbox
                    id="select-all"
                    checked={selectedSongs.size === importSongs.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                    Seleccionar todas
                  </Label>
                </div>

                {/* Song list */}
                <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
                  <div className="space-y-1.5 pr-2">
                    {importSongs.map((song) => (
                      <div
                        key={song.position}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedSongs.has(song.position)
                          ? 'border-border bg-muted/30'
                          : 'border-transparent bg-muted/10 opacity-50'
                          }`}
                        onClick={() => toggleSongSelection(song.position)}
                      >
                        <Checkbox
                          checked={selectedSongs.has(song.position)}
                          onCheckedChange={() => toggleSongSelection(song.position)}
                          className="mt-0.5 shrink-0"
                        />
                        <span className="text-muted-foreground text-sm font-mono w-6 text-right shrink-0 mt-0.5">
                          {song.position}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{song.song_name}</span>
                            <ConfidenceBadge confidence={song.spotify_confidence} />
                            {song.spotify_url && (
                              <a
                                href={song.spotify_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-500 hover:text-green-400 shrink-0"
                                title="Abrir en Spotify"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {/* Show original name if different from Spotify */}
                          {song.spotify_confidence !== 'exact' && song.setlistfm_name !== song.song_name && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              setlist.fm: <span className="font-mono opacity-70">{song.setlistfm_name}</span>
                            </p>
                          )}
                          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {song.artist_name && <span>{song.artist_name}</span>}
                            {song.duration_seconds && <span>{formatDuration(song.duration_seconds)}</span>}
                            {song.notes && <span className="italic">{song.notes}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import button */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <Button variant="ghost" onClick={closeImportDialog}>Cancelar</Button>
                  <Button
                    onClick={handleImportConfirm}
                    disabled={selectedSongs.size === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Importar {selectedSongs.size} {selectedSongs.size === 1 ? 'canción' : 'canciones'}
                  </Button>
                </div>
              </>
            )}

            {/* Importing spinner */}
            {importPhase === 'importing' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <p>Guardando canciones en la base de datos...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};