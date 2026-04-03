import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

/**
 * NewHomeFeaturedArtists Component
 * 
 * Modern featured artists section for the new home page.
 * Displays a horizontal scrollable list of featured artists with circular avatars.
 * Matches the aesthetic of the new home design with smooth animations.
 */
export const NewHomeFeaturedArtists = () => {
    const { artists, loading } = useFeaturedArtists();

    const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop";

    if (loading) {
        return (
            <section className="py-12 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-8 bg-muted/20 rounded w-64 mb-8 animate-pulse"></div>
                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                                <div className="w-24 h-24 rounded-full bg-muted/20 animate-pulse"></div>
                                <div className="h-4 bg-muted/20 rounded w-16 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (artists.length === 0) {
        return null;
    }

    return (
        <section className="py-4 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header - Centered like concerts section */}
                <div className="text-center mb-8">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira mb-4">
                        <Music className="h-4 w-4 mr-2" />
                        Artistas Destacados
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-fira">
                        Conciertos Destacados
                    </h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                        Explora las giras más populares del momento
                    </p>
                </div>

                {/* Artists Grid - Horizontal Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-2 pt-2 scrollbar-hide md:justify-center">
                    {artists.map((artist) => (
                        <Link
                            key={artist.id}
                            to={`/artists/${artist.slug}`}
                            className="flex-shrink-0 flex flex-col items-center gap-2"
                        >
                            <div className="relative">
                                <div className="w-[68px] h-[68px] rounded-full overflow-hidden ring-2 ring-primary p-0.5">
                                    <img
                                        src={artist.photo_url || getDefaultImage()}
                                        alt={artist.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-foreground text-center max-w-[76px] truncate">
                                {artist.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
