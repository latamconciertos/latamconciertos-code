import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ExternalLink, Globe, Instagram, Twitter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useArtists } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const Artists = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useArtists({
    search: debouncedSearchTerm || undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  const artists = data?.data || [];
  const totalCount = data?.count || 0;

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";
  
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'website':
        return <Globe className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
    "@type": "ItemList",
    "name": "Artistas Musicales de América Latina",
    "description": "Directorio completo de artistas y bandas de música latina, con biografías, conciertos y noticias",
    "url": "https://www.conciertoslatam.app/artists",
    "numberOfItems": totalCount,
    "itemListElement": artists.slice(0, 10).map((artist: any, index: number) => ({
      "@type": "MusicGroup",
      "position": index + 1,
      "name": artist.name,
      "description": artist.bio || `Información sobre ${artist.name}`,
      "image": artist.photo_url || getDefaultImage(),
      "url": `https://www.conciertoslatam.app/artists/${artist.slug}`,
      "sameAs": Object.values(getValidSocialLinks(artist.social_links))
    }))
  };

  return (
    <>
      <SEO 
        title="Artistas Musicales - Directorio de Músicos Latinos" 
        description="Descubre los mejores artistas y bandas de música latina. Biografías, conciertos, noticias y toda la información sobre tus músicos favoritos." 
        keywords="artistas latinos, músicos, bandas, intérpretes, cantantes, América Latina" 
        url="/artists" 
        structuredData={structuredData} 
      />
      <div className="min-h-screen bg-background">
        <Header />
      
        <main className="container mx-auto px-4 py-16">
          <Breadcrumbs items={[{ label: 'Artistas' }]} />
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Music className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">Talentos Latinos</span>
            </div>
            <h1 className="page-title mb-4">Artistas</h1>
            <p className="page-subtitle max-w-3xl mx-auto">
              Descubre los mejores exponentes de la música latina que están conquistando el mundo
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar artistas por nombre..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full h-12 text-lg pl-12" 
            />
          </div>

          {/* Artists Grid */}
          {artists.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {artists.map((artist: any) => {
                  const validSocialLinks = getValidSocialLinks(artist.social_links);
                  const hasValidLinks = Object.keys(validSocialLinks).length > 0;
                  return (
                    <Card 
                      key={artist.id} 
                      className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer" 
                      onClick={() => navigate(`/artists/${artist.slug}`)}
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={artist.photo_url || getDefaultImage()} 
                          alt={artist.name} 
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {hasValidLinks && (
                          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex gap-2 justify-center">
                              {Object.entries(validSocialLinks).map(([platform, url]) => (
                                <Button 
                                  key={platform} 
                                  size="sm" 
                                  variant="secondary" 
                                  className="bg-black/70 hover:bg-black/90 text-white border-0" 
                                  onClick={e => {
                                    e.stopPropagation();
                                    window.open(url, '_blank');
                                  }}
                                >
                                  {getSocialIcon(platform)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
                              {artist.name}
                            </h3>
                            {artist.bio && (
                              <p className="text-muted-foreground text-sm line-clamp-3">
                                {artist.bio}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              Artista
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalCount > itemsPerPage && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
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
                                href="#" 
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
                          href="#" 
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
              <Music className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">No hay artistas disponibles</h3>
              <p className="text-muted-foreground">Próximamente añadiremos más artistas increíbles.</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Artists;
