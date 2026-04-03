import { UserPlus, Clock, Check, X, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserSearchResult } from '@/types/entities/friendship';

interface UserSearchCardProps {
  user: UserSearchResult;
  onSendRequest: (userId: string) => void;
  onCancelRequest: (friendshipId: string) => void;
  isLoading?: boolean;
}

export function UserSearchCard({ user, onSendRequest, onCancelRequest, isLoading }: UserSearchCardProps) {
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.username || 'Usuario';
  
  const initials = displayName.slice(0, 2).toUpperCase();

  const renderActionButton = () => {
    switch (user.friendship_status) {
      case 'accepted':
        return (
          <Button size="sm" variant="secondary" disabled className="h-8 text-xs sm:text-sm">
            <Check className="h-4 w-4 mr-1" />
            Amigos
          </Button>
        );
      case 'sent':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled 
            className="h-8 text-xs sm:text-sm"
          >
            <Clock className="h-4 w-4 mr-1" />
            Pendiente
          </Button>
        );
      case 'received':
        return (
          <Button size="sm" variant="secondary" disabled className="h-8 text-xs sm:text-sm">
            Solicitud recibida
          </Button>
        );
      case 'blocked':
        return (
          <Button size="sm" variant="outline" disabled className="h-8 text-xs sm:text-sm">
            <X className="h-4 w-4 mr-1" />
            Bloqueado
          </Button>
        );
      default:
        return (
          <Button 
            size="sm" 
            onClick={() => onSendRequest(user.id)}
            disabled={isLoading}
            className="h-8 text-xs sm:text-sm"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-muted shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {displayName}
            </p>
            {user.username && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                @{user.username}
              </p>
            )}
            {user.country_name && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{user.country_name}</span>
                {user.country_code && (
                  <span className="text-sm ml-0.5">
                    {getFlag(user.country_code)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="shrink-0">
            {renderActionButton()}
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
