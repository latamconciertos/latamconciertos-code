/**
 * SEOHead Component
 * 
 * Renders SEO meta tags dynamically for each page.
 */

import { useEffect } from 'react';
import { SEO_CONFIG } from '@/lib/seo';

interface SEOHeadProps {
    title: string;
    description: string;
    image?: string;
    url: string;
    type?: 'website' | 'article';
    keywords?: string[];
    noindex?: boolean;
}

export const SEOHead = ({
    title,
    description,
    image = SEO_CONFIG.defaultImage,
    url,
    type = 'website',
    keywords = [],
    noindex = false,
}: SEOHeadProps) => {
    const fullTitle = `${title} | ${SEO_CONFIG.siteName}`;
    const fullUrl = `${SEO_CONFIG.siteUrl}${url}`;
    const fullImage = image.startsWith('http') ? image : `${SEO_CONFIG.siteUrl}${image}`;

    useEffect(() => {
        // Update document title
        document.title = fullTitle;

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }

            meta.setAttribute('content', content);
        };

        // Basic Meta Tags
        updateMetaTag('description', description);
        if (keywords.length > 0) {
            updateMetaTag('keywords', keywords.join(', '));
        }
        if (noindex) {
            updateMetaTag('robots', 'noindex, nofollow');
        }

        // OpenGraph Tags
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:image', fullImage, true);
        updateMetaTag('og:url', fullUrl, true);
        updateMetaTag('og:type', type, true);
        updateMetaTag('og:site_name', SEO_CONFIG.siteName, true);

        // Twitter Card Tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', fullImage);
        if (SEO_CONFIG.twitterHandle) {
            updateMetaTag('twitter:site', SEO_CONFIG.twitterHandle);
        }

        // Canonical Link
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = fullUrl;
    }, [fullTitle, description, fullImage, fullUrl, type, keywords, noindex]);

    return null;
};
