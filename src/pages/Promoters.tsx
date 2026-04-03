import { useState } from 'react';
import { Music, Globe, MapPin, Building2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDisplayDate } from '@/lib/timezone';
import { usePromotersPage, usePromoterConcerts, useCountries, type PromoterWithCountry } from '@/hooks/queries';
import { LoadingSpinnerInline, LoadingSpinnerMini } from '@/components/ui/loading-spinner';
import { useIsMobile } from '@/hooks/use-mobile';

const Promoters = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithCountry | null>(null);

  const isMobile = useIsMobile();

  const { data: countries = [] } = useCountries();
  const { data: promoters = [], isLoading } = usePromotersPage(selectedCountry);
  const { data: promoterConcerts = [], isLoading: loadingConcerts } = usePromoterConcerts(selectedPromoter?.id || null);

  const getDefaultImage = () => "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Promotoras de Conciertos en América Latina",
    "description": "Directorio de promotoras de eventos musicales en América Latina",
    "url": "https://www.conciertoslatam.app/promoters",
    "numberOfItems": promoters.length,
    "itemListElement": promoters.slice(0, 10).map((promoter, index) => ({
      "@type": "Organization",
      "position": index + 1,
      "name": promoter.name,
      "description": promoter.description || `Promotora de eventos musicales ${promoter.name}`,
      "url": promoter.website
    }))
  };

  return (
    <>
      <SEO
        title="Promotoras de Conciertos - Organizadores de Eventos Musicales"
        description="Conoce las principales promotoras de conciertos y eventos musicales en América Latina. Encuentra información sobre organizadores de festivales y shows en vivo."
        keywords="promotoras de conciertos, organizadores de eventos, promotoras musicales, festivales, conciertos en vivo, América Latina"
        url="/promoters"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16">
          <Breadcrumbs items={[{ label: 'Promotoras' }]} />

          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">Organizadores Profesionales</span>
            </div>
            <h1 className="page-title mb-4">Promotoras de Conciertos</h1>
            <p className="page-subtitle max-w-3xl mx-auto">
              Las principales empresas organizadoras de eventos musicales en América Latina
            </p>
          </div>

          {/* Country Filter - Scrollable on Mobile */}
          <div className="mb-8">
            {isMobile ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 min-w-max pb-2">
                  <Button
                    variant={selectedCountry === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCountry('all')}
                    className="whitespace-nowrap"
                  >
                    Todos
                  </Button>
                  {countries.map((country) => (
                    <Button
                      key={country.id}
                      variant={selectedCountry === country.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCountry(country.id)}
                      className="whitespace-nowrap"
                    >
                      {country.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="inline-flex flex-wrap gap-2 bg-muted p-2 rounded-lg">
                  <Button
                    variant={selectedCountry === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCountry('all')}
                  >
                    Todos los países
                  </Button>
                  {countries.map((country) => (
                    <Button
                      key={country.id}
                      variant={selectedCountry === country.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCountry(country.id)}
                    >
                      {country.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Promoters Grid */}
          {isLoading ? (
            <LoadingSpinnerInline message="Cargando promotoras..." />
          ) : promoters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promoters.map((promoter) => (
                <Card
                  key={promoter.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPromoter(promoter)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 truncate">
                          {promoter.name}
                        </h3>
                        {promoter.countries && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{promoter.countries.name}</span>
                          </div>
                        )}
                        {promoter.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {promoter.description}
                          </p>
                        )}
                        {promoter.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(promoter.website!, '_blank');
                            }}
                          >
                            <Globe className="h-4 w-4" />
                            Sitio Web
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">No hay promotoras disponibles</h3>
              <p className="text-muted-foreground">
                {selectedCountry !== 'all'
                  ? 'No se encontraron promotoras en este país.'
                  : 'Próximamente añadiremos más promotoras.'}
              </p>
            </div>
          )}
        </main>

        <Footer />

        {/* Promoter Details Dialog */}
        <Dialog open={!!selectedPromoter} onOpenChange={() => setSelectedPromoter(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {selectedPromoter?.name}
              </DialogTitle>
              {selectedPromoter?.description && (
                <DialogDescription className="text-base mt-2">
                  {selectedPromoter.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {selectedPromoter?.countries && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{selectedPromoter.countries.name}</span>
                </div>
              )}

              {selectedPromoter?.website && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(selectedPromoter.website!, '_blank')}
                >
                  <Globe className="h-4 w-4" />
                  Visitar Sitio Web
                </Button>
              )}

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Conciertos Organizados
                </h3>

                {loadingConcerts ? (
                  <LoadingSpinnerMini message="Cargando conciertos..." />
                ) : promoterConcerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promoterConcerts.map((concert) => (
                      <Card key={concert.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex gap-4 p-4">
                          <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                            <img
                              src={concert.image_url || concert.artists?.photo_url || getDefaultImage()}
                              alt={concert.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground line-clamp-2 mb-1">
                              {concert.title}
                            </h4>
                            {concert.artists && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {concert.artists.name}
                              </p>
                            )}
                            {concert.date && (
                              <Badge variant="secondary" className="text-xs">
                                {formatDisplayDate(concert.date)}
                              </Badge>
                            )}
                            {concert.venues && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {concert.venues.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay conciertos registrados para esta promotora</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Promoters;
