import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Music } from 'lucide-react';
import type { ProfileConcert } from '@/hooks/queries/useProfileConcerts';

interface ConcertGridProps {
  concerts: ProfileConcert[];
  emptyMessage: string;
  emptyIcon?: 'calendar' | 'music';
}

const ConcertGrid = ({ concerts, emptyMessage, emptyIcon = 'calendar' }: ConcertGridProps) => {
  const navigate = useNavigate();

  if (concerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon === 'calendar' ? (
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
        ) : (
          <Music className="h-12 w-12 text-muted-foreground/40 mb-3" />
        )}
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1">
      {concerts.map((concert) => {
        const imageUrl = concert.image_url || concert.artist?.photo_url;
        const formattedDate = concert.date
          ? format(new Date(concert.date), 'dd MMM', { locale: es })
          : null;

        return (
          <button
            key={concert.id}
            onClick={() => navigate(`/concerts/${concert.slug}`)}
            className="aspect-square relative group overflow-hidden bg-muted rounded-sm"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={concert.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                <Music className="h-8 w-8 text-primary/60" />
              </div>
            )}
            
            {/* Overlay with date */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            {/* Date badge */}
            {formattedDate && (
              <div className="absolute bottom-1 left-1 right-1">
                <span className="text-[10px] sm:text-xs font-medium text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {formattedDate}
                </span>
              </div>
            )}

            {/* Hover title */}
            <div className="absolute inset-0 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-xs text-white text-center font-medium line-clamp-3 drop-shadow-lg">
                {concert.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConcertGrid;
