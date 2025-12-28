import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Edit, Music, Trophy, Calendar, CheckCircle, Heart } from 'lucide-react';
import BadgesDisplay from '@/components/BadgesDisplay';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { profileSchema } from '@/lib/validation';
import { z } from 'zod';
import {
  useUserProfile,
  useProfileCountries,
  useProfileCities,
  useProfileArtists,
  useUpdateProfile,
} from '@/hooks/queries/useProfile';
import { useProfileConcerts, useFriendsCount } from '@/hooks/queries/useProfileConcerts';
import {
  ProfileHeader,
  ProfileEditSheet,
  FavoriteArtistsSheet,
  ConcertGrid,
} from '@/components/profile';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [artistsSheetOpen, setArtistsSheetOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    country_id: string | null;
    city_id: string | null;
    birth_date: string | null;
  } | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

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

  // React Query hooks
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId ?? undefined);
  const { data: countries = [] } = useProfileCountries();
  const { data: cities = [] } = useProfileCities(localProfile?.country_id ?? null);
  const { data: artists = [] } = useProfileArtists();
  const { data: concertsData } = useProfileConcerts(userId ?? undefined);
  const { data: friendsCount = 0 } = useFriendsCount(userId ?? undefined);
  const updateProfile = useUpdateProfile();

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        country_id: profile.country_id,
        city_id: profile.city_id,
        birth_date: profile.birth_date,
      });
      const artists = profile.favorite_artists;
      setSelectedArtists(
        Array.isArray(artists)
          ? artists.filter((item): item is string => typeof item === 'string')
          : []
      );
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile || !localProfile) return;

    try {
      const validatedData = profileSchema.parse({
        first_name: localProfile.first_name?.trim() || '',
        last_name: localProfile.last_name?.trim() || '',
        username: localProfile.username?.trim() || '',
        country_id: localProfile.country_id || null,
        city_id: localProfile.city_id || null,
        birth_date: localProfile.birth_date || '',
      });

      await updateProfile.mutateAsync({
        userId: profile.id,
        profileData: validatedData,
        favoriteArtists: selectedArtists,
      });

      toast.success('Perfil actualizado');
      setEditSheetOpen(false);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error((error as Error).message || 'Error al actualizar');
      }
    }
  };

  const handleSaveArtists = async () => {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        profileData: {},
        favoriteArtists: selectedArtists,
      });

      toast.success('Artistas actualizados');
      setArtistsSheetOpen(false);
    } catch (error) {
      toast.error('Error al actualizar artistas');
    }
  };

  const toggleArtist = (artistId: string) => {
    setSelectedArtists(prev =>
      prev.includes(artistId)
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  // Get location string
  const selectedCountry = countries.find(c => c.id === localProfile?.country_id);
  const selectedCity = cities.find(c => c.id === localProfile?.city_id);
  const locationString = [selectedCity?.name, selectedCountry?.name].filter(Boolean).join(', ') || null;

  if (profileLoading || !userId) {
    return <LoadingSpinner message="Cargando perfil..." />;
  }

  if (!profile || !localProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const displayName = [localProfile.first_name, localProfile.last_name].filter(Boolean).join(' ') || 'Usuario';

  return (
    <>
      <SEO
        title="Mi Perfil"
        description="Administra tu información personal y preferencias musicales"
      />
      <Header />
      <main className="min-h-screen bg-background pt-20 sm:pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Profile Header */}
          <ProfileHeader
            displayName={displayName}
            username={localProfile.username}
            location={locationString}
            stats={{
              concerts: concertsData?.stats.totalConcerts || 0,
              artists: selectedArtists.length,
              friends: friendsCount,
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 mb-8">
            <Button
              variant="outline"
              className="flex-1 h-10 gap-2"
              onClick={() => setEditSheetOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Editar perfil
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 gap-2"
              onClick={() => setArtistsSheetOpen(true)}
            >
              <Music className="h-4 w-4" />
              Artistas favoritos
            </Button>
          </div>

          {/* Concert Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="upcoming" className="gap-1.5 text-xs sm:text-sm">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Próximos</span>
                <span className="sm:hidden">Próx.</span>
                {(concertsData?.stats.upcomingCount || 0) > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {concertsData?.stats.upcomingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attended" className="gap-1.5 text-xs sm:text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Asistidos</span>
                <span className="sm:hidden">Asist.</span>
                {(concertsData?.stats.attendedCount || 0) > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {concertsData?.stats.attendedCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1.5 text-xs sm:text-sm">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoritos</span>
                <span className="sm:hidden">Favs</span>
                {(concertsData?.stats.favoritesCount || 0) > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {concertsData?.stats.favoritesCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-0">
              <ConcertGrid
                concerts={concertsData?.upcoming || []}
                emptyMessage="No tienes conciertos próximos"
                emptyIcon="calendar"
              />
            </TabsContent>

            <TabsContent value="attended" className="mt-0">
              <ConcertGrid
                concerts={concertsData?.attended || []}
                emptyMessage="Aún no has asistido a ningún concierto"
                emptyIcon="music"
              />
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              <ConcertGrid
                concerts={concertsData?.favorites || []}
                emptyMessage="No tienes conciertos favoritos"
                emptyIcon="music"
              />
            </TabsContent>
          </Tabs>

          {/* Badges Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              Mis Insignias
            </div>
            <BadgesDisplay userId={profile.id} />
          </div>
        </div>
      </main>
      <Footer />

      {/* Edit Profile Sheet */}
      <ProfileEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        localProfile={localProfile}
        setLocalProfile={setLocalProfile}
        countries={countries}
        cities={cities}
        onSave={handleSaveProfile}
        isSaving={updateProfile.isPending}
      />

      {/* Favorite Artists Sheet */}
      <FavoriteArtistsSheet
        open={artistsSheetOpen}
        onOpenChange={setArtistsSheetOpen}
        artists={artists}
        selectedArtists={selectedArtists}
        onToggleArtist={toggleArtist}
        onSave={handleSaveArtists}
        isSaving={updateProfile.isPending}
      />
    </>
  );
};

export default Profile;
