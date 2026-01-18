import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Music, Star, ListMusic, Globe, Search, Users, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import ConcertAttendanceButtons from '@/components/ConcertAttendanceButtons';
import ConcertCommunity from '@/components/ConcertCommunity';
import { ConcertsFAQ } from '@/components/ConcertsFAQ';
import { SocialShare } from '@/components/SocialShare';
import { LoadingSpinnerInline, LoadingSpinnerMini } from '@/components/ui/loading-spinner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MobileFiltersSheet, ActiveFiltersChips, FilterLabel, type ActiveFilter } from '@/components/filters';
import { useIsMobile } from '@/hooks/use-mobile';
import WelcomePopup from '@/components/WelcomePopup';

// React Query hooks
import { useConcertsPage, useConcertBySlugDirect, type ConcertPageItem } from '@/hooks/queries/useConcertsPage';
import { useCountryOptions, useCitiesByCountry } from '@/hooks/queries/useGeography';
import { useMainGenres } from '@/hooks/queries';
import { useSetlistByConcert } from '@/hooks/queries/useSetlists';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const ITEMS_PER_PAGE = 12;
const SITE_URL = 'https://www.conciertoslatam.app';

const Concerts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConcert, setSelectedConcert] = useState<ConcertPageItem | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const isMobile = useIsMobile();

  // Get concert slug from URL for direct loading
  const concertSlugFromUrl = searchParams.get('id');

  // Geography queries - using CountryOptions for proper typing
  const { data: countries = [] } = useCountryOptions();
  const { data: cities = [] } = useCitiesByCountry(
    selectedCountry !== 'all' ? selectedCountry : ''
  );

  // Get active filters for mobile display
  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (selectedCountry !== 'all') {
      const country = countries.find(c => c.id === selectedCountry);
      if (country) filters.push({ key: 'country', label: country.name, value: selectedCountry });
    }
    if (selectedCity !== 'all') {
      const city = cities.find(c => c.id === selectedCity);
      if (city) filters.push({ key: 'city', label: city.name, value: selectedCity });
    }
    if (filterStatus !== 'upcoming') {
      filters.push({ key: 'status', label: filterStatus === 'past' ? 'Pasados' : 'Todos', value: filterStatus });
    }
    return filters;
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'country') {
      setSelectedCountry('all');
      setSelectedCity('all');
    } else if (key === 'city') {
      setSelectedCity('all');
    } else if (key === 'status') {
      setFilterStatus('upcoming');
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCountry('all');
    setSelectedCity('all');
    setFilterStatus('upcoming');
    setSearchTerm('');
  };

  const activeFilters = getActiveFilters();

  // Direct concert query when URL has id parameter (bypasses pagination)
  const { data: directConcert, isLoading: isLoadingDirect } = useConcertBySlugDirect(concertSlugFromUrl);

  // Concerts query with all filters
  const { data: concertsData, isLoading } = useConcertsPage({
    status: filterStatus,
    search: debouncedSearchTerm,
    countryId: selectedCountry,
    cityId: selectedCity,
    genre: selectedGenre,
    page: currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Main genres query
  const { data: mainGenres = [], isLoading: isLoadingGenres } = useMainGenres();

  const concerts = concertsData?.concerts || [];
  const totalCount = concertsData?.totalCount || 0;

  // Setlist query for selected concert
  const { data: setlist = [], isLoading: loadingSetlist } = useSetlistByConcert(
    selectedConcert?.id || ''
  );

  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry === 'all') {
      setSelectedCity('all');
    }
  }, [selectedCountry]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus, selectedCountry, selectedCity, selectedGenre]);

  // Handle URL parameter to open specific concert - uses direct query result
  useEffect(() => {
    if (concertSlugFromUrl && directConcert && !selectedConcert) {
      setSelectedConcert(directConcert);
    }
  }, [concertSlugFromUrl, directConcert, selectedConcert]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { day: '', month: '', year: '', fullDate: 'Fecha por confirmar' };

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('es', { month: 'short' }),
      year: date.getFullYear().toString(),
      fullDate: date.toLocaleDateString('es', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  // Use optimized default image
  const getDefaultImage = () => getDefaultImageUtil('concert');

  // Memoized handler to prevent unnecessary re-renders
  const handleConcertClick = useCallback((concert: ConcertPageItem) => {
    setSelectedConcert(concert);
    setSearchParams({ id: concert.slug });
  }, [setSearchParams]);

  const handleCloseDialog = useCallback(() => {
    setSelectedConcert(null);
    setSearchParams({});
  }, [setSearchParams]);

  // Get selected country/city names for SEO
  const selectedCountryName = selectedCountry !== 'all'
    ? countries.find(c => c.id === selectedCountry)?.name
    : null;
  const selectedCityName = selectedCity !== 'all'
    ? cities.find(c => c.id === selectedCity)?.name
    : null;

  // Dynamic SEO title and description based on filters
  const seoData = useMemo(() => {
    let title = 'Conciertos en América Latina 2026';
    let description = 'Encuentra todos los conciertos y eventos musicales en América Latina. ';
    let keywords = 'conciertos, conciertos 2026, eventos musicales, shows en vivo, entradas, boletas, tickets, ';

    if (selectedCityName) {
      title = `Conciertos en ${selectedCityName} 2026`;
      description = `Descubre todos los conciertos y eventos musicales en ${selectedCityName}. `;
      keywords += `conciertos en ${selectedCityName}, eventos en ${selectedCityName}, shows en ${selectedCityName}, `;
    } else if (selectedCountryName) {
      title = `Conciertos en ${selectedCountryName} 2026`;
      description = `Calendario completo de conciertos y festivales en ${selectedCountryName}. `;
      keywords += `conciertos en ${selectedCountryName}, eventos en ${selectedCountryName}, festivales en ${selectedCountryName}, `;
    }

    if (filterStatus === 'upcoming') {
      title = `Próximos ${title}`;
      description += 'Próximos conciertos, fechas, lugares, precios de entradas y toda la información que necesitas. ';
    } else if (filterStatus === 'past') {
      title = `${title} - Historial`;
      description += 'Historial de conciertos pasados, setlists y fotos. ';
    }

    if (debouncedSearchTerm) {
      title = `${debouncedSearchTerm} - Conciertos`;
      description = `Resultados de búsqueda para "${debouncedSearchTerm}". ${description}`;
      keywords += `${debouncedSearchTerm}, `;
    }

    description += `Conciertos Latam es la plataforma #1 de música en vivo en Latinoamérica con ${totalCount}+ eventos.`;
    keywords += 'Conciertos Latam, música en vivo, América Latina, Bogotá, Ciudad de México, Buenos Aires, Santiago, Lima, Movistar Arena, Estadio Nacional';

    return { title, description, keywords };
  }, [selectedCityName, selectedCountryName, filterStatus, debouncedSearchTerm, totalCount]);

  // Enhanced structured data for SEO - Event List
  const structuredData = useMemo(() => {
    const eventListData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": seoData.title,
      "description": seoData.description,
      "url": `${SITE_URL}/concerts`,
      "numberOfItems": totalCount,
      "itemListElement": concerts.slice(0, 10).map((concert, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "MusicEvent",
          "@id": `${SITE_URL}/concerts?id=${concert.slug}`,
          "name": concert.title,
          "description": concert.description || `Concierto de ${concert.artists?.name || 'artista'} en ${concert.venues?.cities?.name || 'América Latina'}`,
          "image": concert.image_url || concert.artist_image_url || getDefaultImage(),
          "startDate": concert.date || undefined,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": concert.venues?.name || "Venue por confirmar",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": concert.venues?.cities?.name || "",
              "addressCountry": concert.venues?.cities?.countries?.name || ""
            }
          },
          "performer": concert.artists?.name ? {
            "@type": "MusicGroup",
            "name": concert.artists.name
          } : undefined,
          "organizer": {
            "@type": "Organization",
            "name": "Conciertos Latam",
            "url": SITE_URL
          },
          "offers": concert.ticket_url ? {
            "@type": "Offer",
            "url": concert.ticket_url,
            "availability": "https://schema.org/InStock",
            "priceCurrency": "USD"
          } : undefined
        }
      }))
    };

    // Organization data for branding
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Conciertos Latam",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo-principal.png`,
      "description": "La plataforma #1 de conciertos y eventos musicales en América Latina",
      "sameAs": [
        "https://www.instagram.com/conciertoslatam",
        "https://www.twitter.com/conciertoslatam",
        "https://www.facebook.com/conciertoslatam"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Spanish", "English"]
      }
    };

    // Website search action for Google Sitelinks
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Conciertos Latam",
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/concerts?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // FAQ Schema for common questions
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Dónde puedo encontrar todos los conciertos en América Latina?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En Conciertos Latam encuentras el calendario más completo de conciertos, festivales y eventos musicales en toda América Latina. Tenemos información de eventos en México, Colombia, Argentina, Chile, Perú y más países."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cómo comprar entradas para conciertos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En cada concierto listado en Conciertos Latam encontrarás un enlace directo a la venta oficial de entradas. Te conectamos con los proveedores autorizados como Ticketmaster, TuBoleta, Passline y más."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué información encuentro sobre cada concierto?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Para cada concierto ofrecemos: fecha y hora, ubicación del venue, artistas confirmados, precios de entradas, setlist (lista de canciones), comunidad de fans y más información relevante."
          }
        }
      ]
    };

    return [eventListData, organizationData, websiteData, faqData];
  }, [concerts, totalCount, seoData]);

  // Breadcrumb structured data
  const breadcrumbData = useMemo(() => {
    const items = [
      { name: "Inicio", item: SITE_URL },
      { name: "Conciertos", item: `${SITE_URL}/concerts` }
    ];

    if (selectedCountryName) {
      items.push({
        name: `Conciertos en ${selectedCountryName}`,
        item: `${SITE_URL}/concerts?country=${selectedCountry}`
      });
    }

    if (selectedCityName) {
      items.push({
        name: `Conciertos en ${selectedCityName}`,
        item: `${SITE_URL}/concerts?city=${selectedCity}`
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.item
      }))
    };
  }, [selectedCountryName, selectedCityName, selectedCountry, selectedCity]);

  // Memoized ConcertCard to prevent unnecessary re-renders
  const ConcertCard = memo(({ concert, isPast = false }: { concert: ConcertPageItem; isPast?: boolean }) => {
    const dateInfo = formatDate(concert.date);

    // Optimize image URL for better performance
    const optimizedImageUrl = concert.artist_image_url
      ? optimizeUnsplashUrl(concert.artist_image_url, { width: 800, height: 640, quality: 85 })
      : getDefaultImage();

    return (
      <Card
        className={`group overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer concert-card ${isPast ? 'opacity-75' : ''}`}
        onClick={() => handleConcertClick(concert)}
      >
        {/* Hidden SEO metadata */}
        <meta itemProp="name" content={concert.title} />
        <meta itemProp="startDate" content={concert.date || ''} />
        {concert.description && <meta itemProp="description" content={concert.description} />}
        <link itemProp="url" href={`${SITE_URL}/concerts?id=${concert.slug}`} />

        <div className="relative overflow-hidden">
          <img
            src={optimizedImageUrl}
            alt={`${concert.artists?.name || 'Artista'} - ${concert.title} - Concierto en ${concert.venues?.cities?.name || 'América Latina'}`}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
            itemProp="image"
            loading="lazy"
            decoding="async"
          />

          <div className="absolute top-4 left-4">
            <Badge className={isPast ? "bg-gray-500 text-white" : "bg-green-500 text-white font-bold px-3 py-1"}>
              {isPast ? 'Finalizado' : 'Próximo'}
            </Badge>
          </div>

          <time
            dateTime={concert.date || ''}
            className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-16 h-16 flex flex-col items-center justify-center text-center shadow-lg"
            itemProp="startDate"
          >
            <span className="text-xs font-medium">{dateInfo.month}</span>
            <span className="text-lg font-bold leading-none">{dateInfo.day}</span>
          </time>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className="p-6 flex flex-col h-[280px]">
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {concert.title}
              </h3>
              {concert.artists?.name && (
                <p className="text-primary font-semibold text-lg mb-1" itemProp="performer" itemScope itemType="https://schema.org/MusicGroup">
                  <span itemProp="name">{concert.artists.name}</span>
                </p>
              )}
              {concert.description && (
                <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                  {concert.description}
                </p>
              )}
            </div>

            <div className="space-y-2" itemProp="location" itemScope itemType="https://schema.org/Place">
              {concert.venues?.name && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium line-clamp-1" itemProp="name">
                    {concert.venues.name}
                  </span>
                </div>
              )}

              {concert.venues?.cities && (
                <div className="flex items-center text-muted-foreground text-sm" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <Globe className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">
                    <span itemProp="addressLocality">{concert.venues.cities.name}</span>
                    {concert.venues.cities.countries?.name && (
                      <>, <span itemProp="addressCountry">{concert.venues.cities.countries.name}</span></>
                    )}
                  </span>
                </div>
              )}

              {concert.date && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{dateInfo.fullDate}</span>
                </div>
              )}
            </div>
          </div>

          {!isPast && (
            <Button
              className="w-full group/btn mt-4"
              onClick={(e) => {
                e.stopPropagation();
                if (concert.ticket_url) {
                  window.open(concert.ticket_url, '_blank');
                }
              }}
              disabled={!concert.ticket_url}
              aria-label={concert.ticket_url ? `Comprar entradas para ${concert.title}` : 'Entradas próximamente disponibles'}
            >
              <Ticket className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" aria-hidden="true" />
              {concert.ticket_url ? 'Ver Entradas' : 'Próximamente'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if concert id or relevant fields change
    return prevProps.concert.id === nextProps.concert.id &&
      prevProps.concert.artist_image_url === nextProps.concert.artist_image_url &&
      prevProps.isPast === nextProps.isPast;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <LoadingSpinnerInline message="Cargando conciertos..." />
        </main>
        <Footer />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url="/concerts"
        structuredData={[...structuredData, breadcrumbData]}
      />
      <WelcomePopup />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-16" itemScope itemType="https://schema.org/CollectionPage">
          <Breadcrumbs items={[
            { label: 'Conciertos', href: '/concerts' },
            ...(selectedCountryName ? [{ label: selectedCountryName }] : []),
            ...(selectedCityName ? [{ label: selectedCityName }] : [])
          ]} />

          {/* Hero Section with enhanced SEO content */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Star className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-primary font-semibold">Eventos Musicales</span>
            </div>
            <h1 className="page-title mb-4" itemProp="name">
              {selectedCityName
                ? `Conciertos en ${selectedCityName}`
                : selectedCountryName
                  ? `Conciertos en ${selectedCountryName}`
                  : 'Conciertos en América Latina'}
            </h1>
            <p className="page-subtitle max-w-3xl mx-auto" itemProp="description">
              {selectedCityName
                ? `Encuentra todos los conciertos y eventos musicales en ${selectedCityName}. Fechas, venues, entradas y más.`
                : selectedCountryName
                  ? `Calendario completo de conciertos y festivales musicales en ${selectedCountryName}. La guía más completa de música en vivo.`
                  : 'Tu guía definitiva de conciertos, festivales y eventos musicales en toda Latinoamérica. Fechas, entradas, setlists y comunidad de fans.'}
            </p>

            {/* Stats for credibility */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" aria-hidden="true" />
                <span><strong className="text-foreground">{totalCount}+</strong> Eventos</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                <span><strong className="text-foreground">{countries.length}+</strong> Países</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                <span><strong className="text-foreground">Miles</strong> de fans</span>
              </div>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            {/* Genre Filter - Modern Horizontal Design (Above Search) */}
            {!isLoadingGenres && mainGenres.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Géneros Musicales</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedGenre ? `Filtrando: ${selectedGenre}` : 'Filtra por género'}
                      </p>
                    </div>
                  </div>
                  {selectedGenre && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGenre(null)}
                      className="text-xs h-7 hover:bg-destructive/10 hover:text-destructive"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>

                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-3">
                    {mainGenres.map((genre) => {
                      const isSelected = selectedGenre === genre.name;
                      return (
                        <button
                          key={genre.name}
                          onClick={() => setSelectedGenre(isSelected ? null : genre.name)}
                          className={`
                            relative px-4 py-2 rounded-full text-sm font-medium
                            transition-all duration-200 flex-shrink-0
                            ${isSelected
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                              : 'bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
                            }
                          `}
                        >
                          <span className="relative z-10">{genre.name}</span>
                          {isSelected && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent blur-xl" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar conciertos, artistas o venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 text-sm md:text-base pl-10"
              />
            </div>

            {/* Mobile Filters */}
            {isMobile ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <MobileFiltersSheet
                    activeFiltersCount={activeFilters.length}
                    onClearFilters={handleClearAllFilters}
                    title="Filtros"
                  >
                    <div className="space-y-6">
                      <div>
                        <FilterLabel icon={<MapPin className="h-4 w-4" />}>País</FilterLabel>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="all">Todos los países</SelectItem>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FilterLabel icon={<Globe className="h-4 w-4" />}>Ciudad</FilterLabel>
                        <Select
                          value={selectedCity}
                          onValueChange={setSelectedCity}
                          disabled={selectedCountry === 'all'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar ciudad" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="all">Todas las ciudades</SelectItem>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FilterLabel icon={<Calendar className="h-4 w-4" />}>Estado</FilterLabel>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                            onClick={() => setFilterStatus('upcoming')}
                            className="w-full justify-start"
                          >
                            Próximos
                          </Button>
                          <Button
                            variant={filterStatus === 'past' ? 'default' : 'outline'}
                            onClick={() => setFilterStatus('past')}
                            className="w-full justify-start"
                          >
                            Pasados
                          </Button>
                          <Button
                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilterStatus('all')}
                            className="w-full justify-start"
                          >
                            Todos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </MobileFiltersSheet>

                  {/* Status filter as scrollable tabs on mobile */}
                  <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                      <Button
                        size="sm"
                        variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('upcoming')}
                      >
                        Próximos
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'past' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('past')}
                      >
                        Pasados
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('all')}
                      >
                        Todos
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Filters Chips */}
                {activeFilters.length > 0 && (
                  <ActiveFiltersChips
                    filters={activeFilters}
                    onRemove={handleRemoveFilter}
                  />
                )}
              </div>
            ) : (
              /* Desktop Filters */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todos los países</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedCity}
                    onValueChange={setSelectedCity}
                    disabled={selectedCountry === 'all'}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center gap-2">
                  <Button
                    variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('upcoming')}
                  >
                    Próximos
                  </Button>
                  <Button
                    variant={filterStatus === 'past' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('past')}
                  >
                    Pasados
                  </Button>
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                  >
                    Todos
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Concerts Grid */}
          {concerts.length > 0 && (
            <section className="mb-16" aria-label="Lista de conciertos">
              <h2 className="sr-only">
                {filterStatus === 'upcoming' ? 'Próximos conciertos' : filterStatus === 'past' ? 'Conciertos pasados' : 'Todos los conciertos'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" itemScope itemType="https://schema.org/ItemList">
                {concerts.map((concert, index) => (
                  <article
                    key={concert.id}
                    itemScope
                    itemType="https://schema.org/MusicEvent"
                    itemProp="itemListElement"
                  >
                    <meta itemProp="position" content={String(index + 1)} />
                    <ConcertCard
                      concert={concert}
                      isPast={filterStatus === 'past'}
                    />
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && (
            <nav className="mt-12" aria-label="Paginación de conciertos">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      aria-label="Ir a la página anterior"
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;

                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
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
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </nav>
          )}

          {/* Empty state */}
          {concerts.length === 0 && (
            <div className="text-center py-12">
              <Music className="h-24 w-24 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-foreground mb-2">No hay conciertos disponibles</h2>
              <p className="text-muted-foreground">Próximamente añadiremos increíbles eventos musicales.</p>
            </div>
          )}

          {/* Conciertos por País - Cards con Banderas */}
          <section className="mt-16 pt-8 border-t border-border/50" aria-label="Conciertos por país">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-8">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Explora por País</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Colombia', flag: '🇨🇴', slug: 'colombia' },
                  { name: 'México', flag: '🇲🇽', slug: 'mexico' },
                  { name: 'Argentina', flag: '🇦🇷', slug: 'argentina' },
                  { name: 'Chile', flag: '🇨🇱', slug: 'chile' },
                  { name: 'Perú', flag: '🇵🇪', slug: 'peru' },
                  { name: 'Brasil', flag: '🇧🇷', slug: 'brasil' },
                  { name: 'Ecuador', flag: '🇪🇨', slug: 'ecuador' },
                  { name: 'Uruguay', flag: '🇺🇾', slug: 'uruguay' },
                ].map((country) => (
                  <Link
                    key={country.slug}
                    to={`/conciertos/${country.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50">
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                          {country.flag}
                        </div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {country.name}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>

        <ConcertsFAQ countryName={selectedCountryName || undefined} cityName={selectedCityName || undefined} />

        <Footer />

        {/* Concert Details Dialog */}
        <Dialog open={!!selectedConcert} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedConcert && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedConcert.title}</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Concert Image - Square */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={selectedConcert.artist_image_url || getDefaultImage()}
                      alt={selectedConcert.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Column */}
                  <div className="space-y-6">
                    {/* Attendance Buttons */}
                    <div className="flex justify-center md:justify-start">
                      <ConcertAttendanceButtons concertId={selectedConcert.id} />
                    </div>

                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Detalles</TabsTrigger>
                        <TabsTrigger value="setlist">Setlist</TabsTrigger>
                        <TabsTrigger value="community">Comunidad</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 pt-4">
                        {selectedConcert.artists?.name && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Artista</h3>
                            <p className="text-lg font-semibold text-primary">{selectedConcert.artists.name}</p>
                          </div>
                        )}

                        {selectedConcert.date && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-primary" />
                              <p className="text-lg">{formatDate(selectedConcert.date).fullDate}</p>
                            </div>
                          </div>
                        )}

                        {selectedConcert.venues && (
                          <>
                            <div>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Lugar</h3>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <p className="text-lg">{selectedConcert.venues.name}</p>
                              </div>
                            </div>

                            {selectedConcert.venues.cities && (
                              <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-primary" />
                                  <p className="text-lg">
                                    {selectedConcert.venues.cities.name}
                                    {selectedConcert.venues.cities.countries?.name &&
                                      `, ${selectedConcert.venues.cities.countries.name}`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {selectedConcert.description && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                            <p className="text-muted-foreground">{selectedConcert.description}</p>
                          </div>
                        )}

                        {selectedConcert.spotify_embed_url && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                              <Music className="h-4 w-4 inline mr-1" />
                              Escucha en Spotify
                            </h3>
                            <div className="rounded-lg overflow-hidden">
                              <iframe
                                src={selectedConcert.spotify_embed_url}
                                width="100%"
                                height="352"
                                frameBorder="0"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                        )}

                        {selectedConcert.ticket_url && (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => window.open(selectedConcert.ticket_url!, '_blank')}
                          >
                            <Ticket className="h-5 w-5 mr-2" />
                            Comprar Entradas
                          </Button>
                        )}

                        {/* Link to full concert detail page */}
                        <Link to={`/concerts/${selectedConcert.slug}`} className="block">
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            size="lg"
                          >
                            <Info className="h-5 w-5" />
                            Ver página completa
                          </Button>
                        </Link>
                      </TabsContent>

                      <TabsContent value="setlist" className="pt-4">
                        {loadingSetlist ? (
                          <div className="text-center py-8">
                            <LoadingSpinnerMini message="Cargando setlist..." />
                          </div>
                        ) : setlist.length > 0 ? (
                          <div className="space-y-4">
                            <SocialShare
                              url={`https://www.conciertoslatam.app/concerts#${selectedConcert.slug}`}
                              title={`Setlist de ${selectedConcert.title}`}
                              setlistData={{
                                concertTitle: selectedConcert.title,
                                artistName: selectedConcert.artists?.name,
                                date: selectedConcert.date,
                                songs: setlist.map((song: any) => ({
                                  song_name: song.song_name,
                                  artist_name: song.artist_name || undefined
                                }))
                              }}
                            />
                            <div className="space-y-2">
                              {setlist.map((song: any, index) => (
                                <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                  <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}.</span>
                                  <div className="flex-1">
                                    <p className="font-semibold">{song.song_name}</p>
                                    {song.artist_name && (
                                      <p className="text-sm text-muted-foreground">{song.artist_name}</p>
                                    )}
                                    {song.notes && (
                                      <p className="text-sm text-muted-foreground italic">{song.notes}</p>
                                    )}
                                  </div>
                                  {song.spotify_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(song.spotify_url!, '_blank')}
                                    >
                                      <Music className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* View Full Page Button */}
                            <div className="border-t border-border pt-3 mt-4">
                              <p className="text-xs text-muted-foreground text-center mb-2">
                                Ver información completa de precios, fechas de preventa y más
                              </p>
                              <Button
                                variant="outline"
                                className="w-full"
                                size="sm"
                                asChild
                              >
                                <Link to={`/concerts/${selectedConcert?.slug}`}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Ver página completa
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <ListMusic className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">No hay setlist disponible aún</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="community" className="pt-4">
                        <ConcertCommunity
                          concertId={selectedConcert.id}
                          concertTitle={selectedConcert.title}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Concerts;
