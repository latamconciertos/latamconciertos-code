import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Music, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useArtists, useMainGenres, useSpotifyGenresForMainGenre } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { formatGenreList } from '@/lib/genres';

const Artists = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const itemsPerPage = 12;

  // Página actual en la URL (?page=N) para que la paginación sea crawleable
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(pageFromUrl) && pageFromUrl >= 1 ? pageFromUrl : 1;
  const setCurrentPage = (page: number) => {
    setSearchParams(page > 1 ? { page: String(page) } : {}, { preventScrollReset: false });
  };

  // Debounce search term - increased to 700ms for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1);
      }
    }, 700);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, debouncedSearchTerm]);

  // Género principal curado → lista de géneros Spotify equivalentes (tabla genre_mappings)
  const { data: spotifyGenres = [] } = useSpotifyGenresForMainGenre(selectedGenre);

  const { data, isLoading } = useArtists({
    search: debouncedSearchTerm || undefined,
    genres: selectedGenre && spotifyGenres.length > 0 ? spotifyGenres : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  const { data: mainGenres = [], isLoading: isLoadingGenres } = useMainGenres();

  const artists = data?.data || [];
  const totalCount = data?.count || 0;

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";

  const getValidSocialLinks = (socialLinks: any): Record<string, string> => {
    if (!socialLinks || typeof socialLinks !== 'object') return {};

    const validLinks: Record<string, string> = {};
    const urlPattern = /^https?:\/\//i;
    Object.entries(socialLinks).forEach(([key, value]) => {
      if (typeof value === 'string' && urlPattern.test(value)) {
        validLinks[key] = value;
      }
    });
    return validLinks;
  };

  // Géneros principales curados (en español), no los 60+ strings crudos de Spotify
  const uniqueGenres = mainGenres.map((g: { name: string }) => g.name);

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="dark font-fira min-h-screen bg-noche text-texto flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <LoadingSpinnerInline message="Cargando artistas..." />
        </main>
        <Footer />
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.conciertoslatam.com/artists#collection",
    "name": selectedGenre
      ? `Artistas de ${selectedGenre} en América Latina`
      : "Artistas Musicales de América Latina",
    "description": "Directorio completo de artistas y bandas de música latina, con biografías, conciertos y noticias",
    "url": "https://www.conciertoslatam.com/artists",
    "isPartOf": { "@id": "https://www.conciertoslatam.com/#website" },
    "inLanguage": "es-419",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Artistas",
      "numberOfItems": totalCount,
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "itemListElement": artists.slice(0, 20).map((artist: any, index: number) => {
        const sameAs = Object.values(getValidSocialLinks(artist.social_links));
        const item: Record<string, unknown> = {
          "@type": "MusicGroup",
          "position": (currentPage - 1) * itemsPerPage + index + 1,
          "name": artist.name,
          "url": `https://www.conciertoslatam.com/artists/${artist.slug}`,
          "image": artist.photo_url || getDefaultImage(),
        };
        if (artist.bio) item.description = artist.bio;
        if (Array.isArray(artist.genres) && artist.genres.length) item.genre = artist.genres;
        if (sameAs.length) item.sameAs = sameAs;
        return item;
      })
    }
  };

  return (
    <>
      <SEO
        title={
          selectedGenre
            ? `Artistas de ${selectedGenre} en LATAM`
            : `Artistas Latinos${totalCount ? ` · ${totalCount} músicos` : ''} | Conciertos, biografías y noticias`
        }
        description={
          selectedGenre
            ? `Descubre los mejores artistas de ${selectedGenre} en América Latina. Biografías, conciertos y toda su música en un solo lugar.`
            : 'Directorio completo de artistas de música latina: biografías, conciertos en vivo en LATAM, noticias, top tracks y redes sociales de tus músicos favoritos.'
        }
        keywords={
          selectedGenre
            ? `${selectedGenre}, artistas ${selectedGenre}, música latina, conciertos LATAM`
            : 'artistas latinos, músicos, bandas, intérpretes, cantantes, América Latina, conciertos, tour 2026'
        }
        url="/artists"
        structuredData={structuredData}
      />
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-16">
          <Breadcrumbs items={[{ label: 'Artistas' }]} />

          {/* Header Section */}
          <div className="text-center mt-6 mb-10 md:mb-14">
            <span className="eyebrow-nocturno justify-center mb-3">
              Directorio de música latina
            </span>
            <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.01em] leading-[0.92] text-foreground text-balance mb-4">
              Artistas
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Biografías, conciertos en LATAM, top tracks y noticias de tus artistas favoritos.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar artistas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-11 text-sm pl-11 rounded-full bg-superficie border-linea focus-visible:ring-periwinkle"
            />
          </div>

          {/* Genre Filter — editorial pills */}
          {!isLoadingGenres && uniqueGenres.length > 0 && (
            <div className="mb-8">
              <ScrollArea className="w-full">
                <div className="flex gap-1.5 pb-2 justify-center min-w-max sm:min-w-0 mx-auto">
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-colors flex-shrink-0 ${
                      !selectedGenre
                        ? 'bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white shadow-[0_8px_32px_rgba(0,74,173,.4)]'
                        : 'bg-superficie border border-linea text-texto-2 hover:text-texto hover:border-[rgba(89,124,255,.35)]'
                    }`}
                    aria-pressed={!selectedGenre}
                  >
                    Todos
                  </button>
                  {uniqueGenres.map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => handleGenreClick(genre)}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white shadow-[0_8px_32px_rgba(0,74,173,.4)]'
                            : 'bg-superficie border border-linea text-texto-2 hover:text-texto hover:border-[rgba(89,124,255,.35)]'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>

              {/* Active filter / count */}
              <div className="flex items-center justify-between mt-4 max-w-2xl mx-auto">
                <p className="text-xs text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'artista' : 'artistas'}
                  {selectedGenre && (
                    <span> en <span className="text-foreground font-semibold capitalize">{selectedGenre}</span></span>
                  )}
                </p>
                {(selectedGenre || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedGenre(null);
                      setSearchTerm('');
                    }}
                    className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Artists Grid */}
          {artists.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
                {artists.map((artist: any) => (
                  <Link
                    key={artist.id}
                    to={`/artists/${artist.slug}`}
                    className="group relative block overflow-hidden rounded-[20px] border border-linea bg-superficie-2 aspect-[4/5] hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle"
                  >
                    {/* Póster full-bleed: la foto ocupa toda la card, sin corte */}
                    <img
                      src={artist.photo_url || getDefaultImage()}
                      alt={
                        artist.genres && artist.genres.length > 0
                          ? `${artist.name} — artista de ${formatGenreList(artist.genres, 2)}`
                          : `${artist.name} — artista`
                      }
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay oscuro desde abajo para que el texto respire */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(7,13,31,.9))' }}
                    />

                    {/* Género como eyebrow + nombre sobre la foto */}
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
                      <p className="font-fira text-[9px] sm:text-[10px] text-periwinkle font-semibold uppercase tracking-[0.14em] truncate">
                        {artist.genres && artist.genres.length > 0
                          ? formatGenreList(artist.genres, 2)
                          : 'Artista'}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <h3 className="font-fira text-sm sm:text-[15px] font-bold text-texto leading-tight truncate">
                          {artist.name}
                        </h3>
                        {artist.is_verified === true && (
                          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" aria-label="Verificado">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" fill="hsl(var(--primary))" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalCount > itemsPerPage && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={currentPage > 2 ? `/artists?page=${currentPage - 1}` : '/artists'}
                          onClick={e => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const totalPages = Math.ceil(totalCount / itemsPerPage);
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href={pageNum > 1 ? `/artists?page=${pageNum}` : '/artists'}
                                onClick={e => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
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
                          href={`/artists?page=${Math.min(currentPage + 1, Math.ceil(totalCount / itemsPerPage))}`}
                          onClick={e => {
                            e.preventDefault();
                            if (currentPage < Math.ceil(totalCount / itemsPerPage)) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= Math.ceil(totalCount / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Music className="h-24 w-24 text-periwinkle/40 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-2">No hay artistas disponibles</h3>
              <p className="text-muted-foreground">Muy pronto sumaremos más artistas.</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Artists;
