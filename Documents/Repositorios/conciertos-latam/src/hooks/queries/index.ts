/**
 * Query Hooks Index
 * 
 * Re-exports all React Query hooks for convenient importing.
 * 
 * Usage:
 * import { useLatestNews, useConcerts, queryKeys } from '@/hooks/queries';
 */

// Query Keys
export { queryKeys } from './queryKeys';
export type { QueryKeys } from './queryKeys';

// Concert Hooks
export {
  useConcerts,
  useUpcomingConcerts,
  usePastConcerts,
  useFeaturedConcerts,
  useConcertBySlug,
  useConcertsByArtist,
  useConcertFavorite,
} from './useConcerts';

// Concert Page Hook (specialized for listing page)
export { useConcertsPage } from './useConcertsPage';
export type { ConcertPageFilters, ConcertPageItem } from './useConcertsPage';

// News Hooks
export {
  useNews,
  useLatestNews,
  usePublishedNews,
  useFeaturedNews,
  useNewsBySlug,
  useNewsByCategory,
  useNewsByArtist,
} from './useNews';

// Artist Hooks
export {
  useArtists,
  useArtistBySlug,
  useFeaturedArtistsByCountry,
  useArtistSearch,
  useUserFavoriteArtists,
  useAllGenres,
} from './useArtists';

// Genre Hooks
export { useMainGenres, useSpotifyGenresForMainGenre } from './useGenres';

// Setlist Hooks
export {
  useSetlistByConcert,
  useAllSetlistSongsByConcert,
  useSetlistsWithConcerts,
  usePendingSetlistContributions,
  usePendingSetlistCount,
} from './useSetlists';

// Geography Hooks
export {
  useCountries,
  useCountryOptions,
  useCountryById,
  useCountryByIsoCode,
  useUserCountry,
  useCities,
  useCitiesByCountry,
  useCityById,
  useCityBySlug,
  useCitySearch,
} from './useGeography';

// Media Hooks
export {
  useFeaturedVideos,
  useFeaturedPhotos,
} from './useMedia';

// Announcements Hooks
export { useAnnouncements } from './useAnnouncements';

// Blog Page Hooks
export { useBlogArticles, useBlogCategories } from './useBlog';
export type { BlogArticle, BlogCategory } from './useBlog';

// Setlists Page Hooks
export { useSetlistsPage } from './useSetlistsPage';
export type { ConcertWithSetlist } from './useSetlistsPage';

// Setlist Detail Hooks
export { useSetlistConcert, useSetlistSongs, useContributeToSetlist } from './useSetlistDetail';
export type { SetlistSong, SetlistConcert } from './useSetlistDetail';

// Promoters Page Hooks
export { usePromotersPage, usePromoterConcerts } from './usePromotersPage';
export type { PromoterWithCountry, PromoterConcert } from './usePromotersPage';

// Artist Detail Hooks
export { useArtistDetail, useArtistConcerts, useArtistNews, useArtistSpotifyTracks } from './useArtistDetail';
export type { ArtistDetail, ArtistConcert, ArtistNewsArticle } from './useArtistDetail';

// Concert Detail Hooks
export { useConcertDetail } from './useConcertDetail';
export type { ConcertDetail, ConcertSetlistSong } from './useConcertDetail';

// Festival Detail Hooks
export { useFestivalDetail } from './useFestivalDetail';
export type { FestivalDetail, FestivalLineupArtist } from './useFestivalDetail';

// Profile Hooks
export { useUserProfile, useProfileCountries, useProfileCities, useProfileArtists, useUpdateProfile } from './useProfile';
export type { UserProfile } from './useProfile';

// My Calendar Hooks
export { useMyCalendarConcerts } from './useMyCalendar';
export type { CalendarConcert } from './useMyCalendar';

// Mutations
export {
  // Concert mutations
  useCreateConcert,
  useUpdateConcert,
  useDeleteConcert,
  useToggleConcertFavorite,
  // News mutations
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
  usePublishNews,
  // Artist mutations
  useToggleArtistFavorite,
  // Setlist mutations
  useContributeSetlistSong,
  useApproveSetlistContribution,
  useRejectSetlistContribution,
  useDeleteSetlistSong,
} from './mutations';

// Admin Hooks (for admin panel CRUD operations)
export {
  useAdminArtists,
  useAdminArtist,
  useCreateArtist,
  useUpdateArtist,
  useDeleteArtist,
} from './useAdminArtists';

export {
  useAdminConcerts,
  useAdminConcert,
  useCreateConcert as useAdminCreateConcert,
  useUpdateConcert as useAdminUpdateConcert,
  useDeleteConcert as useAdminDeleteConcert,
  useToggleFeaturedConcert,
} from './useAdminConcerts';

export {
  useAdminVenues,
  useAdminVenue,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
} from './useAdminVenues';

export {
  useAdminNews,
  useAdminNewsArticle,
  useCreateNewsArticle,
  useUpdateNewsArticle,
  useDeleteNewsArticle,
  usePublishNewsArticle,
  useArchiveNewsArticle,
} from './useAdminNews';

export {
  useAdminPromoters,
  useAdminPromoter,
  useCreatePromoter,
  useUpdatePromoter,
  useDeletePromoter,
} from './useAdminPromoters';
