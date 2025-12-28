import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatDisplayDate } from '@/lib/timezone';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdSpace } from '@/components/AdSpace';
import { Breadcrumbs } from '@/components/Breadcrumbs';
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
  photo_credit: string | null;
  published_at: string;
  meta_description: string | null;
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
          photo_credit,
          published_at,
          meta_description,
          category_id,
          artist_id,
          artists (name, photo_url),
          categories:category_id (
            name,
            slug
          )
        `)
        .eq('slug', slug)
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
        ...articleData,
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
          setRelatedArticles(relatedData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a noticias
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.meta_description || article.content?.substring(0, 160),
    "image": [getArticleImage(article)],
    "datePublished": article.published_at,
    "dateModified": article.published_at, // TODO: Agregar campo updated_at en la BD
    "author": {
      "@type": "Person",
      "name": "Conciertos Latam",
      "url": "https://conciertoslatam.lovable.app/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "logo": {
        "@type": "ImageObject",
        "url": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png",
        "width": 600,
        "height": 60
      },
      "url": "https://conciertoslatam.lovable.app"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://conciertoslatam.lovable.app/blog/${article.slug}`
    },
    "articleBody": article.content?.substring(0, 500) || article.meta_description,
    "articleSection": article.categories?.name || "Música",
    "inLanguage": "es-LA",
    "isAccessibleForFree": true,
    "keywords": article.categories?.name || "música, conciertos, América Latina"
  };

  return (
    <>
      <SEO 
        title={article.title}
        description={article.meta_description || article.content?.substring(0, 160) || ''}
        keywords={`${article.artists?.name || ''}, ${article.categories?.name || ''}, noticias musicales, conciertos`}
        image={getArticleImage(article)}
        url={`/blog/${article.slug}`}
        type="article"
        article={{
          publishedTime: article.published_at,
          section: article.categories?.name,
          tags: article.categories ? [article.categories.name] : []
        }}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
      
        {/* Hero Image - Full Width */}
        <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
          <img
            src={getArticleImage(article)}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          
          {/* Photo Credit */}
          {article.photo_credit && (
            <div className="absolute bottom-2 right-4 z-10">
              <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                Foto: {article.photo_credit}
              </span>
            </div>
          )}
        </div>

        {/* Article Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Back link and Category */}
          <div className="mb-6">
            <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 transition-colors text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a noticias
            </Link>
            
            {article.categories && (
              <Badge className="ml-4 bg-primary/10 text-primary hover:bg-primary/20">
                {article.categories.name}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Meta Info: Author, Date, Reading Time */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Conciertos Latam</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.published_at)}</span>
            </div>
            {article.content && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{getReadingTime(article.content)} min de lectura</span>
              </div>
            )}
          </div>

          {/* Social Share */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Comparte esta noticia:</p>
            <SocialShare 
              url={`https://www.conciertoslatam.app/blog/${article.slug}`}
              title={article.title}
            />
          </div>

          {/* Summary/Lead */}
          {article.meta_description && (
            <p className="text-lg md:text-xl text-foreground leading-relaxed font-medium mb-8">
              {article.meta_description}
            </p>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {article.content ? (
              <div 
                className="text-foreground leading-relaxed text-base md:text-lg [&>p]:mb-6 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>ul]:my-4 [&>ol]:my-4"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHTML(parseContentWithMedia(article.content, article.media_items || [])) 
                }}
              />
            ) : (
              <p className="text-muted-foreground">No hay contenido disponible para este artículo.</p>
            )}
          </div>

          {/* Share again at bottom */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-base font-semibold mb-4">¿Te gustó esta noticia? ¡Compártela!</p>
            <SocialShare 
              url={`https://www.conciertoslatam.app/blog/${article.slug}`}
              title={article.title}
            />
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="bg-muted/30 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8">
                Te podría interesar
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/blog/${relatedArticle.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                      <div className="relative overflow-hidden aspect-video">
                        <img
                          src={getArticleImage(relatedArticle)}
                          alt={relatedArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4">
                        {relatedArticle.categories && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {relatedArticle.categories.name}
                          </Badge>
                        )}
                        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {relatedArticle.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(relatedArticle.published_at)}</span>
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
