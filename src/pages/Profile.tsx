import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trophy, Calendar, CheckCircle, Heart, Share2, Download } from 'lucide-react';
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
    avatar_url: string | null;
    bio: string | null;
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
        avatar_url: profile.avatar_url,
        bio: profile.bio,
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
        profileData: {
          ...validatedData,
          avatar_url: localProfile.avatar_url,
          bio: localProfile.bio?.trim() || null,
        },
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

  // Export upcoming concerts to ICS
  const exportToICS = () => {
    const upcoming = concertsData?.upcoming || [];
    if (upcoming.length === 0) return;

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Conciertos Latam//ES\r\nCALSCALE:GREGORIAN\r\n';
    upcoming.forEach(concert => {
      if (!concert.date) return;
      const date = new Date(concert.date);
      const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      ics += `BEGIN:VEVENT\r\nUID:${concert.id}@conciertoslatam.com\r\nDTSTAMP:${dateStr}\r\nDTSTART:${dateStr}\r\n`;
      ics += `SUMMARY:${concert.title}\r\nDESCRIPTION:Concierto de ${concert.artist?.name || 'Artista'}\r\n`;
      ics += `LOCATION:${concert.venue?.name || ''}\r\nEND:VEVENT\r\n`;
    });
    ics += 'END:VCALENDAR\r\n';

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis-conciertos.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Calendario exportado');
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
      <main className="min-h-screen bg-background pt-24 sm:pt-28 pb-8">
        <div className="mx-auto px-4 max-w-lg sm:max-w-xl lg:max-w-4xl">
          {/* Profile Header */}
          <ProfileHeader
            displayName={displayName}
            username={localProfile.username}
            location={locationString}
            bio={localProfile.bio}
            avatarUrl={localProfile.avatar_url}
            stats={{
              concerts: concertsData?.stats.totalConcerts || 0,
              artists: selectedArtists.length,
              friends: friendsCount,
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="flex-1 h-9 text-sm font-semibold rounded-lg"
              onClick={() => setEditSheetOpen(true)}
            >
              Editar perfil
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-9 text-sm font-semibold rounded-lg"
              onClick={() => setArtistsSheetOpen(true)}
            >
              Artistas favoritos
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 flex-shrink-0 rounded-lg"
              onClick={async () => {
                const profileUrl = `${window.location.origin}/profile/${localProfile.username}`;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: displayName, url: profileUrl });
                  } catch { /* user cancelled */ }
                } else {
                  await navigator.clipboard.writeText(profileUrl);
                  toast.success('Enlace de perfil copiado');
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs - Instagram style with top border */}
          <Tabs defaultValue="upcoming" className="w-full mt-6">
            <TabsList className="w-full h-auto p-0 bg-transparent border-t border-border rounded-none grid grid-cols-4">
              <TabsTrigger
                value="upcoming"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground"
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs hidden sm:inline">Próximos</span>
              </TabsTrigger>
              <TabsTrigger
                value="attended"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs hidden sm:inline">Asistidos</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs hidden sm:inline">Favoritos</span>
              </TabsTrigger>
              <TabsTrigger
                value="badges"
                className="rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground data-[state=active]:text-foreground"
              >
                <Trophy className="h-5 w-5" />
                <span className="text-xs hidden sm:inline">Insignias</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-0">
              {(concertsData?.upcoming?.length || 0) > 0 && (
                <div className="flex justify-end py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5 text-muted-foreground"
                    onClick={exportToICS}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar calendario
                  </Button>
                </div>
              )}
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

            <TabsContent value="badges" className="mt-4">
              <BadgesDisplay userId={profile.id} />
            </TabsContent>
          </Tabs>
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
