import { Link, useNavigate } from "react-router-dom";
import { X, Home, Calendar, Trophy, BarChart2, FileText, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  session: boolean;
}

const navLinks = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/calendario-publico", label: "Calendario", icon: Calendar },
  { to: "/escalafon-publico", label: "Escalafón", icon: Trophy },
  { to: "/resultados-publicos", label: "Resultados", icon: BarChart2 },
  { to: "/procesos-publicos", label: "Procesos", icon: FileText },
];

export const MobileNav = ({ isOpen, onClose, session }: MobileNavProps) => {
  const navigate = useNavigate();

  const handleNav = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <div
      className={cn(
        "md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-72 max-w-[85vw] bg-white dark:bg-[#111520] shadow-2xl flex flex-col">

        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ea384c] via-[#F97316] to-[#FFE91F] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <img
              src="/lovable-uploads/35ec94dc-4cfc-4118-9247-0a6af737c36e.png"
              alt="Liga de Bolo de Bogotá"
              className="h-10 w-auto"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
              Liga de Bolo<br />de Bogotá
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-[#ea384c] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              onClick={() => handleNav(to)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-[#ea384c] dark:hover:bg-white/5 dark:hover:text-[#ea384c] transition-all duration-200 group"
            >
              <span className="flex-shrink-0 p-1.5 rounded-lg bg-gray-100 dark:bg-white/8 group-hover:bg-red-100 dark:group-hover:bg-[#ea384c]/20 transition-colors">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Auth section */}
        <div className="px-4 py-5 border-t border-gray-100 dark:border-white/10 flex-shrink-0 space-y-2">
          {session ? (
            <Button
              onClick={() => handleNav("/dashboard")}
              className="w-full gap-2 bg-gradient-to-r from-[#ea384c] via-[#F97316] to-[#FFE91F] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <LayoutDashboard className="h-4 w-4" />
              Ir a la Plataforma
            </Button>
          ) : (
            <>
              <Button
                onClick={() => handleNav("/signin")}
                variant="outline"
                className="w-full gap-2 rounded-xl border-gray-200 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
              >
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => handleNav("/signup")}
                className="w-full gap-2 bg-gradient-to-r from-[#ea384c] via-[#F97316] to-[#FFE91F] text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                Registrarse
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
