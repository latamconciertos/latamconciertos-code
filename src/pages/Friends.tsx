import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Search, Mail, Ticket } from 'lucide-react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  useFriends,
  usePendingRequests,
  useSearchUsers,
  useConcertInvitations,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
  useRespondToConcertInvitation,
} from '@/hooks/queries/useFriends';
import {
  FriendCard,
  FriendRequestCard,
  UserSearchCard,
  ConcertInvitationCard,
} from '@/components/friends';

const Friends = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // React Query hooks
  const { data: friends = [], isLoading: friendsLoading } = useFriends(userId ?? '');
  const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingRequests(userId ?? '');
  const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(userId ?? '', debouncedSearch);
  const { data: invitations = [], isLoading: invitationsLoading } = useConcertInvitations(userId ?? '');

  // Mutations
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const sendRequest = useSendFriendRequest();
  const respondInvitation = useRespondToConcertInvitation();

  const pendingCount = pendingRequests.length;
  const invitationsCount = invitations.filter(inv => inv.status === 'pending').length;

  if (!userId) {
    return <LoadingSpinner message="Verificando sesión..." />;
  }

  return (
    <>
      <SEO
        title="Conexiones | Conciertos LATAM"
        description="Conecta con otros fans, envía solicitudes de amistad e invita a tus amigos a conciertos"
      />
      <Header />
      <main className="min-h-screen bg-background pt-20 sm:pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header - Compact */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Conexiones
            </h1>
            <p className="text-sm text-muted-foreground">
              Conecta con otros fans
            </p>
          </div>

          <Tabs defaultValue="friends" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-10 p-0.5 bg-muted/50">
              <TabsTrigger 
                value="friends" 
                className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-background"
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Amigos</span>
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-background"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Solicitudes</span>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-4 px-1 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="invitations" 
                className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-background"
              >
                <Ticket className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Invitaciones</span>
                {invitationsCount > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-4 px-1 text-[10px]">
                    {invitationsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="search" 
                className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-background"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Buscar</span>
              </TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-4">
              {friendsLoading ? (
                <LoadingSpinner message="Cargando amigos..." />
              ) : friends.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">Sin amigos aún</h3>
                  <p className="text-xs text-muted-foreground">
                    Busca usuarios para conectar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onRemove={(friendshipId) => removeFriend.mutate(friendshipId)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="mt-4">
              {requestsLoading ? (
                <LoadingSpinner message="Cargando solicitudes..." />
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Mail className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">Sin solicitudes</h3>
                  <p className="text-xs text-muted-foreground">
                    Las solicitudes aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      onAccept={(id) => acceptRequest.mutate(id)}
                      onReject={(id) => rejectRequest.mutate(id)}
                      isLoading={acceptRequest.isPending || rejectRequest.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="mt-4">
              {invitationsLoading ? (
                <LoadingSpinner message="Cargando invitaciones..." />
              ) : invitations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Ticket className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">Sin invitaciones</h3>
                  <p className="text-xs text-muted-foreground">
                    Las invitaciones aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <ConcertInvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={(invitationId, concertId) => respondInvitation.mutate({ invitationId, accept: true })}
                      onDecline={(invitationId) => respondInvitation.mutate({ invitationId, accept: false })}
                      isLoading={respondInvitation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm bg-muted/30 border-border/50 focus:bg-background"
                />
              </div>

              {/* Search Results */}
              {searchLoading ? (
                <LoadingSpinner message="Buscando..." />
              ) : debouncedSearch.length < 2 ? (
                <div className="text-center py-8 px-4">
                  <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Escribe al menos 2 caracteres
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No se encontró "{debouncedSearch}"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <UserSearchCard
                      key={user.id}
                      user={user}
                      onSendRequest={(targetId) => sendRequest.mutate({ requesterId: userId, addresseeId: targetId })}
                      onCancelRequest={() => {}}
                      isLoading={sendRequest.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Friends;
