import { useState, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { OperationsSidebar } from '@/components/admin/OperationsSidebar';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useRequireAdmin } from '@/hooks/admin/useRequireAdmin';
import { useAuth } from '@/hooks/useAuth';
import adminLogo from '@/assets/admin-logo.png';

const OperationsDashboard = lazy(() =>
  import('@/components/admin/OperationsDashboard').then((m) => ({
    default: m.OperationsDashboard,
  })),
);
const AccreditationsAdmin = lazy(() =>
  import('@/components/admin/AccreditationsAdmin').then((m) => ({
    default: m.AccreditationsAdmin,
  })),
);
const AccreditationsCalendar = lazy(() =>
  import('@/components/admin/AccreditationsCalendar').then((m) => ({
    default: m.AccreditationsCalendar,
  })),
);
const AccreditationsKanban = lazy(() =>
  import('@/components/admin/AccreditationsKanban').then((m) => ({
    default: m.AccreditationsKanban,
  })),
);
const ContactsAdmin = lazy(() =>
  import('@/components/admin/ContactsAdmin').then((m) => ({
    default: m.ContactsAdmin,
  })),
);

const AdminOperations = () => {
  const { user, isReady } = useRequireAdmin();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'dashboard',
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  const renderTab = () => {
    const content = (() => {
      switch (activeTab) {
        case 'dashboard':
          return <OperationsDashboard onNavigate={handleTabChange} />;
        case 'calendar':
          return <AccreditationsCalendar />;
        case 'accreditations':
          return <AccreditationsAdmin />;
        case 'kanban':
          return <AccreditationsKanban />;
        case 'contacts':
          return <ContactsAdmin />;
        default:
          return <OperationsDashboard onNavigate={handleTabChange} />;
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
      <div className="min-h-screen flex flex-col w-full bg-background">
        {/* Full-width topbar — spans the entire viewport */}
        <header className="h-[52px] border-b border-border/50 bg-background sticky top-0 z-20">
          <div className="h-full px-5 flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-2.5 group/brand"
              aria-label="Ir al portal de administración"
            >
              <img src={adminLogo} alt="" className="h-7 w-7 object-contain" />
              <span className="hidden sm:inline font-display text-lg font-black text-primary leading-none tracking-tight">
                ADMIN
              </span>
            </Link>

            <span className="hidden md:block h-5 w-px bg-border" aria-hidden="true" />

            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs">
              <span className="font-bold uppercase tracking-[0.18em] text-foreground">
                Operaciones
              </span>
            </nav>

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground hidden lg:block max-w-[200px] truncate">
              {user?.email}
            </span>
            <Button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button
              onClick={() => logout('manual')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 -mr-1"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.15em]">
                Salir
              </span>
            </Button>
          </div>
        </header>

        {/* Body: sidebar + content side by side, below the topbar */}
        <div className="flex-1 flex w-full">
          <OperationsSidebar activeTab={activeTab} onTabChange={handleTabChange} />

          <main className="flex-1 container mx-auto px-4 py-8 min-w-0">
            {renderTab()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminOperations;
