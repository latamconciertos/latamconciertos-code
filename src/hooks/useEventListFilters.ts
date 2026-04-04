import { useState, useEffect, useCallback } from 'react';
import type { ActiveFilter } from '@/components/filters';

export interface UseEventListFiltersOptions {
  /** Enable genre filter state (Concerts-only) */
  withGenre?: boolean;
  /** Default status filter */
  defaultStatus?: 'all' | 'upcoming' | 'past';
}

export interface NamedItem {
  id: string;
  name: string;
}

export function useEventListFilters(options: UseEventListFiltersOptions = {}) {
  const { withGenre = false, defaultStatus = 'upcoming' } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>(defaultStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

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

  /**
   * Build active filters list for display. Pass current countries/cities arrays
   * so the hook does not need to own geography queries.
   */
  const getActiveFilters = useCallback((countries: NamedItem[], cities: NamedItem[]): ActiveFilter[] => {
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
  }, [selectedCountry, selectedCity, filterStatus]);

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

  return {
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
    // Genre is always returned but only meaningful when withGenre is true
    ...(withGenre
      ? { selectedGenre, setSelectedGenre }
      : { selectedGenre: null as string | null, setSelectedGenre }),
    getActiveFilters,
    handleRemoveFilter,
    handleClearAllFilters,
  };
}
