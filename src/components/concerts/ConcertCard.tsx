import { memo } from 'react';
import { MapPin, Globe, Calendar, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  return (
    <Card
      className={`group overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/30 cursor-pointer concert-card ${isPast ? 'opacity-75' : ''}`}
      onClick={() => onClick(concert)}
    >
      {/* Hidden SEO metadata */}
      <meta itemProp="name" content={concert.title} />
      <meta itemProp="startDate" content={concert.date || ''} />
      {concert.description && <meta itemProp="description" content={concert.description} />}
      <link itemProp="url" href={`${SITE_URL}/concerts?id=${concert.slug}`} />

      <div className="relative overflow-hidden">
        <img
          src={optimizedImageUrl}
          alt={`${concert.artists?.name || 'Artista'} - ${concert.title} - Concierto en ${concert.venues?.cities?.name || 'América Latina'}`}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
          itemProp="image"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute top-4 left-4">
          <Badge className={isPast ? "bg-gray-500 text-white" : "bg-green-500 text-white font-bold px-3 py-1"}>
            {isPast ? 'Finalizado' : 'Próximo'}
          </Badge>
        </div>

        <time
          dateTime={concert.date || ''}
          className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-16 h-16 flex flex-col items-center justify-center text-center shadow-lg"
          itemProp="startDate"
        >
          <span className="text-xs font-medium">{dateInfo.month}</span>
          <span className="text-lg font-bold leading-none">{dateInfo.day}</span>
        </time>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardContent className="p-6 flex flex-col h-[280px]">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {concert.title}
            </h3>
            {concert.artists?.name && (
              <p className="text-primary font-semibold text-lg mb-1" itemProp="performer" itemScope itemType="https://schema.org/MusicGroup">
                <span itemProp="name">{concert.artists.name}</span>
              </p>
            )}
            {concert.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                {concert.description}
              </p>
            )}
          </div>

          <div className="space-y-2" itemProp="location" itemScope itemType="https://schema.org/Place">
            {concert.venues?.name && (
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                <span className="font-medium line-clamp-1" itemProp="name">
                  {concert.venues.name}
                </span>
              </div>
            )}

            {concert.venues?.cities && (
              <div className="flex items-center text-muted-foreground text-sm" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <Globe className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">
                  <span itemProp="addressLocality">{concert.venues.cities.name}</span>
                  {concert.venues.cities.countries?.name && (
                    <>, <span itemProp="addressCountry">{concert.venues.cities.countries.name}</span></>
                  )}
                </span>
              </div>
            )}

            {concert.date && (
              <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{dateInfo.fullDate}</span>
              </div>
            )}
          </div>
        </div>

        {!isPast && (
          <Button
            className="w-full group/btn mt-4"
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
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if concert id or relevant fields change
  return prevProps.concert.id === nextProps.concert.id &&
    prevProps.concert.artist_image_url === nextProps.concert.artist_image_url &&
    prevProps.isPast === nextProps.isPast;
});
