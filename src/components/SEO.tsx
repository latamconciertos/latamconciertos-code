import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'music.song' | 'music.album';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    authorUrl?: string;
    section?: string;
    tags?: string[];
  };
  structuredData?: object;
  language?: string;
}

export const SEO = ({
  title = 'Conciertos Latam - Tu guía de música en vivo',
  description = 'Descubre los mejores conciertos y eventos musicales de América Latina. Noticias, entrevistas y toda la información sobre tus artistas favoritos.',
  keywords = 'conciertos, música en vivo, eventos musicales, América Latina, entradas, shows',
  image = 'https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png',
  url,
  type = 'website',
  article,
  structuredData,
  language = 'es',
}: SEOProps) => {
  const siteUrl = 'https://www.conciertoslatam.app';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title.includes('Conciertos Latam') ? title : `${title} | Conciertos Latam`;
  
  // Enhanced breadcrumb structured data
  const breadcrumbData = url && url !== '/' ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": title,
        "item": fullUrl
      }
    ]
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={article?.author || 'Conciertos Latam'} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <link rel="canonical" href={fullUrl} />
      
      {/* Google News specific tags */}
      {type === 'article' && article && (
        <>
          <meta name="news_keywords" content={keywords} />
          <meta name="standout" content={fullUrl} />
          <meta name="syndication-source" content={fullUrl} />
          <meta name="original-source" content={fullUrl} />
          {article.publishedTime && (
            <meta name="article.published" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta name="article.updated" content={article.modifiedTime} />
          )}
        </>
      )}

      {/* Open Graph - Enhanced for better social sharing */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Conciertos Latam" />
      <meta property="og:locale" content="es_LA" />
      <meta property="og:locale:alternate" content="es_MX" />
      <meta property="og:locale:alternate" content="es_AR" />
      <meta property="og:locale:alternate" content="es_CO" />
      {article?.modifiedTime && (
        <meta property="og:updated_time" content={article.modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@conciertoslatam" />
      <meta name="twitter:creator" content="@conciertoslatam" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Article specific meta tags */}
      {article && (
        <>
          {article.publishedTime && (
            <>
              <meta property="article:published_time" content={article.publishedTime} />
              <meta name="publish_date" content={article.publishedTime} />
            </>
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <>
              <meta property="article:author" content={article.author} />
              <meta name="author" content={article.author} />
              {article.authorUrl && (
                <link rel="author" href={article.authorUrl} />
              )}
            </>
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
          <meta property="article:publisher" content="https://www.conciertoslatam.app" />
        </>
      )}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Breadcrumb Structured Data */}
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}

      {/* Google News Publisher Center - Subscribe with Google Basic */}
      {type === 'article' && (
        <>
          <script 
            async 
            type="application/javascript"
            src="https://news.google.com/swg/js/v1/swg-basic.js"
          />
          <script type="application/javascript">
            {`
              (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
                basicSubscriptions.init({
                  type: "NewsArticle",
                  isPartOfType: ["Product"],
                  isPartOfProductId: "CAowtoPeCw:openaccess",
                  clientOptions: { theme: "light", lang: "es-419" },
                });
              });
            `}
          </script>
        </>
      )}
    </Helmet>
  );
};
