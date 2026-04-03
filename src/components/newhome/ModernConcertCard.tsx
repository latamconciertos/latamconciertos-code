import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Share2, MapPin, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseISO, format } from 'date-fns';

interface ModernConcertCardProps {
    concert: {
        id: string;
        title: string;
        date: string;
        image_url: string | null;
        artist_image_url?: string;
        artists?: {
            name: string;
        } | null;
        venues?: {
            name: string;
            cities?: {
                name: string;
            } | null;
        } | null;
    };
    onClick?: () => void;
}

export const ModernConcertCard = ({ concert, onClick }: ModernConcertCardProps) => {
    // Format date for badge - using parseISO to avoid timezone issues
    const concertDate = parseISO(concert.date);
    const day = format(concertDate, 'd');
    const month = format(concertDate, 'MMM').toUpperCase();

    // Get artist name
    const artistName = concert.artists?.name || 'Artista';

    // Get location
    const location = concert.venues?.cities?.name || concert.venues?.name || 'Por definir';

    // Prioritize artist image from Spotify, then concert image, then fallback
    const imageUrl = concert.artist_image_url ||
        concert.image_url ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
        >
            <Card
                className="overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-border/50 bg-card h-full flex flex-col"
                onClick={onClick}
            >
                {/* Image Section with Date Badge */}
                <div className="relative h-72 overflow-hidden bg-muted flex-shrink-0">
                    <img
                        src={imageUrl}
                        alt={concert.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Date Badge */}
                    <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-xl p-2.5 shadow-lg text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-foreground leading-none">{day}</div>
                        <div className="text-xs uppercase text-muted-foreground font-semibold mt-0.5">{month}</div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                    {/* Category/Artist */}
                    <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <p className="text-sm text-primary font-semibold uppercase tracking-wide">
                            {artistName}
                        </p>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight font-fira">
                        {concert.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm">{location}</p>
                    </div>

                    {/* Action Buttons - pushed to bottom with mt-auto */}
                    <div className="flex gap-3 pt-2 mt-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement bookmark functionality
                            }}
                        >
                            <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement share functionality
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
