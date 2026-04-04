import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Music, PartyPopper, Globe, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { MobileFiltersSheet, ActiveFiltersChips, FilterLabel } from '@/components/filters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { useCountries, useCitiesByCountry } from '@/hooks/queries/useGeography';
import type { FestivalWithRelations } from '@/types/entities/festival';

// Extracted hooks
import { useEventListFilters } from '@/hooks/useEventListFilters';
import { useFestivalsSEO } from '@/hooks/useFestivalsSEO';

// Extracted components
import { EventListPagination } from '@/components/events/EventListPagination';
import { EventHeroSection } from '@/components/events/EventHeroSection';
import { EventEmptyState } from '@/components/events/EventEmptyState';
import { FestivalCard } from '@/components/festivals/FestivalCard';
import { FestivalDetailDialog } from '@/components/festivals/FestivalDetailDialog';

const ITEMS_PER_PAGE = 12;

const Festivals = () => {
  const [_searchParams] = useSearchParams();
  const [selectedFestival, setSelectedFestival] = useState<FestivalWithRelations | null>(null);

  const isMobile = useIsMobile();

  // Shared filter state
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    selectedCountry,
    setSelectedCountry,
    selectedCity,
    setSelectedCity,
    getActiveFilters,
    handleRemoveFilter,
    handleClearAllFilters,
  } = useEventListFilters();

  // Geography queries
  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCitiesByCountry(
    selectedCountry !== 'all' ? selectedCountry : ''
  );

  const activeFilters = getActiveFilters(countries, cities);

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

  // Festival dialog handlers
  const handleFestivalClick = useCallback((festival: FestivalWithRelations) => {
    setSelectedFestival(festival);
    // setSearchParams({ id: festival.slug });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedFestival(null);
    // setSearchParams({});
  }, []);

  // Get selected country/city names for SEO
  const selectedCountryName = selectedCountry !== 'all'
    ? countries.find(c => c.id === selectedCountry)?.name
    : null;
  const selectedCityName = selectedCity !== 'all'
    ? cities.find(c => c.id === selectedCity)?.name
    : null;

  // SEO data
  const { seoData, structuredData } = useFestivalsSEO({
    selectedCityName: selectedCityName ?? null,
    selectedCountryName: selectedCountryName ?? null,
    filterStatus,
    totalCount,
    filteredFestivals,
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
        structuredData={structuredData}
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
          <EventHeroSection
            icon={<PartyPopper className="h-5 w-5 text-primary" />}
            badgeText="Festivales de Música"
            title={
              selectedCityName
                ? `Festivales en ${selectedCityName}`
                : selectedCountryName
                  ? `Festivales en ${selectedCountryName}`
                  : 'Festivales en América Latina'
            }
            subtitle={
              selectedCityName
                ? `Encuentra todos los festivales de música en ${selectedCityName}. Lineup, fechas, entradas y más.`
                : selectedCountryName
                  ? `El calendario más completo de festivales de música en ${selectedCountryName}. No te pierdas ningún evento.`
                  : 'La guía definitiva de festivales de música en toda Latinoamérica. Descubre los mejores eventos, compra tus entradas y vive la música.'
            }
            stats={[
              { icon: <Music className="h-4 w-4 text-primary" />, value: `${totalCount}+`, label: 'Festivales' },
              { icon: <MapPin className="h-4 w-4 text-primary" />, value: `${countries.length}+`, label: 'Países' },
              { icon: <Users className="h-4 w-4 text-primary" />, value: 'Miles', label: 'de fans' },
            ]}
          />

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
            <>
              <EventEmptyState
                icon={<PartyPopper className="h-16 w-16 text-muted-foreground" />}
                title="No se encontraron festivales"
                message="Intenta ajustar tus filtros de búsqueda"
              />
              <div className="text-center mb-6">
                <Button onClick={handleClearAllFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && filteredFestivals.length > 0 && (
            <EventListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              ariaLabel="Paginación de festivales"
            />
          )}
        </main>

        {/* Festival Details Dialog */}
        <FestivalDetailDialog
          festival={selectedFestival}
          onClose={handleCloseDialog}
        />

        <Footer />
      </div>
    </>
  );
};

export default Festivals;
