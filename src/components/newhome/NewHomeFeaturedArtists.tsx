import { Link } from 'react-router-dom';
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists';
import { SectionHeader } from './SectionHeader';

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
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-8 bg-superficie rounded w-64 mb-8 animate-pulse"></div>
                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                                <div className="w-24 h-24 rounded-full bg-superficie animate-pulse"></div>
                                <div className="h-4 bg-superficie rounded w-16 animate-pulse"></div>
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
        <section className="py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    eyebrow="Artistas"
                    title="Las giras del momento"
                    subtitle="Tus artistas favoritos que están recorriendo la región."
                    action={{ label: 'Ver todos los artistas', to: '/artists' }}
                />

                {/* Artists Grid - Horizontal Scroll.
                    px-2/-mx-2: el anillo se dibuja fuera del círculo y el
                    overflow del carrusel lo recortaba en el primero y el último */}
                <div className="flex gap-5 overflow-x-auto py-2 px-2 -mx-2 scrollbar-hide">
                    {artists.map((artist) => (
                        <Link
                            key={artist.id}
                            to={`/artists/${artist.slug}`}
                            className="group flex-shrink-0 flex flex-col items-center gap-2"
                        >
                            <div className="relative">
                                <div className="w-[76px] h-[76px] rounded-full overflow-hidden ring-1 ring-linea group-hover:ring-2 group-hover:ring-periwinkle transition-all p-0.5">
                                    <img
                                        src={artist.photo_url || getDefaultImage()}
                                        alt={artist.name}
                                        className="w-full h-full object-cover rounded-full"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <span className="font-fira text-xs text-texto-2 group-hover:text-texto transition-colors text-center max-w-[84px] truncate">
                                {artist.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
