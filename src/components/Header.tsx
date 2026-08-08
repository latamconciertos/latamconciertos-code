import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, User, Settings, Moon, Sun, Calendar, LogOut, Home, Mic2, Music2, BookOpen, ListMusic, Lightbulb, Users, ChevronDown, Bot, Sparkles, Bell } from "lucide-react";
import { PushSubscribeDialog } from "@/components/admin/PushSubscribeDialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import logo from "@/assets/logo.png";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

interface HeaderProps {
  visible?: boolean;
}

const Header = ({ visible = true }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [pendingNotifications] = useState(0);
  const [experienciasOpen, setExperienciasOpen] = useState(false);
  const [miCuentaOpen, setMiCuentaOpen] = useState(false);
  const [wrappedActive, setWrappedActive] = useState(false);
  const { theme, setTheme } = useTheme() || { theme: 'system', setTheme: () => { } };
  const { logout } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
          const isAdminUser = roles?.some((r) => r.role === "admin") || false;
          setIsAdmin(isAdminUser);

          // Obtener nombre del usuario
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, username")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            const displayName = profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.username || session.user.email?.split('@')[0] || 'Usuario';
            setUserName(displayName);
          }
        }
      } catch (error) {
        console.error('[Header] Error checking auth:', error);
      }
    };

    checkAuth();

    // Check if wrapped banner is active
    (supabase as any)
      .from('site_banners')
      .select('active')
      .eq('slug', 'wrapped-2026')
      .maybeSingle()
      .then(({ data }: { data: { active: boolean } | null }) => {
        setWrappedActive(data?.active ?? false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
            const isAdminUser = roles?.some((r) => r.role === "admin") || false;
            setIsAdmin(isAdminUser);

            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name, username")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              const displayName = profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username || session.user.email?.split('@')[0] || 'Usuario';
              setUserName(displayName);
            }
          } catch (error) {
            console.error('[Header] Error fetching roles:', error);
            setIsAdmin(false);
          }
        }, 0);
      } else {
        setIsAdmin(false);
        setUserName("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // "Inicio" no va en el menú de escritorio: el logo ya lleva al home
  const mainNavItems = [
    { name: "Conciertos", path: "/concerts", icon: Music2 },
    { name: "Artistas", path: "/artists", icon: Mic2 },
    { name: "Noticias", path: "/blog", icon: BookOpen },
  ];

  const mobileNavItems = [{ name: "Inicio", path: "/", icon: Home }, ...mainNavItems];

  const location = useLocation();
  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/concerts")
      return location.pathname.startsWith("/concerts") || location.pathname.startsWith("/conciertos");
    return location.pathname.startsWith(path);
  };

  const experienciasItems = [
    { name: "Asistente IA", path: "/ai-assistant", icon: Bot },
    { name: "Setlists", path: "/setlists", icon: ListMusic },
    { name: "Proyectos Fans", path: "/fan-projects", icon: Lightbulb },
  ];

  const miCuentaItems = [
    { name: "Perfil", path: "/profile", icon: User },
    ...(wrappedActive ? [{ name: "Mi Wrapped", path: "/wrapped", icon: Sparkles }] : []),
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}
    >
      <nav className="bg-[#070D1F]/85 backdrop-blur-lg border-b border-[rgba(131,180,255,.12)] px-4 sm:px-6 lg:px-8">
        {/* Grilla de 3 columnas: el menú central queda centrado respecto a la barra,
            sin importar cuánto pesen el logo (izq) o los iconos (der) */}
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] h-16 items-center">
          {/* Logo */}
          {/* El logo sobresale un poco por debajo de la barra (self-start evita que
              se recorte contra el borde superior de la pantalla) */}
          <Link to="/" className="flex items-start space-x-3 group justify-self-start self-start">
            <img
              src={logo}
              alt="Conciertos LATAM"
              className="h-[4.5rem] w-auto object-contain transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative text-sm font-fira font-medium px-4 py-2 rounded-lg transition-all",
                    isActive
                      ? "text-white after:absolute after:left-4 after:right-4 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-verde"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Experiencias con hover */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "relative bg-transparent text-sm font-fira font-medium hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 px-4 py-2 h-auto",
                      experienciasItems.some((i) => isActivePath(i.path)) || location.pathname.startsWith("/setlist")
                        ? "text-white after:absolute after:left-4 after:right-4 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-verde"
                        : "text-white/90"
                    )}
                  >
                    Experiencias
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-48 gap-1 p-2">
                      {experienciasItems.map((item) => (
                        <li key={item.path}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.path}
                              className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              {item.name}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Auth Section — col-start-3 explícito: en móvil el nav central está
              display:none y sin esto los iconos se auto-colocan en la columna central */}
          <div className="col-start-3 flex items-center space-x-2 justify-self-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {user && (
              <PushSubscribeDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    aria-label="Notificaciones push"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                }
              />
            )}

            {user ? (
              <div className="hidden lg:flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2 text-sm font-medium border-b">
                      {userName}
                    </div>
                    {miCuentaItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center cursor-pointer justify-between">
                          <span className="flex items-center">
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.name}
                          </span>
                          {item.showBadge && pendingNotifications > 0 && (
                            <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                              {pendingNotifications}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout('manual')} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/auth" className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-1">
              {/* Main Nav Items */}
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "text-sm font-fira font-medium text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2",
                      isActive ? "bg-white/15" : "hover:bg-white/10"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Experiencias Collapsible */}
              <Collapsible open={experienciasOpen} onOpenChange={setExperienciasOpen}>
                <CollapsibleTrigger className="w-full text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Experiencias
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", experienciasOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1 mt-1">
                  {experienciasItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="text-sm font-fira font-medium text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>

              {user && (
                <>
                  {/* Mi Cuenta Collapsible */}
                  <Collapsible open={miCuentaOpen} onOpenChange={setMiCuentaOpen}>
                    <CollapsibleTrigger className="w-full text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Mi Cuenta
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", miCuentaOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1 mt-1">
                      {miCuentaItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="text-sm font-fira font-medium text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 justify-between"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {item.name}
                            </span>
                            {item.showBadge && pendingNotifications > 0 && (
                              <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                                {pendingNotifications}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout('manual');
                      setIsMenuOpen(false);
                    }}
                    className="text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </>
              )}

              {!user && (
                <Link
                  to="/auth"
                  className="text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header >
  );
};

export default Header;
