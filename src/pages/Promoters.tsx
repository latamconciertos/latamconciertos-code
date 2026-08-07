import { useState } from 'react';
import { Music, Globe, MapPin, Building2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// Pills de filtro "Evolución Nocturna": seleccionada con gradiente firma, resto sobre superficie
const pillBase = 'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300';
const pillActive = `${pillBase} bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white shadow-[0_8px_32px_rgba(0,74,173,.4)]`;
const pillInactive = `${pillBase} bg-superficie border border-linea text-texto-2 hover:text-texto hover:border-[rgba(89,124,255,.35)]`;

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
    "url": "https://www.conciertoslatam.com/promoters",
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
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16">
          <Breadcrumbs items={[{ label: 'Promotoras' }]} />

          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="eyebrow-nocturno mb-3">Organizadores profesionales</span>
            <h1 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-4">
              Promotoras de Conciertos
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
              Las principales empresas organizadoras de eventos musicales en América Latina
            </p>
          </div>

          {/* Country Filter - Scrollable on Mobile */}
          <div className="mb-8">
            {isMobile ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 min-w-max pb-2">
                  <button
                    onClick={() => setSelectedCountry('all')}
                    className={selectedCountry === 'all' ? pillActive : pillInactive}
                    aria-pressed={selectedCountry === 'all'}
                  >
                    Todos
                  </button>
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => setSelectedCountry(country.id)}
                      className={selectedCountry === country.id ? pillActive : pillInactive}
                      aria-pressed={selectedCountry === country.id}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="inline-flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setSelectedCountry('all')}
                    className={selectedCountry === 'all' ? pillActive : pillInactive}
                    aria-pressed={selectedCountry === 'all'}
                  >
                    Todos los países
                  </button>
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => setSelectedCountry(country.id)}
                      className={selectedCountry === country.id ? pillActive : pillInactive}
                      aria-pressed={selectedCountry === country.id}
                    >
                      {country.name}
                    </button>
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
                  className="group overflow-hidden rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPromoter(promoter)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-periwinkle/10 p-3 rounded-2xl">
                        <Building2 className="h-8 w-8 text-periwinkle" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl text-texto group-hover:text-periwinkle transition-colors mb-2 truncate">
                          {promoter.name}
                        </h3>
                        {promoter.countries && (
                          <div className="flex items-center gap-1 text-sm text-texto-2 mb-3">
                            <MapPin className="h-4 w-4 text-periwinkle" aria-hidden="true" />
                            <span>{promoter.countries.name}</span>
                          </div>
                        )}
                        {promoter.description && (
                          <p className="text-sm text-texto-2 line-clamp-3 mb-4">
                            {promoter.description}
                          </p>
                        )}
                        {promoter.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(promoter.website!, '_blank');
                            }}
                          >
                            <Globe className="h-4 w-4" aria-hidden="true" />
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
              <Building2 className="h-24 w-24 text-periwinkle/40 mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground mb-2">No hay promotoras disponibles</h3>
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
          {/* "Evolución Nocturna": el diálogo se monta en un portal, así que lleva su propio contexto oscuro */}
          <DialogContent className="dark font-fira max-w-4xl max-h-[80vh] overflow-y-auto rounded-[20px] border-linea bg-noche text-texto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-[0.01em] text-texto flex items-center gap-2">
                <Building2 className="h-6 w-6 text-periwinkle" aria-hidden="true" />
                {selectedPromoter?.name}
              </DialogTitle>
              {selectedPromoter?.description && (
                <DialogDescription className="text-base text-texto-2 mt-2">
                  {selectedPromoter.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {selectedPromoter?.countries && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-periwinkle" aria-hidden="true" />
                  <span className="text-lg font-semibold">{selectedPromoter.countries.name}</span>
                </div>
              )}

              {selectedPromoter?.website && (
                <Button
                  variant="outline"
                  className="gap-2 rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto"
                  onClick={() => window.open(selectedPromoter.website!, '_blank')}
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  Visitar Sitio Web
                </Button>
              )}

              <div className="border-t border-linea pt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-periwinkle" aria-hidden="true" />
                  Conciertos Organizados
                </h3>

                {loadingConcerts ? (
                  <LoadingSpinnerMini message="Cargando conciertos..." />
                ) : promoterConcerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promoterConcerts.map((concert) => (
                      <Card key={concert.id} className="overflow-hidden rounded-[20px] border-linea bg-superficie hover:bg-superficie-2 transition-colors">
                        <div className="flex gap-4 p-4">
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-superficie-2">
                            <img
                              src={concert.image_url || concert.artists?.photo_url || getDefaultImage()}
                              alt={concert.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-texto line-clamp-2 mb-1">
                              {concert.title}
                            </h4>
                            {concert.artists && (
                              <p className="text-sm text-texto-2 mb-1">
                                {concert.artists.name}
                              </p>
                            )}
                            {concert.date && (
                              <span className="inline-flex items-center rounded-full border border-linea bg-superficie-2 px-2.5 py-1 text-xs text-texto-2">
                                {formatDisplayDate(concert.date)}
                              </span>
                            )}
                            {concert.venues && (
                              <p className="text-xs text-texto-2 mt-1">
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
                    <Music className="h-16 w-16 text-periwinkle/40 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-texto-2">No hay conciertos registrados para esta promotora</p>
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
