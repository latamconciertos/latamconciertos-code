/**
 * Query Keys Factory
 * 
 * Centralized query keys for React Query cache management.
 * Follows the factory pattern for type-safe, hierarchical keys.
 */

export const queryKeys = {
  // Concerts
  concerts: {
    all: ['concerts'] as const,
    lists: () => [...queryKeys.concerts.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.concerts.lists(), filters] as const,
    upcoming: (limit?: number) => [...queryKeys.concerts.all, 'upcoming', { limit }] as const,
    past: (limit?: number) => [...queryKeys.concerts.all, 'past', { limit }] as const,
    featured: () => [...queryKeys.concerts.all, 'featured'] as const,
    details: () => [...queryKeys.concerts.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.concerts.details(), slug] as const,
    byArtist: (artistId: string, status?: string) => [...queryKeys.concerts.all, 'byArtist', artistId, status] as const,
  },

  // Festivals
  festivals: {
    all: ['festivals'] as const,
    lists: () => [...queryKeys.festivals.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.festivals.lists(), filters] as const,
    upcoming: (limit?: number) => [...queryKeys.festivals.all, 'upcoming', { limit }] as const,
    featured: () => [...queryKeys.festivals.all, 'featured'] as const,
    details: () => [...queryKeys.festivals.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.festivals.details(), slug] as const,
  },

  // News
  news: {
    all: ['news'] as const,
    lists: () => [...queryKeys.news.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.news.lists(), filters] as const,
    latest: (limit?: number) => [...queryKeys.news.all, 'latest', { limit }] as const,
    featured: (limit?: number) => [...queryKeys.news.all, 'featured', { limit }] as const,
    published: (limit?: number) => [...queryKeys.news.all, 'published', { limit }] as const,
    details: () => [...queryKeys.news.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.news.details(), slug] as const,
    byCategory: (categoryId: string, limit?: number) => [...queryKeys.news.all, 'byCategory', categoryId, { limit }] as const,
    byArtist: (artistId: string, limit?: number) => [...queryKeys.news.all, 'byArtist', artistId, { limit }] as const,
  },

  // Artists
  artists: {
    all: ['artists'] as const,
    lists: () => [...queryKeys.artists.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.artists.lists(), filters] as const,
    featured: (countryId?: string) => [...queryKeys.artists.all, 'featured', { countryId }] as const,
    details: () => [...queryKeys.artists.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.artists.details(), slug] as const,
    search: (query: string) => [...queryKeys.artists.all, 'search', query] as const,
    favorites: (userId: string) => [...queryKeys.artists.all, 'favorites', userId] as const,
  },

  // Setlists
  setlists: {
    all: ['setlists'] as const,
    byConcert: (concertId: string) => [...queryKeys.setlists.all, 'concert', concertId] as const,
    withConcerts: (status?: string, limit?: number) => [...queryKeys.setlists.all, 'withConcerts', { status, limit }] as const,
    pendingContributions: () => [...queryKeys.setlists.all, 'pending'] as const,
    pendingCount: () => [...queryKeys.setlists.all, 'pendingCount'] as const,
  },

  // Geography
  geography: {
    countries: {
      all: ['countries'] as const,
      list: () => [...queryKeys.geography.countries.all, 'list'] as const,
      options: () => [...queryKeys.geography.countries.all, 'options'] as const,
      detail: (id: string) => [...queryKeys.geography.countries.all, 'detail', id] as const,
      byIsoCode: (isoCode: string) => [...queryKeys.geography.countries.all, 'iso', isoCode] as const,
    },
    cities: {
      all: ['cities'] as const,
      list: () => [...queryKeys.geography.cities.all, 'list'] as const,
      byCountry: (countryId: string) => [...queryKeys.geography.cities.all, 'country', countryId] as const,
      detail: (id: string) => [...queryKeys.geography.cities.all, 'detail', id] as const,
      bySlug: (slug: string) => [...queryKeys.geography.cities.all, 'slug', slug] as const,
      search: (query: string) => [...queryKeys.geography.cities.all, 'search', query] as const,
    },
    userCountry: () => ['userCountry'] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },

  // Venues
  venues: {
    all: ['venues'] as const,
    list: () => [...queryKeys.venues.all, 'list'] as const,
    detail: (slug: string) => [...queryKeys.venues.all, 'detail', slug] as const,
  },

  // Promoters
  promoters: {
    all: ['promoters'] as const,
    list: () => [...queryKeys.promoters.all, 'list'] as const,
    byCountry: (countryId: string) => [...queryKeys.promoters.all, 'country', countryId] as const,
  },

  // Media
  media: {
    all: ['media'] as const,
    videos: {
      all: () => [...queryKeys.media.all, 'videos'] as const,
      featured: (limit?: number) => [...queryKeys.media.all, 'videos', 'featured', { limit }] as const,
    },
    photos: {
      all: () => [...queryKeys.media.all, 'photos'] as const,
      featured: (limit?: number | string) => [...queryKeys.media.all, 'photos', 'featured', { limit }] as const,
    },
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    list: (limit?: number) => [...queryKeys.announcements.all, 'list', { limit }] as const,
  },

  // User-related
  user: {
    favorites: {
      concerts: (userId: string) => ['user', userId, 'favorites', 'concerts'] as const,
      artists: (userId: string) => ['user', userId, 'favorites', 'artists'] as const,
    },
  },
} as const;

// Type helper to extract query key types
export type QueryKeys = typeof queryKeys;
