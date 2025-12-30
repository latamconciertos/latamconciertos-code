import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Music, PartyPopper, Globe, Search, Users, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FestivalAttendanceButtons from '@/components/FestivalAttendanceButtons';
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
import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { useCountries, useCitiesByCountry } from '@/hooks/queries/useGeography';
import type { FestivalWithRelations } from '@/types/entities/festival';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';

const ITEMS_PER_PAGE = 12;
const SITE_URL = 'https://www.conciertoslatam.app';

const Festivals = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedFestival, setSelectedFestival] = useState<FestivalWithRelations | null>(null);

  const isMobile = useIsMobile();

  // Geography queries
  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCitiesByCountry(
    selectedCountry !== 'all' ? selectedCountry : ''
  );

  // Festivals query with filters and optimized caching
  const { data: festivalsResponse, isLoading } = useQuery({
    queryKey: ['festivals', 'page', filterStatus, debouncedSearchTerm, selectedCountry, selectedCity, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // Build filters
      const filters: any = {
        status: filterStatus,
        limit: ITEMS_PER_PAGE,
        offset: offset,
      };

      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm;
      }

      // For now, we'll filter by venue city on the client side
      // since the service doesn't directly support city filtering
      const result = await festivalService.getAll(filters);

      return result;
    },
    // Optimize caching - data stays fresh for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
  });

  const festivals = festivalsResponse?.data || [];
  const totalCount = festivalsResponse?.count || 0;

  // Client-side filtering by country/city
  const filteredFestivals = useMemo(() => {
    let filtered = festivals;

    if (selectedCountry !== 'all') {
      filtered = filtered.filter(festival =>
        festival.venues?.cities?.countries?.name === countries.find(c => c.id === selectedCountry)?.name
      );
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(festival =>
        festival.venues?.cities?.name === cities.find(c => c.id === selectedCity)?.name
      );
    }

    return filtered;
  }, [festivals, selectedCountry, selectedCity, countries, cities]);

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

  // Memoized filter handlers to prevent unnecessary re-renders
  const handleRemoveFilter = useCallback((key: string) => {
    if (key === 'country') {
      setSelectedCountry('all');
      setSelectedCity('all');
    } else if (key === 'city') {
      setSelectedCity('all');
    } else if (key === 'status') {
      setFilterStatus('upcoming');
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCountry('all');
    setSelectedCity('all');
    setFilterStatus('upcoming');
    setSearchTerm('');
  }, []);

  // Festival dialog handlers
  const handleFestivalClick = useCallback((festival: FestivalWithRelations) => {
    setSelectedFestival(festival);
    // setSearchParams({ id: festival.slug });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedFestival(null);
    // setSearchParams({});
  }, []);

  const activeFilters = getActiveFilters();

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
  }, [debouncedSearchTerm, filterStatus, selectedCountry, selectedCity]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es', { month: 'short' }),
      year: date.getFullYear()
    };
  };

  const formatDateRange = (startDate: string, endDate?: string | null) => {
    const start = parseISO(startDate);
    const startDay = format(start, 'd', { locale: es });
    const startMonth = format(start, 'MMM', { locale: es });

    if (!endDate) {
      return `${startDay} ${startMonth}`;
    }

    const end = parseISO(endDate);
    const endDay = format(end, 'd', { locale: es });

    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }

    const endMonth = format(end, 'MMM', { locale: es });
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  // Use optimized default image
  const getDefaultImage = () => getDefaultImageUtil('festival');

  // Get selected country/city names for SEO
  const selectedCountryName = selectedCountry !== 'all'
    ? countries.find(c => c.id === selectedCountry)?.name
    : null;
  const selectedCityName = selectedCity !== 'all'
    ? cities.find(c => c.id === selectedCity)?.name
    : null;

  // Dynamic SEO
  const seoData = useMemo(() => {
    let title = 'Festivales de Música en América Latina 2025';
    let description = 'Descubre todos los festivales de música en América Latina. ';
    let keywords = 'festivales, festivales de música, festivales 2025, eventos musicales, festivales latinoamérica, ';

    if (selectedCityName) {
      title = `Festivales de Música en ${selectedCityName} 2025`;
      description = `Calendario completo de festivales de música en ${selectedCityName}. `;
      keywords += `festivales en ${selectedCityName}, eventos ${selectedCityName}, `;
    } else if (selectedCountryName) {
      title = `Festivales de Música en ${selectedCountryName} 2025`;
      description = `Todos los festivales de música en ${selectedCountryName}. `;
      keywords += `festivales en ${selectedCountryName}, festivales ${selectedCountryName}, `;
    }

    if (filterStatus === 'upcoming') {
      title = `Próximos ${title}`;
      description += 'Fechas, lineup, entradas y toda la información de los próximos festivales. ';
    } else if (filterStatus === 'past') {
      title = `${title} - Historial`;
      description += 'Revive los mejores festivales pasados con fotos y setlists. ';
    }

    description += `Conciertos Latam - La plataforma #1 de festivales de música en vivo en Latinoamérica.`;
    keywords += 'Lollapalooza, Estéreo Picnic, Vive Latino, festivales rock, festivales electrónica';

    return { title, description, keywords };
  }, [selectedCityName, selectedCountryName, filterStatus]);

  // Memoized FestivalCard to prevent unnecessary re-renders
  const FestivalCard = memo(({ festival, onClick }: { festival: FestivalWithRelations; onClick?: () => void }) => {
    const dateInfo = formatDate(festival.start_date);
    const dateRange = formatDateRange(festival.start_date, festival.end_date);

    // Optimize image URL for better performance
    const optimizedImageUrl = festival.image_url
      ? optimizeUnsplashUrl(festival.image_url, { width: 800, height: 640, quality: 85 })
      : getDefaultImage();

    return (
      <Card
        className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer festival-card"
        onClick={onClick}
      >
        <div className="relative overflow-hidden">
          <img
            src={optimizedImageUrl}
            alt={`${festival.name} - Festival de música`}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />

          {festival.edition && (
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold px-4 py-2">
              Edición {festival.edition}
            </Badge>
          )}

          <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-20 h-20 flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-xs font-medium uppercase">{dateInfo.month}</span>
            <span className="text-2xl font-bold leading-none">{dateInfo.day}</span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className="p-6 flex flex-col h-[240px]">
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {festival.name}
              </h3>
              {festival.description && (
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {festival.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {festival.venues?.name && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate font-medium">
                    {festival.venues.name}
                  </span>
                </div>
              )}

              {festival.venues?.cities && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Globe className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate">
                    {festival.venues.cities.name}
                    {festival.venues.cities.countries?.name &&
                      `, ${festival.venues.cities.countries.name}`}
                  </span>
                </div>
              )}

              <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <span>{dateRange}</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full group/btn mt-4"
            onClick={(e) => {
              e.stopPropagation();
              if (festival.ticket_url) {
                window.open(festival.ticket_url, '_blank');
              }
            }}
            disabled={!festival.ticket_url}
          >
            <Ticket className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
            {festival.ticket_url ? 'Ver Entradas' : 'Próximamente'}
          </Button>
        </CardContent>
      </Card>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if festival id or relevant fields change
    return prevProps.festival.id === nextProps.festival.id &&
      prevProps.festival.image_url === nextProps.festival.image_url &&
      prevProps.festival.name === nextProps.festival.name;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <LoadingSpinnerInline message="Cargando festivales..." />
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
        url="/festivals"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-16">
          <Breadcrumbs items={[
            { label: 'Inicio', href: '/' },
            { label: 'Festivales', href: '/festivals' },
            ...(selectedCountryName ? [{ label: selectedCountryName }] : []),
            ...(selectedCityName ? [{ label: selectedCityName }] : [])
          ]} />

          {/* Hero Section */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <PartyPopper className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">Festivales de Música</span>
            </div>
            <h1 className="page-title mb-4">
              {selectedCityName
                ? `Festivales en ${selectedCityName}`
                : selectedCountryName
                  ? `Festivales en ${selectedCountryName}`
                  : 'Festivales en América Latina'}
            </h1>
            <p className="page-subtitle max-w-3xl mx-auto">
              {selectedCityName
                ? `Encuentra todos los festivales de música en ${selectedCityName}. Lineup, fechas, entradas y más.`
                : selectedCountryName
                  ? `El calendario más completo de festivales de música en ${selectedCountryName}. No te pierdas ningún evento.`
                  : 'La guía definitiva de festivales de música en toda Latinoamérica. Descubre los mejores eventos, compra tus entradas y vive la música.'}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground">{totalCount}+</strong> Festivales</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground">{countries.length}+</strong> Países</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground">Miles</strong> de fans</span>
              </div>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar festivales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 text-lg pl-10"
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

          {/* Festivals Grid */}
          {filteredFestivals.length > 0 ? (
            <section className="mb-16">
              <h2 className="sr-only">
                {filterStatus === 'upcoming' ? 'Próximos festivales' : filterStatus === 'past' ? 'Festivales pasados' : 'Todos los festivales'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFestivals.map((festival) => (
                  <article key={festival.id}>
                    <FestivalCard
                      festival={festival}
                      onClick={() => handleFestivalClick(festival)}
                    />
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-16">
              <PartyPopper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">No se encontraron festivales</h2>
              <p className="text-muted-foreground mb-6">
                Intenta ajustar tus filtros de búsqueda
              </p>
              <Button onClick={handleClearAllFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && filteredFestivals.length > 0 && (
            <nav className="mt-12">
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
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
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
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </nav>
          )}
        </main>

        {/* Festival Details Dialog */}
        <Dialog open={!!selectedFestival} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedFestival && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedFestival.name}</DialogTitle>
                  {selectedFestival.edition && (
                    <p className="text-lg text-muted-foreground">Edición {selectedFestival.edition}</p>
                  )}
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Festival Image - Square */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={optimizeUnsplashUrl(
                        selectedFestival.image_url || getDefaultImage(),
                        { width: 800, height: 800, quality: 90 }
                      )}
                      alt={selectedFestival.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Column */}
                  <div className="space-y-6">
                    {/* Attendance Buttons */}
                    <div className="flex justify-center md:justify-start">
                      <FestivalAttendanceButtons festivalId={selectedFestival.id} />
                    </div>

                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Detalles</TabsTrigger>
                        <TabsTrigger value="lineup">Lineup</TabsTrigger>
                        <TabsTrigger value="community">Comunidad</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 pt-4">
                        {selectedFestival.start_date && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Fecha</h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-primary" />
                              <p className="text-lg">
                                {formatDateRange(selectedFestival.start_date, selectedFestival.end_date)}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedFestival.venues && (
                          <>
                            <div>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Venue</h3>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <p className="text-lg">{selectedFestival.venues.name}</p>
                              </div>
                            </div>

                            {selectedFestival.venues.cities && (
                              <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</h3>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-primary" />
                                  <p className="text-lg">
                                    {selectedFestival.venues.cities.name}
                                    {selectedFestival.venues.cities.countries?.name &&
                                      `, ${selectedFestival.venues.cities.countries.name}`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {selectedFestival.description && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descripción</h3>
                            <p className="text-muted-foreground">{selectedFestival.description}</p>
                          </div>
                        )}

                        {selectedFestival.ticket_url && (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => window.open(selectedFestival.ticket_url!, '_blank')}
                          >
                            <Ticket className="h-5 w-5 mr-2" />
                            Comprar Entradas
                          </Button>
                        )}

                        {selectedFestival.website_url && (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={() => window.open(selectedFestival.website_url!, '_blank')}
                          >
                            <Globe className="h-5 w-5 mr-2" />
                            Sitio Web Oficial
                          </Button>
                        )}

                        {/* Link to full festival detail page */}
                        <Link to={`/festivals/${selectedFestival.slug}`} className="block">
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

                      <TabsContent value="lineup" className="pt-4">
                        {selectedFestival.lineup_artists && selectedFestival.lineup_artists.length > 0 ? (
                          <div className="space-y-2">
                            {selectedFestival.lineup_artists.map((artist, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}.</span>
                                <p className="font-semibold">{artist}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">Lineup por confirmar</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="community" className="pt-4">
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            La funcionalidad de comunidad estará disponible próximamente
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
};

export default Festivals;
