import { Check, X, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FriendRequest } from '@/types/entities/friendship';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  isLoading?: boolean;
}

export function FriendRequestCard({ request, onAccept, onReject, isLoading }: FriendRequestCardProps) {
  const { requester } = request;
  
  const displayName = requester.first_name && requester.last_name 
    ? `${requester.first_name} ${requester.last_name}`
    : requester.username || 'Usuario';
  
  const initials = displayName.slice(0, 2).toUpperCase();
  
  const location = [requester.cities?.name, requester.countries?.name].filter(Boolean).join(', ');
  
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {displayName}
                </p>
                {requester.username && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    @{requester.username}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo}
              </span>
            </div>
            
            {location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{location}</span>
                {requester.countries?.iso_code && (
                  <span className="text-base ml-1">
                    {getFlag(requester.countries.iso_code)}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onAccept(request.id)}
                disabled={isLoading}
                className="flex-1 h-8 sm:h-9"
              >
                <Check className="h-4 w-4 mr-1" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(request.id)}
                disabled={isLoading}
                className="flex-1 h-8 sm:h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
