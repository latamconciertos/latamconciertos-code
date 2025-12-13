import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Music2, ArrowRight, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { OptimizedImage } from '@/components/OptimizedImage';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
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
}

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use the shared hook for featured artists
  const { artists: featuredArtists, loading: loadingArtists } = useFeaturedArtists();

  // Fetch news using React Query
  const { data: allArticles = [], isLoading } = useQuery({
    queryKey: [...queryKeys.news.all, 'hero-featured', 7],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          slug,
          featured_image,
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
        .order('published_at', { ascending: false })
        .limit(7);

      if (error) throw error;
      return (data || []) as NewsArticle[];
    },
  });

  const featuredArticles = allArticles.slice(0, 5);
  const sideArticles = allArticles.slice(5, 7);

  useEffect(() => {
    if (featuredArticles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop';
  };

  const getArticleImage = (article: NewsArticle) => {
    if (article.featured_image) return article.featured_image;
    if (article.artists?.photo_url) return article.artists.photo_url;
    return getDefaultImage();
  };

  if (isLoading) {
    return (
      <section className="relative bg-background overflow-hidden stage-lights">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinnerInline message="Cargando..." />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-background overflow-hidden stage-lights pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira">
              <Music2 className="h-4 w-4 mr-2" />
              Destacados
            </Badge>
            <Badge variant="outline" className="text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Lo más reciente
            </Badge>
          </div>
          <Link to="/blog">
            <Button variant="ghost" size="sm">
              Ver todas las noticias
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured Article with Slider */}
          {featuredArticles.length > 0 && (
            <div className="lg:col-span-2 animate-fade-in relative" style={{ animationDelay: '0.1s' }}>
              {/* Slider Container */}
              <div className="relative overflow-hidden">
                {featuredArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className={`transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                      }`}
                  >
                    <Link
                      to={`/blog/${article.slug}`}
                      className={`group block ${index === currentIndex ? '' : 'pointer-events-none'}`}
                    >
                      {/* Featured Image */}
                      <div className="relative mb-6 overflow-hidden rounded-lg aspect-video bg-muted">
                        <OptimizedImage
                          src={getArticleImage(article)}
                          alt={article.title}
                          sizePreset="hero"
                          priority={index === 0} // First image is priority
                          quality={85}
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Article Info */}
                      <div className="space-y-3">
                        {article.categories && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold">
                              {article.categories.name}
                            </Badge>
                            <span className="text-muted-foreground">
                              {formatDate(article.published_at)}
                            </span>
                          </div>
                        )}

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>

                        {article.meta_description && (
                          <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
                            {article.meta_description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-primary font-semibold">
                          Leer más
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Slider Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {featuredArticles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === currentIndex
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-primary/30 hover:bg-primary/50'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

            </div>
          )}

          {/* Side Articles */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira">
                Noticias
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              {sideArticles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="group block"
                >
                  <article className="border-l-4 border-primary pl-4 hover:border-primary/60 transition-colors">
                    {/* Small Image */}
                    <div className="relative mb-3 overflow-hidden rounded aspect-video bg-muted">
                      <OptimizedImage
                        src={getArticleImage(article)}
                        alt={article.title}
                        sizePreset="card"
                        quality={80}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Article Info */}
                    <div className="space-y-2">
                      {article.categories && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-primary font-semibold uppercase">
                            {article.categories.name}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new Date(article.published_at), "d 'de' MMM", { locale: es })}
                          </span>
                        </div>
                      )}

                      <h3 className="font-bold text-sm md:text-base text-foreground leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Artists Section - Full Width */}
      {!loadingArtists && featuredArtists.length > 0 && (
        <div className="w-full mt-8 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Artistas Destacados
            </h2>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-4 pt-2 px-4 sm:px-6 lg:px-8 justify-center">
              {featuredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artists/${artist.slug}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 transition-transform hover:scale-105"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary p-0.5 bg-background">
                      <OptimizedImage
                        src={artist.photo_url || getDefaultImage()}
                        alt={artist.name}
                        sizePreset="avatar"
                        width={80}
                        height={80}
                        quality={85}
                        objectFit="cover"
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-foreground text-center max-w-[80px] truncate">
                    {artist.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
