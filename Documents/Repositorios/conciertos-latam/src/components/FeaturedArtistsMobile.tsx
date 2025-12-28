import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists';

const FeaturedArtistsMobile = () => {
  const { artists, loading } = useFeaturedArtists();
  const isMobile = useIsMobile();

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop";

  if (!isMobile || loading) {
    return null;
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section className="py-4 bg-background">
      <div className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Artistas Destacados
        </h2>
        
        <div className="flex gap-4 overflow-x-auto pb-2 pt-2 scrollbar-hide">
          {artists.map((artist) => (
            <Link 
              key={artist.id}
              to={`/artists/${artist.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary p-0.5">
                  <img 
                    src={artist.photo_url || getDefaultImage()} 
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <span className="text-xs text-foreground text-center max-w-[70px] truncate">
                {artist.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtistsMobile;
