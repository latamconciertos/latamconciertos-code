import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, User, Settings, Moon, Sun, Calendar, LogOut, Home, Mic2, Music2, BookOpen, ListMusic, Lightbulb, Users, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";
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
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [experienciasOpen, setExperienciasOpen] = useState(false);
  const [miCuentaOpen, setMiCuentaOpen] = useState(false);
  const { theme, setTheme } = useTheme() || { theme: 'system', setTheme: () => {} };

  useEffect(() => {
    console.log('[Header] Initializing auth check');
    
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('[Header] Session check:', session?.user?.email || 'No user');
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
          const isAdminUser = roles?.some((r) => r.role === "admin") || false;
          console.log('[Header] Admin status:', isAdminUser);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Header] Auth state changed:', event, session?.user?.email || 'No user');
      
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
            const isAdminUser = roles?.some((r) => r.role === "admin") || false;
            console.log('[Header] Admin status updated:', isAdminUser);
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
      console.log('[Header] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente");
  };

  const mainNavItems = [
    { name: "Inicio", path: "/", icon: Home },
    { name: "Conciertos", path: "/concerts", icon: Music2 },
    { name: "Artistas", path: "/artists", icon: Mic2 },
    { name: "Noticias", path: "/blog", icon: BookOpen },
  ];

  const experienciasItems = [
    { name: "Setlists", path: "/setlists", icon: ListMusic },
    { name: "Proyectos Fans", path: "/fan-projects", icon: Lightbulb },
  ];

  const miCuentaItems = [
    { name: "Perfil", path: "/profile", icon: User },
    { name: "Mis Conciertos", path: "/my-calendar", icon: Calendar },
    { name: "Conexiones", path: "/friends", icon: Users, showBadge: true },
  ];

  return (
    <header 
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}
    >
      <nav className={cn("bg-gradient-to-r from-primary/95 to-primary/80 backdrop-blur-lg supports-[backdrop-filter]:bg-primary/85 shadow-2xl dark:from-primary/90 dark:to-primary/70 border border-white/20 px-4 sm:px-6 lg:px-8", isMenuOpen ? "rounded-3xl" : "rounded-full")}>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={logo}
              alt="Conciertos LATAM"
              className="h-20 lg:h-[5.25rem] w-auto object-contain transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-fira font-medium text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Experiencias con hover */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-fira font-medium text-white/90 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 px-4 py-2 h-auto">
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

          {/* Auth Section */}
          <div className="flex items-center space-x-2">
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

            {user ? (
              <div className="hidden lg:flex items-center space-x-1">
                {/* Mi Cuenta Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/10 text-sm font-fira font-medium px-4 py-2 flex items-center gap-1">
                      Mi Cuenta
                      <ChevronDown className="h-4 w-4" />
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
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
          <div className="lg:hidden py-4 border-t border-white/10 bg-primary/95 rounded-b-3xl">
            <div className="flex flex-col space-y-1">
              {/* Main Nav Items */}
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-sm font-fira font-medium text-white hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
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
                      handleLogout();
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
    </header>
  );
};

export default Header;
