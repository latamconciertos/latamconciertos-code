/**
 * News article editor — schema, types and DB mapping helpers.
 *
 * Uses a permissive schema so drafts can be saved with incomplete fields. The
 * stricter publish-time gating lives in `useNewsArticleQuality` so the user
 * gets actionable feedback in the sidebar instead of form errors.
 */

import { z } from 'zod';
import { isValidSlug, slugify } from '@/lib/slugify';
import type {
  NewsArticle,
  NewsArticleInsert,
  NewsArticleUpdate,
  NewsMedia,
} from '@/types/entities';

export const NONE_VALUE = 'none';

export const newsArticleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'El título es requerido' })
    .max(300, { message: 'El título no puede exceder 300 caracteres' }),
  slug: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || isValidSlug(v), {
      message: 'Solo letras minúsculas, números y guiones',
    })
    .optional()
    .default(''),
  content: z.string().max(100_000).optional().default(''),
  meta_title: z
    .string()
    .trim()
    .max(60, { message: 'Máximo 60 caracteres' })
    .optional()
    .default(''),
  meta_description: z
    .string()
    .trim()
    .max(200, { message: 'Máximo 200 caracteres' })
    .optional()
    .default(''),
  keywords: z.string().trim().max(500).optional().default(''),
  featured_image: z.string().trim().optional().default(''),
  featured_image_mobile: z.string().trim().optional().default(''),
  photo_credit: z.string().trim().max(200).optional().default(''),
  status: z.enum(['draft', 'published', 'archived']),
  category_id: z.string().optional().default(''),
  artist_id: z.string().optional().default(NONE_VALUE),
  author_id: z.string().optional().default(''),
  concert_id: z.string().optional().default(NONE_VALUE),
  published_at: z.string().optional().default(''),
});

export type NewsArticleFormValues = z.infer<typeof newsArticleFormSchema>;

export interface MediaFormItem {
  id?: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string | null;
  position: number;
}

export const newsFormDefaults: NewsArticleFormValues = {
  title: '',
  slug: '',
  content: '',
  meta_title: '',
  meta_description: '',
  keywords: '',
  featured_image: '',
  featured_image_mobile: '',
  photo_credit: '',
  status: 'draft',
  category_id: '',
  artist_id: NONE_VALUE,
  author_id: '',
  concert_id: NONE_VALUE,
  published_at: '',
};

const nullable = (value: string): string | null =>
  value && value.trim().length > 0 ? value : null;

const relationId = (value: string): string | null =>
  value && value !== NONE_VALUE ? value : null;

/**
 * Map an existing article into form values for editing. Falls back to defaults
 * for any missing field.
 */
export const articleToFormValues = (article: NewsArticle): NewsArticleFormValues => {
  const withMobile = article as NewsArticle & { featured_image_mobile?: string | null };

  return {
    title: article.title ?? '',
    slug: article.slug ?? '',
    content: article.content ?? '',
    meta_title: article.meta_title ?? '',
    meta_description: article.meta_description ?? '',
    keywords: article.keywords ?? '',
    featured_image: article.featured_image ?? '',
    featured_image_mobile: withMobile.featured_image_mobile ?? '',
    photo_credit: article.photo_credit ?? '',
    status: (article.status as NewsArticleFormValues['status']) ?? 'draft',
    category_id: article.category_id ?? '',
    artist_id: article.artist_id ?? NONE_VALUE,
    author_id: article.author_id ?? '',
    concert_id: (article as NewsArticle & { concert_id?: string | null }).concert_id ?? NONE_VALUE,
    published_at: article.published_at ?? '',
  };
};

/**
 * Convert form values into an `Insert`/`Update` payload that the news service
 * accepts. Empty strings become `null`, NONE relations become `null`, and the
 * `published_at` timestamp is normalised.
 */
export const formValuesToDbPayload = (
  values: NewsArticleFormValues,
  options: { isCreate: boolean; existingPublishedAt?: string | null },
): NewsArticleInsert | NewsArticleUpdate => {
  const slug = values.slug?.trim() || slugify(values.title);

  let publishedAt: string | null = null;
  if (values.status === 'published') {
    if (values.published_at) {
      publishedAt = values.published_at;
    } else if (options.isCreate || !options.existingPublishedAt) {
      publishedAt = new Date().toISOString();
    } else {
      publishedAt = options.existingPublishedAt;
    }
  }

  const payload = {
    title: values.title,
    slug,
    content: nullable(values.content),
    meta_title: nullable(values.meta_title),
    meta_description: nullable(values.meta_description),
    keywords: nullable(values.keywords),
    featured_image: nullable(values.featured_image),
    featured_image_mobile: nullable(values.featured_image_mobile),
    photo_credit: nullable(values.photo_credit),
    status: values.status,
    category_id: nullable(values.category_id),
    artist_id: relationId(values.artist_id),
    author_id: nullable(values.author_id),
    concert_id: relationId(values.concert_id),
    published_at: publishedAt,
  };

  return payload as unknown as NewsArticleInsert | NewsArticleUpdate;
};

export const mediaListFromArticle = (media: NewsMedia[] | undefined): MediaFormItem[] =>
  (media ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => ({
      id: item.id,
      media_type: (item.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
      media_url: item.media_url,
      caption: item.caption,
      position: item.position ?? 0,
    }));
