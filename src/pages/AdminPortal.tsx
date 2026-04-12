import { useNavigate } from 'react-router-dom';
import { useRequireAdmin } from '@/hooks/admin/useRequireAdmin';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import {
  Layers,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  Newspaper,
  Calendar,
  Music,
  BadgeCheck,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import logoPrincipal from '@/assets/logo-principal.png';

const AdminPortal = () => {
  const { user, isReady } = useRequireAdmin();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-end">
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
              variant="ghost"
              size="sm"
              onClick={() => logout('manual')}
              className="text-muted-foreground h-8"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <img src={logoPrincipal} alt="Conciertos Latam" className="h-32 mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona el módulo con el que quieres trabajar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Content Management */}
          <button
            onClick={() => navigate('/admin/content')}
            className="group relative overflow-hidden rounded-2xl border bg-card p-8 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-blue-500/10 transition-colors" />

            <div className="relative">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-500/10 text-blue-500 mb-5">
                <Layers className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-bold mb-2">Gestor de Contenido</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Administra la plataforma: noticias, artistas, conciertos, venues, festivales y más.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <ModuleTag icon={Newspaper} label="Noticias" />
                <ModuleTag icon={Music} label="Artistas" />
                <ModuleTag icon={Calendar} label="Conciertos" />
                <ModuleTag icon={TrendingUp} label="Spotify" />
              </div>

              <div className="flex items-center text-sm font-medium text-primary">
                Abrir módulo
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Operations */}
          <button
            onClick={() => navigate('/admin/operations')}
            className="group relative overflow-hidden rounded-2xl border bg-card p-8 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-purple-500/10 transition-colors" />

            <div className="relative">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-purple-500/10 text-purple-500 mb-5">
                <ClipboardList className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-bold mb-2">Operaciones</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Gestiona acreditaciones, deadlines, asignación de equipo y logística de eventos.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <ModuleTag icon={BadgeCheck} label="Acreditaciones" />
                <ModuleTag icon={Users} label="Equipo" />
                <ModuleTag icon={Calendar} label="Agenda" />
              </div>

              <div className="flex items-center text-sm font-medium text-primary">
                Abrir módulo
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

function ModuleTag({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default AdminPortal;
