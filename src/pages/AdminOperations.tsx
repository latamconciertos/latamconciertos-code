import { useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { OperationsSidebar } from '@/components/admin/OperationsSidebar';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useRequireAdmin } from '@/hooks/admin/useRequireAdmin';
import { useAuth } from '@/hooks/useAuth';

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
      <div className="min-h-screen flex w-full bg-background">
        <OperationsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10">
            <div className="px-4 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                  Operaciones
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
                <Button
                  onClick={() => logout('manual')}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 px-2.5"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span className="hidden sm:inline text-xs">Salir</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            {renderTab()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminOperations;
