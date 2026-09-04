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
import { useSetlistConcert, useSetlistSongs, useContributeToSetlist, useSpotifyTrackImages } from '@/hooks/queries';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getConcertImage } from '@/lib/concertImage';

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
  const { data: trackImages = {} } = useSpotifyTrackImages(songs.map((s) => s.spotify_track_id));
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
      <div className="dark font-fira min-h-screen bg-noche text-texto">
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
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />
        <main className="container mx-auto px-4 py-6 pt-28">
          <div className="text-center py-10">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] mb-6">Setlist no encontrado</h2>
            <Link to="/setlists" className="btn-nocturno-secundario">
              Ver todos los setlists
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    /* "Evolución Nocturna": la página vive sobre la noche, como la home */
    <div className="dark font-fira min-h-screen bg-noche text-texto">
      <SEO
        title={`Setlist ${concert.artist?.name || ''} - ${concert.venue?.name || ''}, ${concert.venue?.location || ''} ${concert.date ? new Date(concert.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} | Lista de Canciones`}
        description={`Lista completa de canciones del concierto de ${concert.artist?.name || 'artista'} en ${concert.venue?.name || 'venue'}, ${concert.venue?.location || 'ciudad'} el ${concert.date ? new Date(concert.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : 'fecha'}. ${songs.length} canciones interpretadas. Setlist oficial y contribuciones de la comunidad.`}
        keywords={`setlist ${concert.artist?.name || ''}, setlist ${concert.artist?.name || ''} ${concert.venue?.location || ''}, ${concert.artist?.name || ''} ${concert.date ? new Date(concert.date).getFullYear() : ''}, lista de canciones ${concert.artist?.name || ''}, ${concert.artist?.name || ''} live, ${concert.artist?.name || ''} tour, setlist ${concert.venue?.name || ''}, canciones ${concert.title}`}
        type="article"
        image={getConcertImage(concert, '') || undefined}
        url={`/setlist/${artistSlug}/${concertSlug}/${city}/${date}`}
      />
      <Header />

      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Concert Header */}
          <div className="mb-6">
            {concert.artist?.photo_url && (
              <div className="aspect-video mb-4 rounded-[20px] overflow-hidden bg-superficie-2 ring-1 ring-linea">
                <img
                  src={concert.artist.photo_url}
                  alt={concert.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="font-display uppercase text-3xl md:text-4xl font-black tracking-[0.01em] leading-[0.95] mb-3">{concert.title}</h1>

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

            <span className="inline-flex items-center rounded-full border border-verde/30 bg-superficie px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-verde">
              {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
            </span>
          </div>

          {/* Social Share */}
          <div className="mb-5">
            <SocialShare
              url={window.location.href}
              title={`Setlist: ${concert.title}`}
            />
          </div>

          {/* Setlist */}
          <Card className="mb-6 rounded-[20px] border-linea bg-superficie">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Setlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {songs.map((song) => {
                  const albumImage = song.spotify_track_id ? trackImages[song.spotify_track_id] : undefined;
                  return (
                  <div key={song.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-superficie-2 transition-colors">
                    <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-superficie-2 flex items-center justify-center">
                      {albumImage ? (
                        <img
                          src={albumImage}
                          alt={song.song_name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                        {song.song_name}
                        {song.is_official ? (
                          <Badge variant="secondary" className="bg-verde/15 text-verde border border-verde/30 text-[10px] px-1.5 py-0">
                            Oficial
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-periwinkle/15 text-periwinkle border border-periwinkle/30 text-[10px] px-1.5 py-0">
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
                  );
                })}
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
            <Card className="rounded-[20px] border-linea bg-superficie">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contribuir al Setlist</CardTitle>
              </CardHeader>
              <CardContent>
                {!showContributeForm ? (
                  <Button size="sm" onClick={() => setShowContributeForm(true)} className="rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95">
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
                        className="h-9 text-sm rounded-full bg-superficie border-linea focus-visible:ring-periwinkle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="artist_name" className="text-sm">Artista (opcional)</Label>
                      <Input
                        id="artist_name"
                        value={formData.artist_name}
                        onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                        className="h-9 text-sm rounded-full bg-superficie border-linea focus-visible:ring-periwinkle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-sm">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="text-sm rounded-2xl bg-superficie border-linea focus-visible:ring-periwinkle"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={contributeMutation.isPending} className="rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95">
                        {contributeMutation.isPending ? 'Enviando...' : 'Enviar Contribución'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowContributeForm(false)}
                        className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[20px] border-linea bg-superficie">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Inicia sesión para contribuir canciones al setlist
                  </p>
                  <Button size="sm" asChild className="rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95">
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
