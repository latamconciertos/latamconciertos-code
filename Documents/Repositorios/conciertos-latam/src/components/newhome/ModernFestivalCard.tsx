import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Share2, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ModernFestivalCardProps {
    festival: {
        id: string;
        name: string;
        start_date: string;
        end_date?: string | null;
        image_url: string | null;
        lineup?: string | null;
        cities?: {
            name: string;
            countries?: {
                name: string;
            } | null;
        } | null;
    };
    onClick?: () => void;
}

export const ModernFestivalCard = ({ festival, onClick }: ModernFestivalCardProps) => {
    // Format dates for badge
    const startDate = new Date(festival.start_date);
    const day = startDate.getDate();
    const month = startDate.toLocaleDateString('es', { month: 'short' }).toUpperCase();

    // Check if multi-day festival
    const isMultiDay = festival.end_date && festival.end_date !== festival.start_date;

    // Get location
    const location = festival.cities?.name
        ? `${festival.cities.name}${festival.cities.countries?.name ? ', ' + festival.cities.countries.name : ''}`
        : 'Por definir';

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
                <div className="relative h-64 overflow-hidden bg-muted flex-shrink-0">
                    <img
                        src={imageUrl}
                        alt={festival.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-lg text-center min-w-[70px]">
                        <div className="text-3xl font-bold text-foreground leading-none">{day}</div>
                        <div className="text-sm uppercase text-muted-foreground font-semibold mt-1">{month}</div>
                        {isMultiDay && (
                            <div className="text-xs text-primary font-semibold mt-1">VARIOS DÍAS</div>
                        )}
                    </div>

                    {/* Festival Badge */}
                    <div className="absolute top-4 left-4">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm font-bold px-3 py-1">
                            FESTIVAL
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-3 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground line-clamp-2 leading-tight font-fira">
                        {festival.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm">{location}</p>
                    </div>

                    {/* Lineup preview if available */}
                    {festival.lineup && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p className="text-sm line-clamp-2">{festival.lineup}</p>
                        </div>
                    )}

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
