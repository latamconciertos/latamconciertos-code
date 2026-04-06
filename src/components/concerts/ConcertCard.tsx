import { memo } from 'react';
import { MapPin, Music, Ticket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ConcertPageItem } from '@/hooks/queries/useConcertsPage';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';

const SITE_URL = 'https://www.conciertoslatam.app';

export const formatDate = (dateString: string | null) => {
  if (!dateString) return { day: '', month: '', year: '', fullDate: 'Fecha por confirmar' };

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('es', { month: 'short' }),
    year: date.getFullYear().toString(),
    fullDate: date.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
};

const getDefaultImage = () => getDefaultImageUtil('concert');

export interface ConcertCardProps {
  concert: ConcertPageItem;
  isPast?: boolean;
  onClick: (concert: ConcertPageItem) => void;
}

export const ConcertCard = memo(({ concert, isPast = false, onClick }: ConcertCardProps) => {
  const dateInfo = formatDate(concert.date);

  // Optimize image URL for better performance
  const optimizedImageUrl = concert.artist_image_url
    ? optimizeUnsplashUrl(concert.artist_image_url, { width: 800, height: 640, quality: 85 })
    : getDefaultImage();

  const location = concert.venues?.cities?.name
    ? `${concert.venues.cities.name}${concert.venues.cities.countries?.name ? `, ${concert.venues.cities.countries.name}` : ''}`
    : concert.venues?.name || 'Por definir';

  return (
    <Card
      className={`group overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-border/50 bg-card concert-card h-full flex flex-col ${isPast ? 'opacity-75' : ''}`}
      onClick={() => onClick(concert)}
    >
      {/* Hidden SEO metadata */}
      <meta itemProp="name" content={concert.title} />
      <meta itemProp="startDate" content={concert.date || ''} />
      {concert.description && <meta itemProp="description" content={concert.description} />}
      <link itemProp="url" href={`${SITE_URL}/concerts?id=${concert.slug}`} />

      {/* Image Section with Date Badge */}
      <div className="relative h-72 overflow-hidden bg-muted flex-shrink-0">
        <img
          src={optimizedImageUrl}
          alt={`${concert.artists?.name || 'Artista'} - ${concert.title} - Concierto en ${concert.venues?.cities?.name || 'América Latina'}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          itemProp="image"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Date Badge */}
        <time
          dateTime={concert.date || ''}
          className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-xl p-2.5 shadow-lg text-center min-w-[60px]"
          itemProp="startDate"
        >
          <span className="block text-2xl font-bold text-foreground leading-none">{dateInfo.day}</span>
          <span className="block text-xs uppercase text-muted-foreground font-semibold mt-0.5">{dateInfo.month}</span>
        </time>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col" itemProp="location" itemScope itemType="https://schema.org/Place">
        <div className="space-y-2">
          {concert.artists?.name && (
            <div className="flex items-center gap-2" itemProp="performer" itemScope itemType="https://schema.org/MusicGroup">
              <Music className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-sm text-primary font-semibold uppercase tracking-wide">
                <span itemProp="name">{concert.artists.name}</span>
              </p>
            </div>
          )}

          <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight font-fira">
            {concert.title}
          </h3>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm line-clamp-1">
              <span itemProp="name">{location}</span>
            </p>
          </div>
        </div>

        {/* Ticket Button */}
        {!isPast && (
          <div className="pt-4 mt-auto">
            <Button
              className="w-full group/btn"
              onClick={(e) => {
                e.stopPropagation();
                if (concert.ticket_url) {
                  window.open(concert.ticket_url, '_blank');
                }
              }}
              disabled={!concert.ticket_url}
              aria-label={concert.ticket_url ? `Comprar entradas para ${concert.title}` : 'Entradas próximamente disponibles'}
            >
              <Ticket className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" aria-hidden="true" />
              {concert.ticket_url ? 'Ver Entradas' : 'Próximamente'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if concert id or relevant fields change
  return prevProps.concert.id === nextProps.concert.id &&
    prevProps.concert.artist_image_url === nextProps.concert.artist_image_url &&
    prevProps.isPast === nextProps.isPast;
});
