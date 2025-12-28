/**
 * Friends React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '@/services/friendService';
import { toast } from 'sonner';

export const friendQueryKeys = {
  all: ['friends'] as const,
  friends: (userId: string) => [...friendQueryKeys.all, 'list', userId] as const,
  pendingRequests: (userId: string) => [...friendQueryKeys.all, 'pending', userId] as const,
  pendingCount: (userId: string) => [...friendQueryKeys.all, 'pending-count', userId] as const,
  search: (userId: string, query: string) => [...friendQueryKeys.all, 'search', userId, query] as const,
  profile: (userId: string, friendId: string) => [...friendQueryKeys.all, 'profile', userId, friendId] as const,
  status: (userId: string, otherUserId: string) => [...friendQueryKeys.all, 'status', userId, otherUserId] as const,
  invitations: (userId: string) => [...friendQueryKeys.all, 'invitations', userId] as const,
  invitationsCount: (userId: string) => [...friendQueryKeys.all, 'invitations-count', userId] as const,
  upcomingConcerts: (userId: string) => [...friendQueryKeys.all, 'upcoming-concerts', userId] as const,
  totalNotifications: (userId: string) => [...friendQueryKeys.all, 'total-notifications', userId] as const,
};

// =========================================================================
// Query Hooks
// =========================================================================

export function useFriends(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.friends(userId || ''),
    queryFn: () => friendService.getFriends(userId!),
    enabled: !!userId,
  });
}

export function usePendingRequests(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.pendingRequests(userId || ''),
    queryFn: () => friendService.getPendingRequests(userId!),
    enabled: !!userId,
  });
}

export function usePendingRequestsCount(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.pendingCount(userId || ''),
    queryFn: () => friendService.getPendingRequestsCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSearchUsers(userId: string | undefined, query: string) {
  return useQuery({
    queryKey: friendQueryKeys.search(userId || '', query),
    queryFn: () => friendService.searchUsers(userId!, query),
    enabled: !!userId && query.length >= 2,
  });
}

export function useFriendProfile(userId: string | undefined, friendId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.profile(userId || '', friendId || ''),
    queryFn: () => friendService.getFriendProfile(userId!, friendId!),
    enabled: !!userId && !!friendId,
  });
}

export function useFriendshipStatus(userId: string | undefined, otherUserId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.status(userId || '', otherUserId || ''),
    queryFn: () => friendService.getFriendshipStatus(userId!, otherUserId!),
    enabled: !!userId && !!otherUserId && userId !== otherUserId,
  });
}

export function useConcertInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.invitations(userId || ''),
    queryFn: () => friendService.getConcertInvitations(userId!),
    enabled: !!userId,
  });
}

export function useConcertInvitationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.invitationsCount(userId || ''),
    queryFn: () => friendService.getConcertInvitationsCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export function useUserUpcomingConcerts(userId: string | undefined) {
  return useQuery({
    queryKey: friendQueryKeys.upcomingConcerts(userId || ''),
    queryFn: () => friendService.getUserUpcomingConcerts(userId!),
    enabled: !!userId,
  });
}

export function useTotalFriendNotifications(userId: string | undefined) {
  const pendingCount = usePendingRequestsCount(userId);
  const invitationsCount = useConcertInvitationsCount(userId);
  
  return {
    data: (pendingCount.data || 0) + (invitationsCount.data || 0),
    isLoading: pendingCount.isLoading || invitationsCount.isLoading,
  };
}

// =========================================================================
// Mutation Hooks
// =========================================================================

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) =>
      friendService.sendFriendRequest(requesterId, addresseeId),
    onSuccess: (_, { requesterId }) => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success('Solicitud de amistad enviada');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Ya existe una solicitud de amistad');
      } else {
        toast.error('Error al enviar solicitud');
      }
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (friendshipId: string) => friendService.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success('Solicitud aceptada');
    },
    onError: () => {
      toast.error('Error al aceptar solicitud');
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (friendshipId: string) => friendService.rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success('Solicitud rechazada');
    },
    onError: () => {
      toast.error('Error al rechazar solicitud');
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (friendshipId: string) => friendService.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success('Amigo eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar amigo');
    },
  });
}

export function useSendConcertInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ senderId, receiverId, concertId, message }: { 
      senderId: string; 
      receiverId: string; 
      concertId: string;
      message?: string;
    }) => friendService.sendConcertInvitation(senderId, receiverId, concertId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success('Invitación enviada');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Ya has invitado a este amigo a este concierto');
      } else {
        toast.error('Error al enviar invitación');
      }
    },
  });
}

export function useRespondToConcertInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invitationId, accept }: { invitationId: string; accept: boolean }) =>
      friendService.respondToConcertInvitation(invitationId, accept),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      toast.success(accept ? 'Invitación aceptada' : 'Invitación rechazada');
    },
    onError: () => {
      toast.error('Error al responder invitación');
    },
  });
}
