import { Megaphone, Calendar, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const AnnouncementsSection = () => {
  const { data: items = [], isLoading } = useAnnouncements(3);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es', { month: 'short', day: 'numeric' });
  };

  return (
    <section className="py-6 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground font-fira">Nuevos anuncios</h2>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {isLoading ? (
          <LoadingSpinnerInline message="Cargando anuncios..." />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((it) => (
              <Link key={it.id} to={`/blog/${it.slug}`}>
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 group border cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={it.featured_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'} 
                          alt={it.title}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">Anuncio</Badge>
                          <Volume2 className="h-3 w-3 text-primary" />
                        </div>

                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-5">
                          {it.title}
                        </h3>

                        <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-4">
                          {it.meta_description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(it.published_at || it.created_at)}</span>
                          </div>

                          <Button variant="ghost" size="sm" className="text-xs h-7 px-3">
                            Ver más
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No hay anuncios por ahora.</div>
        )}
      </div>
    </section>
  );
};

export default AnnouncementsSection;
