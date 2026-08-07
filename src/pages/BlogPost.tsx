import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatDisplayDate } from '@/lib/timezone';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdSenseUnit } from '@/components/ads/AdSenseUnit';
import { AD_SLOTS } from '@/lib/adsense';
import { parseContentWithMedia } from '@/lib/contentParser';
import { SocialShare } from '@/components/SocialShare';
import { sanitizeHTML } from '@/lib/sanitize';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string;
  position: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  featured_image: string | null;
  featured_image_mobile?: string | null;
  photo_credit: string | null;
  published_at: string;
  updated_at?: string | null;
  meta_description: string | null;
  meta_title?: string | null;
  keywords?: string | null;
  tags?: unknown;
  artist_id: string | null;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  categories: {
    name: string;
    slug: string;
  } | null;
  profiles?: {
    username: string | null;
  } | null;
  media_items?: MediaItem[];
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data: articleData, error: articleError } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          slug,
          content,
          featured_image,
          featured_image_mobile,
          photo_credit,
          published_at,
          updated_at,
          meta_description,
          meta_title,
          keywords,
          tags,
          category_id,
          artist_id,
          artists (name, photo_url),
          categories:category_id (
            name,
            slug
          )
        `)
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();

      if (articleError) throw articleError;

      // Fetch media items for this article
      const { data: mediaData } = await supabase
        .from('news_media')
        .select('*')
        .eq('article_id', articleData.id)
        .order('position', { ascending: true });

      setArticle({
        ...articleData as any,
        media_items: (mediaData || []).map(item => ({
          id: item.id,
          media_type: item.media_type as 'image' | 'video',
          media_url: item.media_url,
          caption: item.caption,
          position: item.position
        }))
      });

      // Fetch related articles
      if (articleData?.category_id) {
        const { data: relatedData } = await supabase
          .from('news_articles')
          .select(`
            id,
            title,
            slug,
            featured_image,
            photo_credit,
            published_at,
            meta_description,
            artist_id,
            artists (name, photo_url),
            categories:category_id (
              name,
              slug
            )
          `)
          .eq('status', 'published')
          .eq('category_id', articleData.category_id)
          .neq('id', articleData.id)
          .order('published_at', { ascending: false })
          .limit(3);

        if (relatedData) {
          setRelatedArticles(relatedData as any);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString);
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop';
  };

  const getArticleImage = (article: Article) => {
    if (article.featured_image) return article.featured_image;
    if (article.artists?.photo_url) return article.artists.photo_url;
    return getDefaultImage();
  };

  const getReadingTime = (content: string | null) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const stripHtml = (html: string | null | undefined) =>
    (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const getWordCount = (content: string | null) => {
    const plain = stripHtml(content);
    return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  };

  const getArticleTags = (a: Article): string[] => {
    if (Array.isArray(a.tags)) return a.tags.filter((t): t is string => typeof t === 'string');
    if (a.keywords) return a.keywords.split(',').map((s) => s.trim()).filter(Boolean);
    if (a.categories) return [a.categories.name];
    return [];
  };

  if (loading) {
    return (
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
          <LoadingSpinnerInline message="Cargando artículo..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 text-center">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.01em] mb-6">Artículo no encontrado</h1>
          <Link to="/blog" className="btn-nocturno-secundario">
            <ArrowLeft className="h-4 w-4" />
            Volver a noticias
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const SITE_URL = 'https://www.conciertoslatam.com';
  const LOGO_URL =
    'https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png';
  const articleUrl = `${SITE_URL}/blog/${article.slug}`;
  const plainContent = stripHtml(article.content);
  const articleDescription =
    article.meta_description || (plainContent ? plainContent.slice(0, 160) : article.title);
  const articleTags = getArticleTags(article);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": articleDescription,
    "image": [getArticleImage(article)],
    "datePublished": article.published_at,
    "dateModified": article.updated_at || article.published_at,
    "author": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
        "width": 600,
        "height": 60
      },
      "url": SITE_URL
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "articleBody": plainContent || articleDescription,
    "articleSection": article.categories?.name || "Música",
    "wordCount": getWordCount(article.content),
    "inLanguage": "es-419",
    "isAccessibleForFree": true,
    "keywords": articleTags.length ? articleTags : ["música", "conciertos", "América Latina"]
  };

  return (
    <>
      <SEO
        title={article.meta_title || article.title}
        description={articleDescription}
        keywords={articleTags.join(', ') || `${article.categories?.name || 'música'}, conciertos, América Latina`}
        image={getArticleImage(article)}
        url={`/blog/${article.slug}`}
        type="article"
        article={{
          publishedTime: article.published_at,
          modifiedTime: article.updated_at || article.published_at,
          author: 'Conciertos Latam',
          authorUrl: SITE_URL,
          section: article.categories?.name,
          tags: articleTags.length ? articleTags : article.categories ? [article.categories.name] : []
        }}
        structuredData={structuredData}
      />
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        {/* Hero — Editorial text-first (Rolling Stone / Billboard / RS Latam pattern) */}
        <section className="pt-20 md:pt-28 pb-8 md:pb-14 border-b border-linea">
          <div className="container mx-auto max-w-4xl px-4 md:px-8">
            {/* Back link */}
            <div className="mb-3 md:mb-6">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Noticias</span>
              </Link>
            </div>

            {/* Eyebrow — chip de categoría en verde */}
            {article.categories && (
              <div className="mb-3 md:mb-6 text-center">
                <Link
                  to={`/blog?category=${article.categories.slug}`}
                  className="inline-flex items-center rounded-full border border-verde/30 bg-superficie px-3.5 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-verde hover:border-verde/60 transition-colors"
                >
                  {article.categories.name}
                </Link>
              </div>
            )}

            {/* Headline */}
            <h1 className="font-display uppercase text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.01em] leading-[0.95] text-foreground text-balance mb-4 md:mb-6">
              {article.title}
            </h1>

            {/* Deck / Subtitle */}
            {article.meta_description && (
              <p className="text-center text-base md:text-xl text-muted-foreground font-normal leading-relaxed max-w-2xl mx-auto mb-6 md:mb-10">
                {article.meta_description}
              </p>
            )}

            {/* Byline */}
            <div className="flex flex-wrap justify-center items-center gap-x-2.5 md:gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
              <span>
                Por <span className="font-semibold text-foreground">Conciertos Latam</span>
              </span>
              <span className="text-muted-foreground/40">·</span>
              <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
              {article.content && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{getReadingTime(article.content)} min de lectura</span>
                </>
              )}
            </div>
          </div>

          {/* Featured image — edge-to-edge on mobile, padded on desktop. Caps tall posters. */}
          <div className="mx-auto max-w-5xl mt-8 md:mt-14 md:px-8">
            <figure>
              <picture className="block">
                {article.featured_image_mobile && (
                  <source media="(max-width: 767px)" srcSet={article.featured_image_mobile} />
                )}
                <img
                  src={getArticleImage(article)}
                  alt={article.title}
                  className="w-auto h-auto max-w-full max-h-[70vh] md:max-h-[78vh] mx-auto md:rounded-[20px] md:ring-1 md:ring-linea"
                />
              </picture>
              {article.photo_credit && (
                <figcaption className="mt-2.5 md:mt-3 px-4 md:px-0 text-[11px] md:text-xs text-muted-foreground italic text-right">
                  Foto: {article.photo_credit}
                </figcaption>
              )}
            </figure>
          </div>
        </section>

        {/* Brand accent rule between hero and body — cobalto solo en gradiente */}
        <div className="h-0.5 bg-[linear-gradient(95deg,#004AAD,#597CFF)]" aria-hidden="true" />

        {/* Article Content Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {/* Article Content */}
          <article
            className={[
              'prose prose-lg dark:prose-invert max-w-none',
              'prose-headings:text-foreground prose-headings:tracking-tight',
              'prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4',
              'prose-h3:text-xl md:prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3',
              'prose-p:text-foreground prose-p:leading-relaxed',
              'prose-strong:text-foreground prose-em:text-foreground',
              'prose-a:text-periwinkle prose-a:no-underline hover:prose-a:underline',
              'prose-blockquote:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-periwinkle prose-blockquote:not-italic prose-blockquote:font-medium',
              'prose-li:text-foreground prose-img:rounded-[20px]',
              '[&>div>p:first-of-type:first-letter]:float-left [&>div>p:first-of-type:first-letter]:text-7xl md:[&>div>p:first-of-type:first-letter]:text-8xl [&>div>p:first-of-type:first-letter]:font-extrabold [&>div>p:first-of-type:first-letter]:leading-[0.85] [&>div>p:first-of-type:first-letter]:mr-3 [&>div>p:first-of-type:first-letter]:mt-1 [&>div>p:first-of-type:first-letter]:text-periwinkle',
            ].join(' ')}
          >
            {article.content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(parseContentWithMedia(article.content, article.media_items || []))
                }}
              />
            ) : (
              <p className="text-muted-foreground">No hay contenido disponible para este artículo.</p>
            )}
          </article>

          <AdSenseUnit slot={AD_SLOTS.inArticle} format="fluid" layout="in-article" className="mt-10" />

          {/* Share rail */}
          <div className="mt-12 pt-6 border-t border-border/60">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Compartir</span>
              <SocialShare
                url={`https://www.conciertoslatam.com/blog/${article.slug}`}
                title={article.title}
              />
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="bg-superficie/40 py-14 md:py-20 border-t border-linea">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8 md:mb-10">
                <span className="eyebrow-nocturno mb-2">
                  Sigue leyendo
                </span>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground">
                  Te podría interesar
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/blog/${relatedArticle.slug}`}
                    className="group block"
                  >
                    <Card className="overflow-hidden rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 h-full">
                      <div className="relative overflow-hidden aspect-video bg-superficie-2">
                        <img
                          src={getArticleImage(relatedArticle)}
                          alt={relatedArticle.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(7,13,31,.45))' }}
                        />
                      </div>
                      <CardContent className="p-5">
                        {relatedArticle.categories && (
                          <span className="inline-block mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-verde">
                            {relatedArticle.categories.name}
                          </span>
                        )}
                        <h3 className="font-bold text-base text-foreground leading-snug line-clamp-3 group-hover:text-periwinkle transition-colors mb-3">
                          {relatedArticle.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={relatedArticle.published_at}>{formatDate(relatedArticle.published_at)}</time>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
