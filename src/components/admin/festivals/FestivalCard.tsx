/**
 * Festival Card Component
 * 
 * Display card for a single festival in the admin list.
 */

import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Users, 
  MapPin, 
  Calendar,
  ExternalLink 
} from 'lucide-react';
import type { FestivalWithRelations } from '@/types/entities/festival';

interface FestivalCardProps {
  festival: FestivalWithRelations;
  onEdit: (festival: FestivalWithRelations) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
  onManageLineup: (festival: FestivalWithRelations) => void;
  isDeleting?: boolean;
  isTogglingFeatured?: boolean;
}

export function FestivalCard({
  festival,
  onEdit,
  onDelete,
  onToggleFeatured,
  onManageLineup,
  isDeleting,
  isTogglingFeatured,
}: FestivalCardProps) {
  const today = startOfDay(new Date());
  const startDate = festival.start_date ? parseISO(festival.start_date) : null;
  const endDate = festival.end_date ? parseISO(festival.end_date) : null;
  
  const isPast = startDate ? isBefore(startDate, today) : false;
  const isUpcoming = startDate ? isAfter(startDate, today) || startDate.getTime() === today.getTime() : false;

  const formatDateRange = () => {
    if (!startDate) return 'Sin fecha';
    
    const start = format(startDate, 'd MMM yyyy', { locale: es });
    if (!endDate) return start;
    
    const end = format(endDate, 'd MMM yyyy', { locale: es });
    return `${start} - ${end}`;
  };

  const getVenueDisplay = () => {
    if (!festival.venues) return null;
    const city = festival.venues.cities?.name || '';
    const country = festival.venues.cities?.countries?.name || '';
    return `${festival.venues.name}${city ? `, ${city}` : ''}${country ? ` (${country})` : ''}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="w-full md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
          {festival.image_url ? (
            <img 
              src={festival.image_url} 
              alt={festival.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Calendar className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{festival.name}</h3>
                {festival.edition && (
                  <Badge variant="outline" className="text-xs">
                    Edición {festival.edition}
                  </Badge>
                )}
                {festival.is_featured && (
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Destacado
                  </Badge>
                )}
                {isUpcoming && (
                  <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
                    Próximo
                  </Badge>
                )}
                {isPast && (
                  <Badge variant="secondary">
                    Pasado
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange()}</span>
                </div>
                {getVenueDisplay() && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{getVenueDisplay()}</span>
                  </div>
                )}
                {festival.promoters && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{festival.promoters.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onManageLineup(festival)}
              >
                <Users className="h-4 w-4 mr-1" />
                Lineup
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleFeatured(festival.id, !festival.is_featured)}
                disabled={isTogglingFeatured}
              >
                {festival.is_featured ? (
                  <StarOff className="h-4 w-4" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(festival)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {festival.ticket_url && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={festival.ticket_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(festival.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
