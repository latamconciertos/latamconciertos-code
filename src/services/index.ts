/**
 * Services Index
 * 
 * Central export point for all services.
 * Import from here for consistent access to all service classes.
 * 
 * @example
 * import { concertService, artistService } from '@/services';
 * 
 * const concerts = await concertService.getUpcoming(10);
 * const artist = await artistService.getBySlug('bad-bunny');
 */

// Base utilities
export * from './base';

// Domain services
export { concertService, type ConcertFilterOptions } from './concertService';
export { artistService, type ArtistFilterOptions } from './artistService';
export { venueService, type VenueFilterOptions } from './venueService';
export { newsService, type NewsFilterOptions } from './newsService';
export { setlistService } from './setlistService';
export { promoterService, type PromoterFilterOptions } from './promoterService';
export { userService } from './userService';
export { mediaService, type MediaFilterOptions } from './mediaService';
export { geographyService } from './geographyService';
export { categoryService } from './categoryService';
