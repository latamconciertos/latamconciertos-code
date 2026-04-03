import { useEffect, useState } from 'react';
import { Star, MapPin, Calendar, ArrowRight, Music, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { spotifyService } from '@/lib/spotify';
import { queryKeys } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { cardVariants, cardStyles } from '@/lib/styles/cardStyles';
import { AnimatedCard } from '@/components/ui/animated';

interface FeaturedConcertData {
  id: string;
  title: string;
  slug: string;
  date: string;
  image_url: string;
  description: string;
  artist_image_url?: string;
  artists?: {
    name: string;
    photo_url: string;
  };
  venues?: {
    name: string;
    location: string;
    cities?: {
      name: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  };
}

const FeaturedConcertsSection = () => {
  const isMobile = useIsMobile();
  const [concertsWithImages, setConcertsWithImages] = useState<FeaturedConcertData[]>([]);

  // Fetch featured concerts using React Query
  const { data: concerts = [], isLoading } = useQuery({
    queryKey: [...queryKeys.concerts.all, 'featured-is-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concerts')
        .select(`
          *,
          artists (name, photo_url),
          venues (
            name, 
            location,
            city_id,
            cities (
              name,
              country_id,
              countries (name)
            )
          )
        `)
        .eq('is_featured', true)
        .order('date', { ascending: true })
        .limit(4);

      if (error) throw error;
      return (data || []) as FeaturedConcertData[];
    },
  });

  // Fetch artist images when concerts data changes
  useEffect(() => {
    const fetchArtistImages = async () => {
      if (concerts.length === 0) {
        setConcertsWithImages([]);
        return;
      }

      const withImages = await Promise.all(
        concerts.map(async (concert) => {
          if (concert.artists?.name) {
            const artistImage = await spotifyService.getArtistImage(
              concert.artists.name,
              concert.artists.photo_url
            );
            return { ...concert, artist_image_url: artistImage };
          }
          return concert;
        })
      );
      setConcertsWithImages(withImages);
    };

    fetchArtistImages();
  }, [concerts]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop";

  const isPastConcert = (dateString: string) => {
    const concertDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return concertDate < today;
  };

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando conciertos destacados..." />
        </div>
      </section>
    );
  }

  const displayConcerts = concertsWithImages.length > 0 ? concertsWithImages : concerts;

  // Mobile layout - Instagram/TikTok style
  if (isMobile && displayConcerts.length > 0) {
    return (
      <section className="py-4 bg-background">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <h2 className="text-lg font-bold text-foreground">Destacados</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/concerts" className="text-xs">
                Ver más
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            {displayConcerts.map((concert) => (
              <Card key={concert.id} className="overflow-hidden border-0 shadow-xl rounded-3xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                {/* User header style */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                    <img
                      src={concert.artist_image_url || getDefaultImage()}
                      alt={concert.artists?.name || 'Artist'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{concert.artists?.name || 'Artista'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {concert.venues?.cities?.name || concert.venues?.name}
                    </p>
                  </div>
                  <Bookmark className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Image */}
                <div className="relative">
                  <img
                    src={concert.artist_image_url || getDefaultImage()}
                    alt={concert.title}
                    className="w-full aspect-[4/5] object-cover"
                  />
                  {isPastConcert(concert.date) && (
                    <Badge className="absolute top-3 left-3 bg-muted text-muted-foreground">
                      Finalizado
                    </Badge>
                  )}
                </div>

                {/* Actions bar */}
                <CardContent className="p-3 space-y-2">

                  <div>
                    <h3 className="font-bold text-sm mb-1">{concert.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{concert.venues?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(concert.date)}</span>
                    </div>
                  </div>

                  <Button className="w-full rounded-2xl" size="sm" asChild>
                    <Link to={`/concerts?id=${concert.slug}`}>
                      Ver Detalles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop layout
  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-primary fill-primary" />
            <h2 className="text-2xl font-bold text-foreground font-fira">Conciertos destacados</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/concerts">
              Explorar más
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {displayConcerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayConcerts.map((concert, index) => (
              <AnimatedCard key={concert.id} delay={index * 0.1}>
                <Link to={`/concerts?id=${concert.slug}`} className="h-full block">
                  <Card className={cardVariants.concert}>
                    <div className={cardStyles.imageContainer}>
                      <img
                        src={concert.artist_image_url || getDefaultImage()}
                        alt={concert.artists?.name || concert.title}
                        className={`w-full h-36 object-cover ${cardStyles.imageZoom}`}
                      />

                      {isPastConcert(concert.date) && (
                        <Badge className="absolute top-2 left-2 bg-muted text-muted-foreground text-xs">
                          Finalizado
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-3 flex-1 flex flex-col">
                      <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-5 min-h-[2.5rem]">
                        {concert.title}
                      </h3>

                      <p className="text-primary font-medium text-sm mb-1.5">
                        {concert.artists?.name || 'Artista'}
                      </p>

                      <div className="space-y-1.5 mt-auto">
                        <div className="flex items-center text-muted-foreground text-xs space-x-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {concert.venues?.name || 'Venue'}
                          </span>
                        </div>

                        {concert.venues?.cities && (
                          <div className="flex items-center text-muted-foreground text-xs space-x-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {concert.venues.cities.name}
                              {concert.venues.cities.countries?.name &&
                                `, ${concert.venues.cities.countries.name}`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center text-muted-foreground text-xs space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDate(concert.date)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No hay conciertos destacados en este momento</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedConcertsSection;
