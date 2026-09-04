import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Share2, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
        >
            <Card
                className="overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] transition-all duration-300 cursor-pointer h-full flex flex-col"
                onClick={onClick}
            >
                {/* Image Section with Date Badge */}
                <div className="relative aspect-[16/10] overflow-hidden bg-superficie-2 flex-shrink-0">
                    <img
                        src={imageUrl}
                        alt={festival.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Overlay oscuro desde abajo para que el texto respire */}
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
                    />

                    {/* Chip de categoría: naranja solo como chispa */}
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center rounded-full border border-naranja/30 bg-noche/80 backdrop-blur-sm px-3 py-1 font-fira text-[10px] font-bold uppercase tracking-[0.12em] text-naranja">
                            Festival
                        </span>
                    </div>

                    {/* Chip de fecha: número grande en naranja, Big Shoulders */}
                    <div className="absolute top-3 right-3 rounded-2xl border border-linea bg-noche/80 backdrop-blur-sm px-3 py-2 text-center min-w-[56px]">
                        {isMultiDay ? (
                            <>
                                <div className="flex items-center justify-center gap-1 mb-1 flex-wrap">
                                    {festivalDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className="w-6 h-6 rounded-full bg-superficie-2 flex items-center justify-center"
                                        >
                                            <span className="font-display text-[11px] font-bold text-naranja">{day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="font-fira text-[10px] uppercase tracking-[0.12em] text-texto-2">{month}</div>
                            </>
                        ) : (
                            <>
                                <div className="font-display text-2xl font-extrabold text-naranja leading-none">{festivalDays[0]}</div>
                                <div className="font-fira text-[10px] uppercase tracking-[0.12em] text-texto-2 mt-0.5">{month}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-2 flex-1 flex flex-col">
                    {/* Primer artista del lineup como eyebrow */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-fucsia" />
                        <p className="font-fira text-xs text-fucsia font-semibold uppercase tracking-[0.14em]">
                            {festival.lineup ? festival.lineup.split(',')[0].trim() : 'Festival'}
                        </p>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-texto line-clamp-2 leading-tight font-fira">
                        {festival.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-texto-2">
                        <MapPin className="h-4 w-4 text-fucsia" />
                        <p className="text-sm">{location}</p>
                    </div>

                    {/* Action Buttons - pushed to bottom with mt-auto */}
                    <div className="flex gap-3 pt-2 mt-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto transition-colors"
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
                            className="rounded-full border-linea bg-transparent text-texto hover:bg-superficie-2 hover:text-texto transition-colors"
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
