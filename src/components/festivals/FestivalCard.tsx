import { memo } from 'react';
import { Calendar, MapPin, Ticket, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import type { FestivalWithRelations } from '@/types/entities/festival';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const getDefaultImage = () => getDefaultImageUtil('festival');

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('es', { month: 'short' }),
    year: date.getFullYear()
  };
};

const formatDateRange = (startDate: string, endDate?: string | null) => {
  const start = parseISO(startDate);
  const startDay = format(start, 'd', { locale: es });
  const startMonth = format(start, 'MMM', { locale: es });

  if (!endDate) {
    return `${startDay} ${startMonth}`;
  }

  const end = parseISO(endDate);
  const endDay = format(end, 'd', { locale: es });

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }

  const endMonth = format(end, 'MMM', { locale: es });
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export interface FestivalCardProps {
  festival: FestivalWithRelations;
  onClick?: () => void;
}

export const FestivalCard = memo(({ festival, onClick }: FestivalCardProps) => {
  const dateInfo = formatDate(festival.start_date);
  const dateRange = formatDateRange(festival.start_date, festival.end_date);

  // Optimize image URL for better performance
  const optimizedImageUrl = festival.image_url
    ? optimizeUnsplashUrl(festival.image_url, { width: 800, height: 640, quality: 85 })
    : getDefaultImage();

  return (
    <Card
      className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer festival-card"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={optimizedImageUrl}
          alt={`${festival.name} - Festival de música`}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />

        {festival.edition && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold px-4 py-2">
            Edición {festival.edition}
          </Badge>
        )}

        <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-20 h-20 flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-xs font-medium uppercase">{dateInfo.month}</span>
          <span className="text-2xl font-bold leading-none">{dateInfo.day}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardContent className="p-6 flex flex-col h-[240px]">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {festival.name}
            </h3>
            {festival.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {festival.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {festival.venues?.name && (
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <span className="truncate font-medium">
                  {festival.venues.name}
                </span>
              </div>
            )}

            {festival.venues?.cities && (
              <div className="flex items-center text-muted-foreground text-sm">
                <Globe className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <span className="truncate">
                  {festival.venues.cities.name}
                  {festival.venues.cities.countries?.name &&
                    `, ${festival.venues.cities.countries.name}`}
                </span>
              </div>
            )}

            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
              <span>{dateRange}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full group/btn mt-4"
          onClick={(e) => {
            e.stopPropagation();
            if (festival.ticket_url) {
              window.open(festival.ticket_url, '_blank');
            }
          }}
          disabled={!festival.ticket_url}
        >
          <Ticket className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
          {festival.ticket_url ? 'Ver Entradas' : 'Próximamente'}
        </Button>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if festival id or relevant fields change
  return prevProps.festival.id === nextProps.festival.id &&
    prevProps.festival.image_url === nextProps.festival.image_url &&
    prevProps.festival.name === nextProps.festival.name;
});
