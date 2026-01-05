import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Calendar, MapPin, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Setlists de Conciertos | Conciertos Latam"
        description="Explora los setlists de todos los conciertos en Latinoamérica. Descubre qué canciones tocaron tus artistas favoritos."
        type="website"
      />
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Music className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">Setlists Exclusivos</span>
          </div>
          <h1 className="page-title mb-4">Setlists de Conciertos</h1>
          <p className="page-subtitle max-w-3xl mx-auto">
            Descubre las canciones que tocaron tus artistas favoritos en sus conciertos por toda Latinoamérica
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por artista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-12 text-sm md:text-base pl-12"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={handleFilterChange} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="past">Pasados</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="no-setlist">Sin Setlist</TabsTrigger>
          </TabsList>
        </Tabs>

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
            {/* Concerts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {paginatedConcerts.map((concert) => {
                const imageUrl = concert.image_url || concert.artist?.photo_url || getDefaultImage();
                const hasSetlist = concert.setlist_count > 0;

                return (
                  <Card
                    key={concert.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30"
                  >
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="flex gap-4 sm:gap-5">
                        {/* Image with Blur Background */}
                        <div className="relative overflow-hidden bg-card rounded-lg flex-shrink-0">
                          {/* Blurred background */}
                          <div
                            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                          />

                          {/* Main image */}
                          <img
                            src={imageUrl}
                            alt={concert.title}
                            className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="min-w-0">
                            <h3 className="font-bold text-base sm:text-lg md:text-xl line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {concert.title}
                            </h3>
                            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                              {concert.artist && (
                                <div className="flex items-center gap-2">
                                  <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{concert.artist.name}</span>
                                </div>
                              )}
                              {concert.date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {new Date(concert.date).toLocaleDateString('es', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                              {concert.venue && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{concert.venue.name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {hasSetlist ? (
                              <>
                                <Badge variant="secondary" className="text-xs sm:text-sm">
                                  {concert.setlist_count} {concert.setlist_count === 1 ? 'canción' : 'canciones'}
                                </Badge>
                                <Button asChild size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                                  <Link to={generateSetlistUrl(concert)}>
                                    Ver Setlist
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-muted-foreground text-xs sm:text-sm">
                                  Sin setlist
                                </Badge>
                                <Button asChild size="sm" variant="outline" className="h-8 sm:h-9 text-xs sm:text-sm">
                                  <Link to={generateSetlistUrl(concert)}>
                                    Participar
                                  </Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
