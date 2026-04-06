import { useParams, Link, useNavigate } from 'react-router-dom';
import { Music, Calendar, Newspaper, ExternalLink, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDisplayDate, formatInBogota } from '@/lib/timezone';
import {
  useArtistDetail,
  useArtistConcerts,
  useArtistNews,
  useArtistSpotifyTracks,
} from '@/hooks/queries/useArtistDetail';

const VERIFIED_BADGE = (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-label="Verificado">
    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" fill="hsl(var(--primary))" />
  </svg>
);

const SOCIAL_ICONS: Record<string, { svg: string; label: string; color: string }> = {
  spotify: {
    label: 'Spotify',
    color: 'text-[#1DB954]',
    svg: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  },
  instagram: {
    label: 'Instagram',
    color: 'text-[#E4405F]',
    svg: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  },
  twitter: {
    label: 'X',
    color: 'text-foreground',
    svg: '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  },
  youtube: {
    label: 'YouTube',
    color: 'text-[#FF0000]',
    svg: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  },
  facebook: {
    label: 'Facebook',
    color: 'text-[#1877F2]',
    svg: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  },
  tiktok: {
    label: 'TikTok',
    color: 'text-foreground',
    svg: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  },
};

const ArtistDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: artist, isLoading: artistLoading } = useArtistDetail(slug);
  const { data: concerts = [] } = useArtistConcerts(artist?.id);
  const { data: news = [] } = useArtistNews(artist?.id);
  const { data: topTracks = [] } = useArtistSpotifyTracks(artist?.name);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingSpinner message="Cargando artista..." />
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <Music className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-4">Artista no encontrado</h2>
          <Link to="/artists"><Button>Volver a artistas</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const heroImage = artist.photo_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": artist.name,
    "description": artist.bio,
    "image": artist.photo_url,
    "url": `https://www.conciertoslatam.app/artists/${artist.slug}`,
    "event": concerts.map(concert => ({
      "@type": "MusicEvent",
      "name": concert.title,
      "startDate": concert.date,
      "location": { "@type": "Place", "name": concert.venues?.name, "address": concert.venues?.location }
    }))
  };

  return (
    <>
      <SEO
        title={`${artist.name} | Conciertos y Música`}
        description={artist.bio || `Descubre todos los conciertos de ${artist.name} en América Latina. Fechas, entradas y música.`}
        keywords={`${artist.name}, conciertos, tour 2026, entradas, música`}
        image={artist.photo_url || undefined}
        url={`/artists/${artist.slug}`}
        type="music.song"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero - Mobile: full-width image, Desktop: side-by-side */}
        <div className="pt-20">
          {/* Background gradient bar */}
          <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <Breadcrumbs items={[
                { label: 'Artistas', href: '/artists' },
                { label: artist.name }
              ]} />

              <div className="mt-6 flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-end">
                {/* Artist Photo */}
                <div className="flex-shrink-0">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <img
                      src={heroImage}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Artist Info */}
                <div className="flex-1 text-center lg:text-left min-w-0 pb-2">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground truncate">
                      {artist.name}
                    </h1>
                    {VERIFIED_BADGE}
                  </div>

                  {artist.bio && (
                    <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl line-clamp-3 leading-relaxed">
                      {artist.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-5 justify-center lg:justify-start flex-wrap">
                    {concerts.length > 0 && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        {concerts.length} concierto{concerts.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {topTracks.length > 0 && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        {topTracks.length} canciones
                      </span>
                    )}
                    {news.length > 0 && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        {news.length} noticia{news.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Social links */}
                  {artist.social_links && Object.keys(artist.social_links).length > 0 && (
                    <div className="flex gap-2 mt-4 justify-center lg:justify-start">
                      {Object.entries(artist.social_links).map(([key, url]) => {
                        if (typeof url !== 'string' || !url.startsWith('http')) return null;
                        const social = SOCIAL_ICONS[key.toLowerCase().replace(/_url$/, '')];
                        if (!social) return null;
                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs font-medium bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors ${social.color}`}
                          >
                            <span dangerouslySetInnerHTML={{ __html: social.svg }} />
                            {social.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Tabs defaultValue="concerts" className="w-full mt-6">
            <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none grid grid-cols-3 max-w-sm sm:max-w-md">
              <TabsTrigger
                value="concerts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground text-sm"
              >
                <Calendar className="h-4 w-4" />
                Conciertos
              </TabsTrigger>
              <TabsTrigger
                value="music"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground text-sm"
              >
                <Music className="h-4 w-4" />
                Música
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground text-sm"
              >
                <Newspaper className="h-4 w-4" />
                Noticias
              </TabsTrigger>
            </TabsList>

            {/* ── Concerts ── */}
            <TabsContent value="concerts" className="mt-6">
              {concerts.length > 0 ? (
                <div className="space-y-2">
                  {concerts.map((concert) => {
                    const day = formatInBogota(concert.date, 'd');
                    const month = formatInBogota(concert.date, 'MMM');

                    return (
                      <button
                        key={concert.id}
                        onClick={() => navigate(`/concerts/${concert.slug}`)}
                        className="flex items-center gap-4 w-full p-3 sm:p-4 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                      >
                        {/* Date */}
                        <div className="flex-shrink-0 w-12 text-center">
                          <p className="text-lg font-bold text-primary leading-none">{day}</p>
                          <p className="text-[11px] text-muted-foreground uppercase mt-0.5">{month}</p>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {concert.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{concert.venues?.name}{concert.venues?.location ? ` · ${concert.venues.location}` : ''}</span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <svg className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<Calendar className="h-12 w-12" />} message="No hay conciertos próximos" />
              )}
            </TabsContent>

            {/* ── Music ── */}
            <TabsContent value="music" className="mt-6">
              {topTracks.length > 0 ? (
                <div className="space-y-1">
                  {topTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      {/* Number */}
                      <span className="text-sm font-medium text-muted-foreground w-5 text-right flex-shrink-0">
                        {index + 1}
                      </span>
                      {/* Album art */}
                      <img
                        src={track.album.images[0]?.url}
                        alt={track.album.name}
                        className="w-11 h-11 rounded-md object-cover flex-shrink-0"
                      />
                      {/* Track info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.album.name}
                        </p>
                      </div>
                      {/* Duration */}
                      <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
                        {formatDuration(track.duration_ms)}
                      </span>
                      {/* Spotify link */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-[#1DB954]"
                        onClick={() => window.open(track.external_urls.spotify, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Music className="h-12 w-12" />} message="No se encontraron canciones" />
              )}
            </TabsContent>

            {/* ── News ── */}
            <TabsContent value="news" className="mt-6">
              {news.length > 0 ? (
                <div className="space-y-2">
                  {news.map((article) => (
                    <Link
                      key={article.id}
                      to={`/blog/${article.slug}`}
                      className="flex items-center gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-16 h-16 sm:w-20 sm:h-14 rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDisplayDate(article.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Newspaper className="h-12 w-12" />} message="No hay noticias disponibles" />
              )}
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </>
  );
};

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
      {icon}
      <p className="text-sm text-muted-foreground mt-3">{message}</p>
    </div>
  );
}

export default ArtistDetail;
