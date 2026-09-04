import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { optimizeUnsplashUrl, getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import type { FestivalWithRelations } from '@/types/entities/festival';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { withTicketTracking } from '@/lib/ticketUrl';

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
      className="group relative overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer festival-card h-full flex flex-col"
      onClick={onClick}
    >
      {/* Image Section with Date Badge */}
      <div className="relative aspect-[16/10] overflow-hidden bg-superficie-2 flex-shrink-0">
        <img
          src={optimizedImageUrl}
          alt={`${festival.name} - Festival de música`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        {/* Overlay oscuro desde abajo para que el texto respire */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
        />

        {/* Chip de categoría/edición: verde solo como chispa */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full border border-verde/30 bg-noche/80 backdrop-blur-sm px-3 py-1 font-fira text-[10px] font-bold uppercase tracking-[0.12em] text-verde">
            {festival.edition ? `Edición ${festival.edition}` : 'Festival'}
          </span>
        </div>

        {/* Chip de fecha: número grande en verde, Big Shoulders */}
        <div className="absolute top-3 right-3 rounded-2xl border border-linea bg-noche/80 backdrop-blur-sm px-3 py-2 text-center min-w-[56px]">
          <span className="block font-display text-2xl font-extrabold text-verde leading-none">{dateInfo.day}</span>
          <span className="block font-fira text-[10px] uppercase tracking-[0.12em] text-texto-2 mt-0.5">{dateInfo.month}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-fira font-bold text-xl text-texto leading-tight mb-2 line-clamp-2">
              {/* Stretched link: enlace real crawleable al detalle del festival */}
              <Link
                to={`/festivals/${festival.slug}`}
                className="after:absolute after:inset-0 after:z-[1] focus-visible:outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                {festival.name}
              </Link>
            </h3>
            {festival.description && (
              <p className="text-texto-2 text-sm line-clamp-2">
                {festival.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {festival.venues?.name && (
              <div className="flex items-center text-texto-2 text-sm">
                <MapPin className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
                <span className="truncate font-medium">
                  {festival.venues.name}
                </span>
              </div>
            )}

            {festival.venues?.cities && (
              <div className="flex items-center text-texto-2 text-sm">
                <Globe className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {festival.venues.cities.name}
                  {festival.venues.cities.countries?.name &&
                    `, ${festival.venues.cities.countries.name}`}
                </span>
              </div>
            )}

            <div className="flex items-center text-texto-2 text-sm">
              <Calendar className="h-4 w-4 mr-2 text-periwinkle flex-shrink-0" aria-hidden="true" />
              <span>{dateRange}</span>
            </div>
          </div>
        </div>

        {festival.ticket_url ? (
          <Button
            className="relative z-[2] w-full rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95 group/btn mt-4"
            asChild
          >
            <a
              href={withTicketTracking(festival.ticket_url)}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Ticket className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" aria-hidden="true" />
              Ver entradas
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="relative z-[2] w-full rounded-full border-linea bg-transparent text-texto-2 mt-4"
            disabled
          >
            <Ticket className="h-4 w-4 mr-2" aria-hidden="true" />
            Próximamente
          </Button>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if festival id or relevant fields change
  return prevProps.festival.id === nextProps.festival.id &&
    prevProps.festival.image_url === nextProps.festival.image_url &&
    prevProps.festival.name === nextProps.festival.name;
});
