import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
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
const BannersAdmin = lazy(() => import('@/components/admin/BannersAdmin').then(m => ({ default: m.BannersAdmin })));

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'news');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

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
      (_event, session) => {
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
        case 'banners': return <BannersAdmin />;
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
          <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10">
            <div className="px-4 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                  Gestor de Contenido
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
                <Button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-2.5">
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span className="hidden sm:inline text-xs">Salir</span>
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
