import { Check, X, Calendar, MapPin, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ConcertInvitationWithDetails } from '@/types/entities/friendship';

interface ConcertInvitationCardProps {
  invitation: ConcertInvitationWithDetails;
  onAccept: (invitationId: string, concertId: string) => void;
  onDecline: (invitationId: string) => void;
  isLoading?: boolean;
}

export function ConcertInvitationCard({ invitation, onAccept, onDecline, isLoading }: ConcertInvitationCardProps) {
  const { sender, concerts } = invitation;
  
  const senderName = sender?.first_name && sender?.last_name 
    ? `${sender.first_name} ${sender.last_name}`
    : sender?.username || 'Alguien';
  
  const senderInitials = senderName.slice(0, 2).toUpperCase();
  
  const timeAgo = formatDistanceToNow(new Date(invitation.created_at), { 
    addSuffix: true, 
    locale: es 
  });
  
  const concertDate = concerts?.date 
    ? format(new Date(concerts.date), "d 'de' MMMM, yyyy", { locale: es })
    : null;
  
  const location = [concerts?.venues?.name, concerts?.venues?.cities?.name].filter(Boolean).join(', ');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {senderInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">
                <span className="font-semibold">{senderName}</span>
                <span className="text-muted-foreground"> te invitó a</span>
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo}
              </span>
            </div>
            
            {/* Concert Info */}
            <div className="mt-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="flex gap-3">
                {concerts?.image_url ? (
                  <img 
                    src={concerts.image_url} 
                    alt={concerts.title}
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Music2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <Link 
                    to={`/concerts/${concerts?.slug}`}
                    className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-1"
                  >
                    {concerts?.title}
                  </Link>
                  
                  {concerts?.artists?.name && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {concerts.artists.name}
                    </p>
                  )}
                  
                  {concertDate && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{concertDate}</span>
                    </div>
                  )}
                  
                  {location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {invitation.message && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                "{invitation.message}"
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onAccept(invitation.id, invitation.concert_id)}
                disabled={isLoading}
                className="flex-1 h-8 sm:h-9"
              >
                <Check className="h-4 w-4 mr-1" />
                Acepto, voy!
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(invitation.id)}
                disabled={isLoading}
                className="flex-1 h-8 sm:h-9"
              >
                <X className="h-4 w-4 mr-1" />
                No puedo
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
