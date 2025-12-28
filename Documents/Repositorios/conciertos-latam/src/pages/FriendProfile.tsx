import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Music, Calendar, ArrowLeft, Users } from 'lucide-react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFriendProfile } from '@/hooks/queries/useFriends';
import { FriendshipButton } from '@/components/friends';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FriendConcert } from '@/types/entities/friendship';

const FriendProfile = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const { data, isLoading } = useFriendProfile(currentUserId ?? '', friendId ?? '');

  if (isLoading || !currentUserId) {
    return <LoadingSpinner message="Cargando perfil..." />;
  }

  if (!data || !data.profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-28 pb-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Usuario no encontrado</h1>
            <p className="text-muted-foreground mb-4">El perfil que buscas no existe</p>
            <Button onClick={() => navigate('/friends')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Amigos
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { profile, stats, concerts } = data;

  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.username || 'Usuario';

  const countryName = profile.countries?.name || null;
  const countryCode = profile.countries?.iso_code || null;
  const cityName = profile.cities?.name || null;

  const commonConcerts = concerts.filter((c: FriendConcert) => c.is_common);
  const upcomingConcerts = concerts.filter((c: FriendConcert) => c.date && new Date(c.date) >= new Date());

  return (
    <>
      <SEO
        title={`${displayName} | Amigos | Conciertos LATAM`}
        description={`Perfil de ${displayName} en Conciertos LATAM`}
      />
      <Header />
      <main className="min-h-screen bg-background pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/friends')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Amigos
          </Button>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-12 w-12 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 truncate">
                    {displayName}
                  </h1>
                  {profile.username && (
                    <p className="text-muted-foreground mb-3">@{profile.username}</p>
                  )}
                  
                  {(countryName || cityName) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[cityName, countryName].filter(Boolean).join(', ')}
                      </span>
                      {countryCode && (
                        <span className="text-lg">{getFlagEmoji(countryCode)}</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {stats && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <span><strong>{stats.total_concerts}</strong> conciertos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span><strong>{stats.common_concerts}</strong> en común</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span><strong>{stats.upcoming_concerts}</strong> próximos</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                {friendId && currentUserId !== friendId && (
                  <div className="sm:ml-auto">
                    <FriendshipButton
                      targetUserId={friendId}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Concerts Tabs */}
          <Tabs defaultValue="common" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="common" className="text-xs sm:text-sm">
                En Común ({commonConcerts.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                Próximos ({upcomingConcerts.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todos ({concerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common">
              <ConcertList concerts={commonConcerts} loading={false} emptyMessage="No tienen conciertos en común" />
            </TabsContent>

            <TabsContent value="upcoming">
              <ConcertList concerts={upcomingConcerts} loading={false} emptyMessage="No tiene conciertos próximos" />
            </TabsContent>

            <TabsContent value="all">
              <ConcertList concerts={concerts} loading={false} emptyMessage="No ha asistido a ningún concierto" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

// Helper component for concert list
const ConcertList = ({ 
  concerts, 
  loading, 
  emptyMessage 
}: { 
  concerts: FriendConcert[];
  loading: boolean;
  emptyMessage: string;
}) => {
  if (loading) {
    return <LoadingSpinner message="Cargando conciertos..." />;
  }

  if (concerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {concerts.map((concert) => (
        <Link key={concert.id} to={`/concerts/${concert.slug}`}>
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex gap-4">
              {concert.image_url ? (
                <img
                  src={concert.image_url}
                  alt={concert.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Music className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground truncate">{concert.title}</h3>
                {concert.artist_name && (
                  <p className="text-sm text-muted-foreground truncate">{concert.artist_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {concert.date && (
                    <span>{format(new Date(concert.date), "d MMM yyyy", { locale: es })}</span>
                  )}
                  {concert.city_name && (
                    <>
                      <span>•</span>
                      <span>{concert.city_name}</span>
                    </>
                  )}
                </div>
                {concert.is_common && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    En común
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

// Helper function for flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default FriendProfile;
