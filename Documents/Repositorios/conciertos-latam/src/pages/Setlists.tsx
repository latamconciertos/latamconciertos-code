import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSetlistsPage, type ConcertWithSetlist } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const ITEMS_PER_PAGE = 10;

export default function Setlists() {
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming' | 'no-setlist'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: concerts = [], isLoading } = useSetlistsPage(filter);

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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as any);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
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
      
      <main className="container mx-auto px-4 pt-24 md:pt-32 pb-8">
        <div className="mb-8">
          <h1 className="page-title mb-4">Setlists de Conciertos</h1>
          <p className="page-subtitle">
            Explora las canciones que se tocaron en los conciertos de tus artistas favoritos
          </p>
        </div>

        <Tabs value={filter} onValueChange={handleFilterChange} className="mb-8">
          <TabsList>
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
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron setlists</h3>
                <p className="text-muted-foreground">
                  No hay conciertos con setlists disponibles para este filtro
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedConcerts.map((concert) => {
              const imageUrl = concert.image_url || concert.artist?.photo_url;
              const hasSetlist = concert.setlist_count > 0;

              return (
                <Card key={concert.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Imagen cuadrada a la izquierda */}
                      {imageUrl && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={concert.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Contenido */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 mb-1 sm:mb-2">{concert.title}</h3>
                          <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
                            {concert.artist && (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Music className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{concert.artist.name}</span>
                              </div>
                            )}
                            {concert.date && (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(concert.date).toLocaleDateString('es', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            {concert.venue && (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{concert.venue.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
                          {hasSetlist ? (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                {concert.setlist_count} {concert.setlist_count === 1 ? 'canción' : 'canciones'}
                              </Badge>
                              <Button asChild size="sm" className="h-7 text-xs sm:h-8 sm:text-sm">
                                <Link to={generateSetlistUrl(concert)}>
                                  Ver Setlist
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-muted-foreground text-xs">
                                Sin setlist
                              </Badge>
                              <Button asChild size="sm" variant="outline" className="h-7 text-xs sm:h-8 sm:text-sm">
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
