import { useNavigate } from 'react-router-dom';
import { useRequireAdmin } from '@/hooks/admin/useRequireAdmin';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Layers,
  ClipboardList,
  LogOut,
  Newspaper,
  Calendar,
  Music,
  BadgeCheck,
  Users,
  TrendingUp,
  ArrowRight,
  Home,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const AdminPortal = () => {
  const { user, isReady } = useRequireAdmin();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isReady) {
    return (
      <div className="dark font-fira min-h-screen flex items-center justify-center bg-noche text-texto">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    // "Evolución Nocturna": el panel también vive sobre la noche
    <div className="dark font-fira min-h-screen bg-noche text-texto">
      {/* Header */}
      <header className="border-b border-linea">
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground h-8 -ml-2"
          >
            <Home className="h-3.5 w-3.5 mr-1.5" />
            Ir al sitio
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
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
      <main className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Glow de cobalto detrás del hero, nunca color plano */}
        <div
          className="absolute left-1/2 top-0 h-[280px] w-[min(560px,90vw)] -translate-x-1/2 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(117,22,226,.35), transparent 70%)', filter: 'blur(100px)' }}
        />
        <div className="relative text-center mb-12">
          <img src={logo} alt="Conciertos Latam" className="h-32 mx-auto mb-6" />
          <span className="eyebrow-nocturno justify-center mb-3">Equipo Conciertos Latam</span>
          <h1 className="font-display uppercase text-4xl md:text-5xl font-black tracking-[0.01em] leading-none text-texto">
            Panel de administración
          </h1>
          <p className="text-texto-2 mt-3">
            Selecciona el módulo con el que quieres trabajar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Content Management */}
          <button
            onClick={() => navigate('/admin/content')}
            className="group relative overflow-hidden rounded-[20px] border border-linea bg-superficie p-8 text-left transition-all hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cobalto/15 blur-2xl rounded-full -translate-y-8 translate-x-8 group-hover:bg-cobalto/25 transition-colors" />

            <div className="relative">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-periwinkle/10 text-periwinkle mb-5">
                <Layers className="h-7 w-7" />
              </div>

              <h2 className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-texto mb-2">Gestor de Contenido</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Administra la plataforma: noticias, artistas, conciertos, venues, festivales y más.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <ModuleTag icon={Newspaper} label="Noticias" />
                <ModuleTag icon={Music} label="Artistas" />
                <ModuleTag icon={Calendar} label="Conciertos" />
                <ModuleTag icon={TrendingUp} label="Spotify" />
              </div>

              <div className="flex items-center text-sm font-medium text-periwinkle">
                Abrir módulo
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Operations */}
          <button
            onClick={() => navigate('/admin/operations')}
            className="group relative overflow-hidden rounded-[20px] border border-linea bg-superficie p-8 text-left transition-all hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cobalto/15 blur-2xl rounded-full -translate-y-8 translate-x-8 group-hover:bg-cobalto/25 transition-colors" />

            <div className="relative">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-periwinkle/10 text-periwinkle mb-5">
                <ClipboardList className="h-7 w-7" />
              </div>

              <h2 className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-texto mb-2">Operaciones</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Gestiona acreditaciones, deadlines, asignación de equipo y logística de eventos.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <ModuleTag icon={BadgeCheck} label="Acreditaciones" />
                <ModuleTag icon={Users} label="Equipo" />
                <ModuleTag icon={Calendar} label="Agenda" />
              </div>

              <div className="flex items-center text-sm font-medium text-periwinkle">
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
    <span className="inline-flex items-center gap-1 rounded-full border border-linea bg-superficie-2 px-2.5 py-1 text-xs text-texto-2">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default AdminPortal;
