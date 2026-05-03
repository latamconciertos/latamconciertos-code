import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Music, Star, Globe, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConcertsFAQ } from '@/components/ConcertsFAQ';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { MobileFiltersSheet, ActiveFiltersChips, FilterLabel } from '@/components/filters';
import { useIsMobile } from '@/hooks/use-mobile';
import WelcomePopup from '@/components/WelcomePopup';

// React Query hooks
import { useConcertsPage, useConcertBySlugDirect, type ConcertPageItem } from '@/hooks/queries/useConcertsPage';
import { useCountryOptions, useCitiesByCountry } from '@/hooks/queries/useGeography';
import { useMainGenres } from '@/hooks/queries';

// Extracted hooks
import { useEventListFilters } from '@/hooks/useEventListFilters';
import { useConcertsSEO } from '@/hooks/useConcertsSEO';

// Extracted components
import { EventListPagination } from '@/components/events/EventListPagination';
import { EventHeroSection } from '@/components/events/EventHeroSection';
import { ConcertCard } from '@/components/concerts/ConcertCard';
import { ConcertDetailDialog } from '@/components/concerts/ConcertDetailDialog';
import { ConcertGenreFilter } from '@/components/concerts/ConcertGenreFilter';
import { ConcertsCountryGrid } from '@/components/concerts/ConcertsCountryGrid';

const ITEMS_PER_PAGE = 12;

const Concerts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConcert, setSelectedConcert] = useState<ConcertPageItem | null>(null);

  const isMobile = useIsMobile();

  // Get concert slug from URL for direct loading
  const concertSlugFromUrl = searchParams.get('id');

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
    selectedGenre,
    setSelectedGenre,
    getActiveFilters,
    handleRemoveFilter,
    handleClearAllFilters,
  } = useEventListFilters({ withGenre: true });

  // Geography queries - using CountryOptions for proper typing
  const { data: countries = [] } = useCountryOptions();
  const { data: cities = [] } = useCitiesByCountry(
    selectedCountry !== 'all' ? selectedCountry : ''
  );

  const activeFilters = getActiveFilters(countries, cities);

  // Direct concert query when URL has id parameter (bypasses pagination)
  const { data: directConcert } = useConcertBySlugDirect(concertSlugFromUrl);

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

  // Handle URL parameter to open specific concert - uses direct query result
  useEffect(() => {
    if (concertSlugFromUrl && directConcert && !selectedConcert) {
      setSelectedConcert(directConcert);
    }
  }, [concertSlugFromUrl, directConcert, selectedConcert]);

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
    ? countries.find(c => c.id === selectedCountry)?.name ?? null
    : null;
  const selectedCityName = selectedCity !== 'all'
    ? cities.find(c => c.id === selectedCity)?.name ?? null
    : null;

  // SEO data
  const { seoData, structuredData, breadcrumbData } = useConcertsSEO({
    selectedCityName,
    selectedCountryName,
    filterStatus,
    debouncedSearchTerm,
    totalCount,
    concerts,
    selectedCountry,
    selectedCity,
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-16" itemScope itemType="https://schema.org/CollectionPage">
          <Breadcrumbs items={[
            { label: 'Conciertos', href: '/concerts' },
            ...(selectedCountryName ? [{ label: selectedCountryName }] : []),
            ...(selectedCityName ? [{ label: selectedCityName }] : [])
          ]} />

          {/* Hero Section with enhanced SEO content */}
          <EventHeroSection
            icon={<Star className="h-5 w-5 text-primary" aria-hidden="true" />}
            badgeText="Eventos Musicales"
            title={
              selectedCityName
                ? `Conciertos en ${selectedCityName}`
                : selectedCountryName
                  ? `Conciertos en ${selectedCountryName}`
                  : 'Conciertos en América Latina'
            }
            subtitle={
              selectedCityName
                ? `Encuentra todos los conciertos y eventos musicales en ${selectedCityName}. Fechas, venues, entradas y más.`
                : selectedCountryName
                  ? `Calendario completo de conciertos y festivales musicales en ${selectedCountryName}. La guía más completa de música en vivo.`
                  : 'Tu guía definitiva de conciertos, festivales y eventos musicales en toda Latinoamérica. Fechas, entradas, setlists y comunidad de fans.'
            }
            stats={[
              { icon: <Music className="h-4 w-4 text-primary" aria-hidden="true" />, value: `${totalCount}+`, label: 'Eventos' },
              { icon: <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />, value: `${countries.length}+`, label: 'Países' },
              { icon: <Users className="h-4 w-4 text-primary" aria-hidden="true" />, value: 'Miles', label: 'de fans' },
            ]}
            itemPropName="name"
            itemPropDescription="description"
          />

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            {/* Genre Filter - Modern Horizontal Design (Above Search) */}
            <ConcertGenreFilter
              genres={mainGenres ?? []}
              selectedGenre={selectedGenre}
              onGenreChange={setSelectedGenre}
              isLoading={isLoadingGenres}
            />

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar conciertos, artistas o venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 text-sm pl-11 rounded-full bg-card border-border/60 focus-visible:ring-primary/30"
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

                  {/* Status filter as editorial tab bar on mobile */}
                  <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1 min-w-max border-b border-border/60">
                      {[
                        { value: 'upcoming' as const, label: 'Próximos' },
                        { value: 'past' as const, label: 'Pasados' },
                        { value: 'all' as const, label: 'Todos' },
                      ].map(({ value, label }) => {
                        const isActive = filterStatus === value;
                        return (
                          <button
                            key={value}
                            onClick={() => setFilterStatus(value)}
                            className={`relative px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                              isActive ? 'text-foreground' : 'text-muted-foreground'
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

                <div className="flex items-center justify-center gap-1 sm:gap-2 border-b border-border/60">
                  {[
                    { value: 'upcoming' as const, label: 'Próximos' },
                    { value: 'past' as const, label: 'Pasados' },
                    { value: 'all' as const, label: 'Todos' },
                  ].map(({ value, label }) => {
                    const isActive = filterStatus === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setFilterStatus(value)}
                        className={`relative px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
              </>
            )}
          </div>

          {/* Concerts Grid */}
          {concerts.length > 0 && (
            <section className="mb-16" aria-label="Lista de conciertos">
              <h2 className="sr-only">
                {filterStatus === 'upcoming' ? 'Próximos conciertos' : filterStatus === 'past' ? 'Conciertos pasados' : 'Todos los conciertos'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" itemScope itemType="https://schema.org/ItemList">
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
                      onClick={handleConcertClick}
                    />
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && (
            <EventListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              ariaLabel="Paginación de conciertos"
            />
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
          <ConcertsCountryGrid />
        </main>

        <ConcertsFAQ countryName={selectedCountryName || undefined} cityName={selectedCityName || undefined} />

        <Footer />

        {/* Concert Details Dialog */}
        <ConcertDetailDialog
          concert={selectedConcert}
          onClose={handleCloseDialog}
        />
      </div>
    </>
  );
};

export default Concerts;
