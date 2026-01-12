import { useState, useEffect } from 'react';
import {
  Home, Newspaper, Music, MapPin, Calendar, Users, Smartphone,
  Video, Megaphone, TrendingUp, BarChart3, Building2, FileText,
  Images, Share2, ListMusic, Lightbulb, ChevronDown, Settings,
  Layers, Users2, DollarSign, Link2, LucideIcon, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import adminLogo from '@/assets/admin-logo.png';

interface MenuItem {
  title: string;
  tab: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Contenido',
    icon: Layers,
    items: [
      { title: 'Noticias', tab: 'news', icon: Newspaper },
      { title: 'Videos/Fotos', tab: 'media', icon: Video },
      { title: 'Galería', tab: 'gallery', icon: Images },
    ]
  },
  {
    label: 'Catálogo',
    icon: Music,
    items: [
      { title: 'Artistas', tab: 'artists', icon: Music },
      { title: 'Venues', tab: 'venues', icon: MapPin },
      { title: 'Conciertos', tab: 'concerts', icon: Calendar },
      { title: 'Festivales', tab: 'festivals', icon: Sparkles },
      { title: 'Promotoras', tab: 'promoters', icon: Building2 },
    ]
  },
  {
    label: 'Comunidad',
    icon: Users2,
    items: [
      { title: 'Usuarios', tab: 'users', icon: Users },
      { title: 'Contribuciones', tab: 'setlist-contributions', icon: ListMusic },
      { title: 'Fan Projects', tab: 'fan-projects', icon: Lightbulb },
    ]
  },
  {
    label: 'Monetización',
    icon: DollarSign,
    items: [
      { title: 'Publicidad', tab: 'ads', icon: Megaphone },
      { title: 'Solicitudes', tab: 'advertising', icon: FileText },
    ]
  },
  {
    label: 'Integraciones',
    icon: Link2,
    items: [
      { title: 'Charts Spotify', tab: 'spotify', icon: TrendingUp },
      { title: 'Redes Sociales', tab: 'social', icon: Share2 },
    ]
  },
  {
    label: 'Configuración',
    icon: Settings,
    items: [
      { title: 'Tráfico', tab: 'traffic', icon: BarChart3 },
      { title: 'PWA', tab: 'pwa', icon: Smartphone },
    ]
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}


export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Find which group contains the active tab
  const activeGroupIndex = menuGroups.findIndex(group =>
    group.items.some(item => item.tab === activeTab)
  );

  // Initialize all groups as collapsed - no localStorage persistence for initial state
  // This ensures a clean, organized sidebar on every page load
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  // Don't persist to localStorage - keep state only during current session
  // This gives users a fresh, organized start each time

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Sidebar
      className={cn(isCollapsed ? 'w-14' : 'w-60', 'bg-brand-blue')}
      collapsible="icon"
    >
      {/* Logo header */}
      <SidebarHeader className="bg-brand-blue border-b border-blue-500/30 py-6">
        <div className="flex justify-center items-center">
          <img
            src={adminLogo}
            alt="Conciertos Latam"
            className={cn(
              "transition-all duration-200",
              isCollapsed ? "h-12 w-12 object-contain" : "h-28 w-auto max-w-[200px]"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-brand-blue">
        {/* Menu groups */}
        {menuGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups[groupIndex] ?? false;
          const hasActiveItem = group.items.some(item => item.tab === activeTab);

          return (
            <Collapsible
              key={group.label}
              open={isCollapsed ? false : isExpanded}
              onOpenChange={() => !isCollapsed && toggleGroup(groupIndex)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className={cn(
                      "flex items-center justify-between cursor-pointer px-3 py-2 text-blue-100/80 hover:text-blue-50 hover:bg-blue-700/50 rounded-md transition-colors",
                      hasActiveItem && "text-blue-50 bg-blue-700/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="text-xs font-semibold uppercase tracking-wide">{group.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pl-2">
                      {group.items.map(item => (
                        <SidebarMenuItem key={item.tab}>
                          <SidebarMenuButton
                            onClick={() => onTabChange(item.tab)}
                            isActive={activeTab === item.tab}
                            className={cn(
                              "text-blue-50/90 hover:bg-blue-700/50 dark:hover:bg-blue-800/50",
                              "data-[active=true]:bg-primary/20 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {/* Footer with Home button */}
      <SidebarFooter className="bg-brand-blue border-t border-blue-500/30 p-3">
        <Button
          asChild
          variant="outline"
          className={cn(
            "w-full bg-blue-700/50 border-blue-400/30 text-blue-50 hover:bg-blue-600 hover:text-white",
            isCollapsed && "px-2"
          )}
        >
          <Link to="/" className="flex items-center justify-center gap-2">
            <Home className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Ir al Home</span>}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
