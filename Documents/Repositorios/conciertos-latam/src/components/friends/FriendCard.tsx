import { Link } from 'react-router-dom';
import { User, MapPin, Music2, MoreVertical, UserMinus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Friend } from '@/types/entities/friendship';

interface FriendCardProps {
  friend: Friend;
  onRemove: (friendshipId: string) => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const displayName = friend.first_name && friend.last_name 
    ? `${friend.first_name} ${friend.last_name}`
    : friend.username || 'Usuario';
  
  const initials = displayName.slice(0, 2).toUpperCase();
  
  const location = [friend.city_name, friend.country_name].filter(Boolean).join(', ');

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Link to={`/friends/${friend.id}`} className="shrink-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link to={`/friends/${friend.id}`} className="block">
              <p className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                {displayName}
              </p>
              {friend.username && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  @{friend.username}
                </p>
              )}
            </Link>
            
            {location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{location}</span>
                {friend.country_code && (
                  <span className="text-base ml-1">
                    {getFlag(friend.country_code)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {friend.common_concerts > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Music2 className="h-3 w-3" />
                <span>{friend.common_concerts}</span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/friends/${friend.id}`} className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Ver perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRemove(friend.friendship_id)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Eliminar amigo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
