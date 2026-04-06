import { useNavigate } from 'react-router-dom';
import { Calendar, Music, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProfileConcert } from '@/hooks/queries/useProfileConcerts';

interface ConcertGridProps {
  concerts: ProfileConcert[];
  emptyMessage: string;
  emptyIcon?: 'calendar' | 'music';
}

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
  };
};

const ConcertGrid = ({ concerts, emptyMessage, emptyIcon = 'calendar' }: ConcertGridProps) => {
  const navigate = useNavigate();

  if (concerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {emptyIcon === 'calendar' ? (
          <Calendar className="h-14 w-14 text-muted-foreground/30 mb-4" />
        ) : (
          <Music className="h-14 w-14 text-muted-foreground/30 mb-4" />
        )}
        <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/concerts')}
        >
          Explorar conciertos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {concerts.map((concert) => {
        const dateInfo = concert.date ? formatShortDate(concert.date) : null;
        const imageUrl = concert.image_url || concert.artist?.photo_url;
        const venueName = concert.venue?.name;
        const cityName = concert.venue?.city?.name;
        const locationStr = [venueName, cityName].filter(Boolean).join(' · ');

        return (
          <Card
            key={concert.id}
            className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => navigate(`/concerts/${concert.slug}`)}
          >
            <CardContent className="p-0">
              <div className="flex items-stretch">
                {/* Date column */}
                {dateInfo && (
                  <div className="flex-shrink-0 w-14 sm:w-16 bg-primary/5 flex flex-col items-center justify-center py-3 border-r border-border/30">
                    <span className="text-lg sm:text-xl font-bold text-primary leading-none">{dateInfo.day}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{dateInfo.month}</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
                    {concert.title}
                  </h3>

                  {concert.artist?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                      <Music className="h-3 w-3 flex-shrink-0 text-primary" />
                      <span className="truncate">{concert.artist.name}</span>
                    </div>
                  )}

                  {locationStr && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{locationStr}</span>
                    </div>
                  )}
                </div>

                {/* Image */}
                {imageUrl && (
                  <div className="flex-shrink-0 w-16 sm:w-20">
                    <img
                      src={imageUrl}
                      alt={concert.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConcertGrid;
