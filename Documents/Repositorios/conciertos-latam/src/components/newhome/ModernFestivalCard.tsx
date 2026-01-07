import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Share2, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { parseISO, format, eachDayOfInterval } from 'date-fns';

interface ModernFestivalCardProps {
    festival: {
        id: string;
        name: string;
        start_date: string;
        end_date?: string | null;
        image_url: string | null;
        lineup?: string | null;
        venues?: {
            name: string;
            location?: string | null;
            cities?: {
                name: string;
                countries?: {
                    name: string;
                } | null;
            } | null;
        } | null;
    };
    onClick?: () => void;
}

export const ModernFestivalCard = ({ festival, onClick }: ModernFestivalCardProps) => {
    // Format dates for badge - using parseISO to avoid timezone issues
    const startDate = parseISO(festival.start_date);
    const month = format(startDate, 'MMM').toUpperCase();

    // Get all days of the festival
    const getFestivalDays = () => {
        if (!festival.end_date || festival.end_date === festival.start_date) {
            // Single day festival
            return [format(startDate, 'd')];
        }

        // Multi-day festival
        const endDate = parseISO(festival.end_date);
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        return allDays.map(day => format(day, 'd'));
    };

    const festivalDays = getFestivalDays();
    const isMultiDay = festivalDays.length > 1;

    // Get location - show venue name and city
    const location = festival.venues?.name
        ? `${festival.venues.name}${festival.venues.cities?.name ? ', ' + festival.venues.cities.name : ''}`
        : festival.venues?.cities?.name || 'Por definir';

    // Default image
    const imageUrl = festival.image_url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80';

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
                        alt={festival.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Festival Badge - top left */}
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm font-bold px-3 py-1.5 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            FESTIVAL
                        </Badge>
                    </div>

                    {/* Date Badge - top right */}
                    <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-xl p-2.5 shadow-lg text-center min-w-[60px]">
                        {/* Multi-day: Show circles with days */}
                        {isMultiDay ? (
                            <>
                                <div className="flex items-center justify-center gap-1 mb-1 flex-wrap">
                                    {festivalDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"
                                        >
                                            <span className="text-[10px] font-bold text-foreground">{day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs uppercase text-muted-foreground font-semibold">{month}</div>
                            </>
                        ) : (
                            <>
                                {/* Single day */}
                                <div className="text-2xl font-bold text-foreground leading-none">{festivalDays[0]}</div>
                                <div className="text-xs uppercase text-muted-foreground font-semibold mt-0.5">{month}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                    {/* Category - showing first artists from lineup if available */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-sm text-primary font-semibold uppercase tracking-wide">
                            {festival.lineup ? festival.lineup.split(',')[0].trim() : 'Festival'}
                        </p>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight font-fira">
                        {festival.name}
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
