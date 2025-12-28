import { Clock, User, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLatestNews } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const LatestNewsSection = () => {
  const { data: articles = [], isLoading: loading } = useLatestNews(4);

  // Helper type for article from hook
  type ArticleType = (typeof articles)[number];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace unos minutos';
    if (diffInHours < 24) return `hace ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays}d`;
  };

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop";

  const getArticleImage = (article: ArticleType) => {
    if (article.featured_image) return article.featured_image;
    if (article.artists?.photo_url) return article.artists.photo_url;
    return getDefaultImage();
  };

  if (loading) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando noticias..." />
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground font-fira">Últimas noticias</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`/blog/${article.slug}`}>
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={getArticleImage(article)} 
                      alt={article.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-5">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-4">
                      {article.meta_description || article.content?.substring(0, 80) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">Conciertos Latam</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No hay noticias disponibles</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestNewsSection;