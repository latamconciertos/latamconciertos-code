import { UserPlus, Clock, UserCheck, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useFriendshipStatus,
  useSendFriendRequest, 
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend 
} from '@/hooks/queries/useFriends';

interface FriendshipButtonProps {
  currentUserId: string;
  targetUserId: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function FriendshipButton({ 
  currentUserId, 
  targetUserId,
  variant = 'default',
  size = 'default',
  className 
}: FriendshipButtonProps) {
  const { data: friendshipData, isLoading } = useFriendshipStatus(currentUserId, targetUserId);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  
  const isPending = sendRequest.isPending || acceptRequest.isPending || 
                   rejectRequest.isPending || removeFriend.isPending;

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const status = friendshipData?.status || 'none';
  const friendshipId = friendshipData?.friendshipId;

  switch (status) {
    case 'accepted':
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size={size} className={className}>
              <UserCheck className="h-4 w-4 mr-2" />
              Amigos
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => friendshipId && removeFriend.mutate(friendshipId)}
              className="text-destructive focus:text-destructive"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Eliminar amigo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    
    case 'sent':
      return (
        <Button variant="outline" size={size} disabled className={className}>
          <Clock className="h-4 w-4 mr-2" />
          Pendiente
        </Button>
      );
    
    case 'received':
      return (
        <div className="flex gap-2">
          <Button 
            size={size} 
            onClick={() => friendshipId && acceptRequest.mutate(friendshipId)}
            disabled={isPending}
            className={className}
          >
            Aceptar
          </Button>
          <Button 
            variant="outline" 
            size={size}
            onClick={() => friendshipId && rejectRequest.mutate(friendshipId)}
            disabled={isPending}
          >
            Rechazar
          </Button>
        </div>
      );
    
    case 'blocked':
      return (
        <Button variant="outline" size={size} disabled className={className}>
          Bloqueado
        </Button>
      );
    
    default:
      return (
        <Button 
          variant={variant} 
          size={size} 
          onClick={() => sendRequest.mutate({ requesterId: currentUserId, addresseeId: targetUserId })}
          disabled={isPending}
          className={className}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Agregar amigo
        </Button>
      );
  }
}
