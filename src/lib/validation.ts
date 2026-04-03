import { z } from 'zod';

/**
 * Authentication validation schemas
 */
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'El email no puede exceder 255 caracteres' });

export const passwordSchema = z
  .string()
  .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  .max(72, { message: 'La contraseña no puede exceder 72 caracteres' });

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Profile validation schemas
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  .max(50, { message: 'El nombre de usuario no puede exceder 50 caracteres' })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
  })
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .trim()
  .max(100, { message: 'El nombre no puede exceder 100 caracteres' })
  .optional()
  .or(z.literal(''));

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida' })
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    return birthDate >= minDate && birthDate <= maxDate;
  }, { message: 'Debes tener al menos 13 años' })
  .optional()
  .or(z.literal(''));

export const profileSchema = z.object({
  username: usernameSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  birth_date: birthDateSchema,
  country_id: z.string().uuid().optional().or(z.literal('')).nullable(),
  city_id: z.string().uuid().optional().or(z.literal('')).nullable(),
});

/**
 * Advertising request validation schemas
 */
export const companyNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre de la empresa es requerido' })
  .max(200, { message: 'El nombre de la empresa no puede exceder 200 caracteres' });

export const contactNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre de contacto es requerido' })
  .max(100, { message: 'El nombre de contacto no puede exceder 100 caracteres' });

export const phoneSchema = z
  .string()
  .trim()
  .max(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  .regex(/^[0-9+\-\s()]*$/, { message: 'Teléfono inválido' })
  .optional()
  .or(z.literal(''));

export const websiteSchema = z
  .string()
  .trim()
  .max(500, { message: 'La URL no puede exceder 500 caracteres' })
  .url({ message: 'URL inválida' })
  .optional()
  .or(z.literal(''));

export const adTypeSchema = z
  .string()
  .min(1, { message: 'Debes seleccionar un tipo de publicidad' });

export const messageSchema = z
  .string()
  .trim()
  .max(2000, { message: 'El mensaje no puede exceder 2000 caracteres' })
  .optional()
  .or(z.literal(''));

export const advertisingSchema = z.object({
  company_name: companyNameSchema,
  contact_name: contactNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: websiteSchema,
  ad_type: adTypeSchema,
  budget_range: z.string().optional(),
  campaign_duration: z.string().optional(),
  target_audience: z.string().trim().max(500).optional().or(z.literal('')),
  message: messageSchema,
});

/**
 * ============================================
 * ADMIN FORM VALIDATION SCHEMAS
 * ============================================
 */

/**
 * Slug validation - reusable for all entities
 */
export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones'
  })
  .max(200, { message: 'El slug no puede exceder 200 caracteres' })
  .optional()
  .or(z.literal(''));

/**
 * URL validation - reusable
 */
export const urlOptionalSchema = z
  .string()
  .trim()
  .max(2000, { message: 'La URL no puede exceder 2000 caracteres' })
  .url({ message: 'URL inválida' })
  .optional()
  .or(z.literal(''));

/**
 * Artist validation schema
 */
export const artistNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre del artista es requerido' })
  .max(200, { message: 'El nombre no puede exceder 200 caracteres' });

export const artistBioSchema = z
  .string()
  .trim()
  .max(10000, { message: 'La biografía no puede exceder 10000 caracteres' })
  .optional()
  .or(z.literal(''));

export const socialLinksSchema = z.record(z.string()).optional().nullable();

export const artistSchema = z.object({
  name: artistNameSchema,
  slug: slugSchema,
  bio: artistBioSchema,
  photo_url: urlOptionalSchema,
  social_links: z.any().optional().nullable(),
  genres: z.array(z.string()).optional().nullable(),
}).passthrough();

/**
 * Venue validation schema
 */
export const venueNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre del venue es requerido' })
  .max(300, { message: 'El nombre no puede exceder 300 caracteres' });

export const venueCapacitySchema = z
  .number()
  .int({ message: 'La capacidad debe ser un número entero' })
  .min(1, { message: 'La capacidad mínima es 1' })
  .max(500000, { message: 'La capacidad no puede exceder 500,000' })
  .optional()
  .nullable();

export const venueSchema = z.object({
  name: venueNameSchema,
  slug: slugSchema,
  location: z.string().trim().max(500).optional().or(z.literal('')),
  city_id: z.string().uuid({ message: 'Ciudad inválida' }).optional().nullable(),
  country: z.string().trim().max(100).optional().or(z.literal('')),
  capacity: venueCapacitySchema,
  website: urlOptionalSchema,
});

/**
 * Concert validation schema
 */
export const concertTitleSchema = z
  .string()
  .trim()
  .min(1, { message: 'El título del concierto es requerido' })
  .max(300, { message: 'El título no puede exceder 300 caracteres' });

export const concertDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, { message: 'Fecha inválida' })
  .optional()
  .or(z.literal(''));

export const eventTypeSchema = z.enum(['concert', 'festival', 'tour'], {
  errorMap: () => ({ message: 'Tipo de evento inválido' }),
});

export const concertSchema = z.object({
  title: concertTitleSchema,
  slug: slugSchema,
  date: concertDateSchema,
  artist_id: z.string().uuid({ message: 'Artista inválido' }).optional().nullable(),
  venue_id: z.string().uuid({ message: 'Venue inválido' }).optional().nullable(),
  promoter_id: z.string().uuid({ message: 'Promotor inválido' }).optional().nullable(),
  event_type: eventTypeSchema,
  description: z.string().trim().max(10000).optional().or(z.literal('')),
  image_url: urlOptionalSchema,
  ticket_url: urlOptionalSchema,
  is_featured: z.boolean().optional(),
});

/**
 * News article validation schema
 */
export const newsTitleSchema = z
  .string()
  .trim()
  .min(1, { message: 'El título es requerido' })
  .max(300, { message: 'El título no puede exceder 300 caracteres' });

export const newsContentSchema = z
  .string()
  .trim()
  .min(100, { message: 'El contenido debe tener al menos 100 caracteres' })
  .max(100000, { message: 'El contenido no puede exceder 100,000 caracteres' });

export const metaDescriptionSchema = z
  .string()
  .trim()
  .min(50, { message: 'La meta descripción debe tener al menos 50 caracteres' })
  .max(160, { message: 'La meta descripción no puede exceder 160 caracteres' })
  .optional()
  .or(z.literal(''));

export const metaTitleSchema = z
  .string()
  .trim()
  .max(60, { message: 'El meta título no puede exceder 60 caracteres' })
  .optional()
  .or(z.literal(''));

export const keywordsSchema = z
  .string()
  .trim()
  .max(500, { message: 'Las palabras clave no pueden exceder 500 caracteres' })
  .optional()
  .or(z.literal(''));

export const articleStatusSchema = z.enum(['draft', 'published', 'archived'], {
  errorMap: () => ({ message: 'Estado inválido' }),
});

export const newsArticleSchema = z.object({
  title: newsTitleSchema,
  slug: slugSchema,
  content: newsContentSchema,
  featured_image: urlOptionalSchema,
  photo_credit: z.string().trim().max(200).optional().or(z.literal('')),
  meta_title: metaTitleSchema,
  meta_description: metaDescriptionSchema,
  keywords: keywordsSchema,
  category_id: z.string().uuid({ message: 'Categoría inválida' }).optional().nullable(),
  artist_id: z.string().uuid({ message: 'Artista inválido' }).optional().nullable(),
  concert_id: z.string().uuid({ message: 'Concierto inválido' }).optional().nullable(),
  status: articleStatusSchema,
  tags: z.array(z.string()).optional(),
});

/**
 * Promoter validation schema
 */
export const promoterNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre del promotor es requerido' })
  .max(200, { message: 'El nombre no puede exceder 200 caracteres' });

export const promoterSchema = z.object({
  name: promoterNameSchema,
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  website: urlOptionalSchema,
  country_id: z.string().uuid({ message: 'País inválido' }).optional().nullable(),
});

/**
 * Setlist song validation schema
 */
export const songNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre de la canción es requerido' })
  .max(300, { message: 'El nombre no puede exceder 300 caracteres' });

export const setlistSongSchema = z.object({
  song_name: songNameSchema,
  artist_name: z.string().trim().max(200).optional().or(z.literal('')),
  position: z.number().int().min(1).max(500),
  duration_seconds: z.number().int().min(0).max(7200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  spotify_url: urlOptionalSchema,
  spotify_track_id: z.string().max(100).optional().or(z.literal('')),
  is_official: z.boolean().optional(),
});

/**
 * Category validation schema
 */
export const categorySchema = z.object({
  name: z.string().trim().min(1, { message: 'El nombre es requerido' }).max(100),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

/**
 * Media item validation schema
 */
export const mediaTypeSchema = z.enum(['video', 'photo', 'audio'], {
  errorMap: () => ({ message: 'Tipo de media inválido' }),
});

export const mediaItemSchema = z.object({
  title: z.string().trim().min(1, { message: 'El título es requerido' }).max(300),
  type: mediaTypeSchema,
  media_url: urlOptionalSchema,
  embed_code: z.string().max(5000).optional().or(z.literal('')),
  thumbnail_url: urlOptionalSchema,
  summary: z.string().trim().max(1000).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

/**
 * Type exports for convenience
 */
export type AuthInput = z.infer<typeof authSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AdvertisingInput = z.infer<typeof advertisingSchema>;

// Admin form types
export type ArtistInput = z.infer<typeof artistSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type ConcertInput = z.infer<typeof concertSchema>;
export type NewsArticleInput = z.infer<typeof newsArticleSchema>;
export type PromoterInput = z.infer<typeof promoterSchema>;
export type SetlistSongInput = z.infer<typeof setlistSongSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MediaItemInput = z.infer<typeof mediaItemSchema>;

/**
 * Festival validation schema
 */
export const festivalNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'El nombre del festival es requerido' })
  .max(300, { message: 'El nombre no puede exceder 300 caracteres' });

export const festivalSchema = z.object({
  name: festivalNameSchema,
  slug: slugSchema,
  description: z.string().trim().max(10000).optional().or(z.literal('')),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido' }),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido' }).optional().or(z.literal('')),
  venue_id: z.string().uuid({ message: 'Venue inválido' }).optional().nullable(),
  promoter_id: z.string().uuid({ message: 'Promotor inválido' }).optional().nullable(),
  image_url: urlOptionalSchema,
  ticket_url: urlOptionalSchema,
  edition: z.number().int().min(1).max(9999, { message: 'La edición debe ser menor a 9999' }).optional().nullable(),
  is_featured: z.boolean().optional(),
});

export const festivalLineupSchema = z.object({
  festival_id: z.string().uuid(),
  artist_id: z.string().uuid(),
  performance_date: z.string().optional().or(z.literal('')),
  stage: z.string().max(100).optional().or(z.literal('')),
  position: z.number().int().min(0),
});

export type FestivalInput = z.infer<typeof festivalSchema>;
export type FestivalLineupInput = z.infer<typeof festivalLineupSchema>;
