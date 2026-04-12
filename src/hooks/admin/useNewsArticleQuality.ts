/**
 * News article quality analysis
 *
 * Pure derivation hook — given the current form values, returns a structured
 * report of issues, warnings and computed metrics so the editor can show a
 * quality panel and gate the publish action.
 */

import { useMemo } from 'react';
import { isValidSlug } from '@/lib/slugify';
import type { NewsArticleFormValues } from '@/components/admin/news/newsFormSchema';

export const QUALITY_THRESHOLDS = {
  minWords: 300,
  metaDescriptionMin: 120,
  metaDescriptionMax: 160,
  minKeywords: 3,
} as const;

export interface NewsArticleQualityReport {
  issues: string[];
  warnings: string[];
  wordCount: number;
  metaDescLength: number;
  keywordCount: number;
  hasFeaturedImage: boolean;
  hasCategory: boolean;
  hasAuthor: boolean;
  isValid: boolean;
}

const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const useNewsArticleQuality = (
  values: NewsArticleFormValues,
): NewsArticleQualityReport => {
  return useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    const textContent = stripHtml(values.content || '');
    const wordCount = textContent.length
      ? textContent.split(/\s+/).filter((w) => w.length > 0).length
      : 0;

    if (wordCount < QUALITY_THRESHOLDS.minWords) {
      issues.push(
        `Contenido muy corto (${wordCount} palabras). Mínimo recomendado: ${QUALITY_THRESHOLDS.minWords} palabras.`,
      );
    }

    const metaDescLength = values.meta_description?.length ?? 0;
    if (metaDescLength < QUALITY_THRESHOLDS.metaDescriptionMin) {
      issues.push(
        `Meta descripción muy corta (mínimo ${QUALITY_THRESHOLDS.metaDescriptionMin} caracteres)`,
      );
    } else if (metaDescLength > QUALITY_THRESHOLDS.metaDescriptionMax) {
      warnings.push(
        `Meta descripción muy larga (máximo ${QUALITY_THRESHOLDS.metaDescriptionMax} caracteres recomendado)`,
      );
    }

    const hasFeaturedImage = Boolean(values.featured_image);
    if (!hasFeaturedImage) {
      issues.push('Imagen destacada requerida para SEO');
    }

    const keywordCount = values.keywords
      ? values.keywords.split(',').filter((k) => k.trim().length > 0).length
      : 0;
    if (keywordCount < QUALITY_THRESHOLDS.minKeywords) {
      warnings.push(
        `Agrega al menos ${QUALITY_THRESHOLDS.minKeywords} keywords para mejor SEO`,
      );
    }

    const hasCategory = Boolean(values.category_id);
    if (!hasCategory) {
      issues.push('Categoría requerida');
    }

    const hasAuthor = Boolean(values.author_id);
    if (!hasAuthor && values.status === 'published') {
      issues.push('Autor requerido para artículos publicados');
    }

    if (values.slug && !isValidSlug(values.slug)) {
      issues.push(
        'El slug contiene caracteres inválidos. Solo se permiten letras minúsculas, números y guiones.',
      );
    }

    return {
      issues,
      warnings,
      wordCount,
      metaDescLength,
      keywordCount,
      hasFeaturedImage,
      hasCategory,
      hasAuthor,
      isValid: issues.length === 0,
    };
  }, [values]);
};
