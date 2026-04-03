import { useEffect, useState } from 'react';
import { History, MapPin, Calendar, ArrowRight, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePastConcerts } from '@/hooks/queries';
import { spotifyService } from '@/lib/spotify';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

interface ConcertWithImage {
  id: string;
  title: string;
  slug: string;
  date: string;
  image_url: string | null;
  description: string | null;
  artist_image_url?: string;
  artists?: {
    name: string;
    photo_url: string | null;
  } | null;
  venues?: {
    name: string;
    location: string | null;
    cities?: {
      name: string;
      countries?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

const PastConcertsSection = () => {
  const { data: concerts = [], isLoading } = usePastConcerts(4);
  const [concertsWithImages, setConcertsWithImages] = useState<ConcertWithImage[]>([]);

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
              concert.artists.photo_url || undefined
            );
            return { ...concert, artist_image_url: artistImage } as ConcertWithImage;
          }
          return concert as ConcertWithImage;
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

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinnerInline message="Cargando conciertos pasados..." />
        </div>
      </section>
    );
  }

  const displayConcerts = concertsWithImages.length > 0 ? concertsWithImages : concerts;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground font-fira">Conciertos pasados</h2>
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
            {displayConcerts.map((concert) => (
              <Card key={concert.id} className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="relative overflow-hidden">
                  <img 
                    src={(concert as ConcertWithImage).artist_image_url || getDefaultImage()} 
                    alt={concert.artists?.name || concert.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300 grayscale-0 group-hover:grayscale-0"
                  />
                  
                  <Badge className="absolute top-2 left-2 bg-muted text-muted-foreground text-xs">
                    Finalizado
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-5">
                    {concert.title}
                  </h3>
                  
                  <p className="text-primary font-medium text-sm mb-2">
                    {concert.artists?.name || 'Artista'}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground text-xs space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {concert.venues?.name || 'Venue'}
                      </span>
                    </div>
                    
                    {concert.venues?.cities && (
                      <div className="flex items-center text-muted-foreground text-xs space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {concert.venues.cities.name}
                          {concert.venues.cities.countries?.name && 
                            `, ${concert.venues.cities.countries.name}`}
                          </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-muted-foreground text-xs space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{concert.date ? formatDate(concert.date) : 'Fecha no disponible'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No hay conciertos pasados registrados</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PastConcertsSection;
