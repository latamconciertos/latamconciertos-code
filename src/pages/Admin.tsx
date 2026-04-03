import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';

// Lazy loaded admin components
const UsersAdmin = lazy(() => import('@/components/admin/UsersAdmin').then(m => ({ default: m.UsersAdmin })));
const NewsAdminNew = lazy(() => import('@/components/admin/NewsAdminNew').then(m => ({ default: m.NewsAdminNew })));
const MediaAdmin = lazy(() => import('@/components/admin/MediaAdmin').then(m => ({ default: m.MediaAdmin })));
const GalleryAdmin = lazy(() => import('@/components/admin/GalleryAdmin').then(m => ({ default: m.GalleryAdmin })));
const ArtistsAdmin = lazy(() => import('@/components/admin/ArtistsAdmin').then(m => ({ default: m.ArtistsAdmin })));
const VenuesAdmin = lazy(() => import('@/components/admin/VenuesAdmin').then(m => ({ default: m.VenuesAdmin })));
const ConcertsAdmin = lazy(() => import('@/components/admin/ConcertsAdmin').then(m => ({ default: m.ConcertsAdmin })));
const PromotersAdmin = lazy(() => import('@/components/admin/PromotersAdmin').then(m => ({ default: m.PromotersAdmin })));
const PWAAdmin = lazy(() => import('@/components/admin/PWAAdmin').then(m => ({ default: m.PWAAdmin })));
const AdsAdmin = lazy(() => import('@/components/admin/AdsAdmin').then(m => ({ default: m.AdsAdmin })));
const AdvertisingAdmin = lazy(() => import('@/components/admin/AdvertisingAdmin'));
const SpotifyChartsAdmin = lazy(() => import('@/components/admin/SpotifyChartsAdmin').then(m => ({ default: m.SpotifyChartsAdmin })));
const TrafficAdmin = lazy(() => import('@/components/admin/TrafficAdmin').then(m => ({ default: m.TrafficAdmin })));
const SocialNetworksAdmin = lazy(() => import('@/components/admin/SocialNetworksAdmin').then(m => ({ default: m.SocialNetworksAdmin })));
const SetlistContributionsAdmin = lazy(() => import('@/components/admin/SetlistContributionsAdmin').then(m => ({ default: m.SetlistContributionsAdmin })));
const FanProjectsAdmin = lazy(() => import('@/components/admin/FanProjectsAdmin').then(m => ({ default: m.FanProjectsAdmin })));
const FestivalsAdmin = lazy(() => import('@/components/admin/FestivalsAdmin').then(m => ({ default: m.FestivalsAdmin })));

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'news');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasAdminRole = roles?.some(r => r.role === 'admin');

      if (!hasAdminRole) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = () => {
    logout('manual');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderActiveTab = () => {
    const content = (() => {
      switch (activeTab) {
        case 'news': return <NewsAdminNew />;
        case 'media': return <MediaAdmin />;
        case 'gallery': return <GalleryAdmin />;
        case 'artists': return <ArtistsAdmin />;
        case 'venues': return <VenuesAdmin />;
        case 'concerts': return <ConcertsAdmin />;
        case 'festivals': return <FestivalsAdmin />;
        case 'promoters': return <PromotersAdmin />;
        case 'users': return <UsersAdmin />;
        case 'ads': return <AdsAdmin />;
        case 'advertising': return <AdvertisingAdmin />;
        case 'spotify': return <SpotifyChartsAdmin />;
        case 'social': return <SocialNetworksAdmin />;
        case 'setlist-contributions': return <SetlistContributionsAdmin />;
        case 'traffic': return <TrafficAdmin />;
        case 'pwa': return <PWAAdmin />;
        case 'fan-projects': return <FanProjectsAdmin />;
        default: return <NewsAdminNew />;
      }
    })();

    return (
      <Suspense fallback={<LoadingSpinnerInline size="md" />}>
        {content}
      </Suspense>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Panel de Administración</h1>
                  <p className="text-sm text-muted-foreground">Gestiona tu plataforma de conciertos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            {renderActiveTab()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
