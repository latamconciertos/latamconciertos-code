import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music, Calendar, MapPin, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useSetlistsPage, type ConcertWithSetlist } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const ITEMS_PER_PAGE = 12;

export default function Setlists() {
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming' | 'no-setlist'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search term - 700ms like Artists page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 700);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: concerts = [], isLoading } = useSetlistsPage(
    filter,
    debouncedSearchTerm || undefined
  );

  const generateSetlistUrl = (concert: ConcertWithSetlist) => {
    const artistSlug = concert.artist?.slug || 'artista';
    const concertSlug = concert.slug;
    const citySlug = concert.venue?.city?.slug || 'ciudad';
    const date = concert.date ? new Date(concert.date).toISOString().split('T')[0] : 'fecha';

    return `/setlist/${artistSlug}/${concertSlug}/${citySlug}/${date}`;
  };

  // Pagination
  const totalPages = Math.ceil(concerts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedConcerts = concerts.slice(startIndex, endIndex);

  const handleFilterChange = (value: string) => {
    setFilter(value as any);
    setCurrentPage(1);
  };

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <LoadingSpinnerInline message="Cargando setlists..." />
        </main>
        <Footer />
      </div>
    );
  }

  const setlistCount = concerts.filter(c => c.setlist_count > 0).length;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.conciertoslatam.app/setlists#collection",
    "name": "Setlists de Conciertos en América Latina",
    "description": "Catálogo de setlists de conciertos en Latinoamérica: canciones, orden de show, venues y fechas.",
    "url": "https://www.conciertoslatam.app/setlists",
    "isPartOf": { "@id": "https://www.conciertoslatam.app/#website" },
    "inLanguage": "es-419",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Setlists",
      "numberOfItems": concerts.length,
      "itemListElement": concerts.slice(0, 20).map((c, i) => ({
        "@type": "MusicEvent",
        "position": i + 1,
        "name": c.title,
        "startDate": c.date || undefined,
        "url": `https://www.conciertoslatam.app${generateSetlistUrl(c)}`,
        "performer": c.artist ? { "@type": "MusicGroup", "name": c.artist.name } : undefined,
        "location": c.venue ? { "@type": "MusicVenue", "name": c.venue.name } : undefined,
        "image": c.image_url || c.artist?.photo_url || undefined,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={
          searchTerm
            ? `Setlists de ${searchTerm} | Conciertos Latam`
            : `Setlists de Conciertos en LATAM${concerts.length ? ` · ${concerts.length} shows documentados` : ''}`
        }
        description="El archivo más completo de setlists de conciertos en Latinoamérica: canciones tocadas, orden de show, venues, fechas. Revive cada show de tus artistas favoritos."
        keywords="setlists conciertos, canciones concierto, setlist artista, setlists LATAM, qué tocó en concierto, repertorio show"
        url="/setlists"
        type="website"
        structuredData={structuredData}
      />
      <Header />

      <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16">
        {/* Editorial Hero */}
        <header className="text-center mt-6 mb-10 md:mb-14">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
            El archivo de la música en vivo
          </p>
          <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-4">
            Setlists
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Las canciones, el orden y la energía de cada show en LATAM. El registro definitivo de la música en vivo.
          </p>
          {concerts.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mt-8 md:mt-10">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {concerts.length}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  Conciertos
                </span>
              </div>
              {setlistCount > 0 && (
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    {setlistCount}
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    Con setlist
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Search + Editorial filter bar */}
        <div className="max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por artista..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-11 text-sm pl-11 rounded-full bg-card border-border/60 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 border-b border-border/60">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'past', label: 'Pasados' },
              { value: 'upcoming', label: 'Próximos' },
              { value: 'no-setlist', label: 'Sin Setlist' },
            ].map(({ value, label }) => {
              const isActive = filter === value;
              return (
                <button
                  key={value}
                  onClick={() => handleFilterChange(value)}
                  className={`relative px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  {label}
                  <span
                    className={`absolute left-0 right-0 -bottom-px h-0.5 transition-colors ${
                      isActive ? 'bg-primary' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {concerts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron setlists</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? `No hay conciertos de "${searchTerm}" para este filtro`
                    : 'No hay conciertos con setlists disponibles para este filtro'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Setlists list — setlist.fm / Songkick pattern */}
            <div className="max-w-4xl mx-auto divide-y divide-border/60 border-y border-border/60">
              {paginatedConcerts.map((concert) => {
                const imageUrl = concert.artist?.photo_url || concert.image_url || getDefaultImage();
                const hasSetlist = concert.setlist_count > 0;
                const dateObj = concert.date ? new Date(concert.date) : null;
                const day = dateObj ? dateObj.getDate().toString() : '—';
                const month = dateObj ? dateObj.toLocaleDateString('es', { month: 'short' }).replace('.', '').toUpperCase() : '';
                const year = dateObj ? dateObj.getFullYear().toString() : '';

                return (
                  <Link
                    key={concert.id}
                    to={generateSetlistUrl(concert)}
                    className="group flex items-center gap-4 sm:gap-6 py-5 px-2 sm:px-4 hover:bg-muted/40 transition-colors focus:outline-none"
                  >
                    {/* Date column */}
                    <time
                      dateTime={concert.date || ''}
                      className="flex-shrink-0 w-14 sm:w-16 text-center"
                    >
                      <div className="font-display text-3xl sm:text-4xl font-black text-foreground leading-none">{day}</div>
                      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-primary mt-1">{month}</div>
                      {year && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{year}</div>}
                    </time>

                    {/* Thumbnail — small, square, ringed */}
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted ring-1 ring-border/40">
                      <img
                        src={imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {concert.artist && (
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-1 truncate">
                          {concert.artist.name}
                        </p>
                      )}
                      <h3 className="text-sm sm:text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors truncate">
                        {concert.title}
                      </h3>
                      {concert.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {concert.venue.name}
                            {concert.venue.city?.name ? ` · ${concert.venue.city.name}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right column — setlist count + CTA */}
                    <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-1">
                      {hasSetlist ? (
                        <>
                          <span className="font-display text-xl font-black text-foreground leading-none">
                            {concert.setlist_count}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                            {concert.setlist_count === 1 ? 'canción' : 'canciones'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          Sin setlist
                        </span>
                      )}
                    </div>

                    {/* Mobile setlist count */}
                    <div className="flex-shrink-0 sm:hidden">
                      {hasSetlist ? (
                        <div className="text-right">
                          <div className="font-display text-lg font-black text-foreground leading-none">
                            {concert.setlist_count}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">
                            {concert.setlist_count === 1 ? 'canción' : 'cnc.'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60">
                          —
                        </span>
                      )}
                    </div>

                    {/* Arrow */}
                    <span className="flex-shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" aria-hidden="true">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={e => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
