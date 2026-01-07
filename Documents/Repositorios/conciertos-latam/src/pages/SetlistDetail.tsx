import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { SocialShare } from '@/components/SocialShare';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Music, Calendar, MapPin, Plus, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSetlistConcert, useSetlistSongs, useContributeToSetlist } from '@/hooks/queries';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SetlistDetail() {
  const { artistSlug, concertSlug, city, date } = useParams();
  const [user, setUser] = useState<any>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [formData, setFormData] = useState({
    song_name: '',
    artist_name: '',
    notes: ''
  });

  const { data: concert, isLoading: loadingConcert } = useSetlistConcert(concertSlug, artistSlug, city, date);
  const { data: songs = [], isLoading: loadingSongs } = useSetlistSongs(concert?.id);
  const contributeMutation = useContributeToSetlist();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Debes iniciar sesión para contribuir al setlist');
      return;
    }

    if (!formData.song_name.trim()) {
      toast.error('El nombre de la canción es obligatorio');
      return;
    }

    if (!concert) return;

    const maxPosition = songs.length > 0 ? Math.max(...songs.map(s => s.position)) : 0;

    contributeMutation.mutate({
      concert_id: concert.id,
      song_name: formData.song_name,
      artist_name: formData.artist_name || null,
      notes: formData.notes || null,
      user_id: user.id,
      position: maxPosition + 1
    }, {
      onSuccess: () => {
        toast.success('¡Gracias por tu contribución! Tu canción será revisada por un administrador.');
        setFormData({ song_name: '', artist_name: '', notes: '' });
        setShowContributeForm(false);
      },
      onError: () => {
        toast.error('No se pudo agregar tu contribución');
      }
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loading = loadingConcert || loadingSongs;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <LoadingSpinner message="Cargando setlist..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-bold mb-3">Setlist no encontrado</h2>
            <Button size="sm" asChild>
              <Link to="/setlists">Ver todos los setlists</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const setlistData = {
    concertTitle: concert.title,
    artistName: concert.artist?.name,
    date: concert.date || undefined,
    concertImage: concert.image_url || undefined,
    songs: songs.map((song) => ({
      song_name: song.song_name,
      artist_name: song.artist_name || concert.artist?.name || undefined
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Setlist ${concert.artist?.name || ''} - ${concert.venue?.name || ''}, ${concert.venue?.location || ''} ${concert.date ? new Date(concert.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} | Lista de Canciones`}
        description={`Lista completa de canciones del concierto de ${concert.artist?.name || 'artista'} en ${concert.venue?.name || 'venue'}, ${concert.venue?.location || 'ciudad'} el ${concert.date ? new Date(concert.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : 'fecha'}. ${songs.length} canciones interpretadas. Setlist oficial y contribuciones de la comunidad.`}
        keywords={`setlist ${concert.artist?.name || ''}, setlist ${concert.artist?.name || ''} ${concert.venue?.location || ''}, ${concert.artist?.name || ''} ${concert.date ? new Date(concert.date).getFullYear() : ''}, lista de canciones ${concert.artist?.name || ''}, ${concert.artist?.name || ''} live, ${concert.artist?.name || ''} tour, setlist ${concert.venue?.name || ''}, canciones ${concert.title}`}
        type="article"
        image={concert.image_url || undefined}
        url={`/setlists/${artistSlug}/${concertSlug}/${city}/${date}`}
      />
      <Header />

      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Concert Header */}
          <div className="mb-6">
            {concert.image_url && (
              <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                <img
                  src={concert.image_url}
                  alt={concert.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold mb-3">{concert.title}</h1>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              {concert.artist && (
                <div className="flex items-center gap-1.5">
                  <Music className="w-4 h-4" />
                  <span>{concert.artist.name}</span>
                </div>
              )}
              {concert.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(concert.date).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {concert.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{concert.venue.name}</span>
                </div>
              )}
            </div>

            <Badge variant="secondary" className="text-xs">
              {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
            </Badge>
          </div>

          {/* Social Share */}
          <div className="mb-5">
            <SocialShare
              url={window.location.href}
              title={`Setlist: ${concert.title}`}
              setlistData={setlistData}
            />
          </div>

          {/* Setlist */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Setlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {songs.map((song) => (
                  <div key={song.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
                    <span className="font-mono text-xs text-muted-foreground w-6 flex-shrink-0 pt-0.5">
                      •
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                        {song.song_name}
                        {song.is_official ? (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 text-[10px] px-1.5 py-0">
                            Oficial
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 text-[10px] px-1.5 py-0">
                            Community
                          </Badge>
                        )}
                      </div>
                      {song.artist_name && (
                        <div className="text-xs text-muted-foreground">{song.artist_name}</div>
                      )}
                      {song.notes && (
                        <div className="text-xs text-muted-foreground italic mt-0.5">{song.notes}</div>
                      )}
                    </div>
                    {formatDuration(song.duration_seconds) && (
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDuration(song.duration_seconds)}
                      </div>
                    )}
                    {song.spotify_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        asChild
                      >
                        <a href={song.spotify_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {songs.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Este setlist aún no tiene canciones
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contribute Section */}
          {user ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contribuir al Setlist</CardTitle>
              </CardHeader>
              <CardContent>
                {!showContributeForm ? (
                  <Button size="sm" onClick={() => setShowContributeForm(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Agregar una canción
                  </Button>
                ) : (
                  <form onSubmit={handleContribute} className="space-y-3">
                    <div>
                      <Label htmlFor="song_name" className="text-sm">Nombre de la Canción *</Label>
                      <Input
                        id="song_name"
                        value={formData.song_name}
                        onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="artist_name" className="text-sm">Artista (opcional)</Label>
                      <Input
                        id="artist_name"
                        value={formData.artist_name}
                        onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-sm">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={contributeMutation.isPending}>
                        {contributeMutation.isPending ? 'Enviando...' : 'Enviar Contribución'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowContributeForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Inicia sesión para contribuir canciones al setlist
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/auth">Iniciar Sesión</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
