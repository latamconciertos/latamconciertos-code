import { useState } from 'react';
import {
  Home, Newspaper, Music, MapPin, Calendar, Users, Smartphone,
  Video, Megaphone, TrendingUp, BarChart3, Building2, FileText,
  Images, Share2, ListMusic, Lightbulb, ChevronDown, Settings,
  Layers, Users2, DollarSign, Link2, LucideIcon, Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
      { title: 'Banners', tab: 'banners', icon: Megaphone },
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
  // Initialize all groups as collapsed - no localStorage persistence for initial state
  // This ensures a clean, organized sidebar on every page load
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  // Don't persist to localStorage - keep state only during current session
  // This gives users a fresh, organized start each time

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Editorial admin sidebar — magazine table-of-contents pattern
  // Adapts to light/dark via shadcn sidebar tokens. Brand color stays primary in both.
  return (
    <Sidebar
      className={cn(
        isCollapsed ? 'w-[60px]' : 'w-72',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border'
      )}
      collapsible="icon"
    >
      {/* No header — brand identity lives in the full-width topbar above */}

      {/* Magazine TOC body — pt-[52px] reserves space for the sticky topbar that overlays the top of the fixed sidebar */}
      <SidebarContent className="px-3 pt-[64px] pb-5">
        {menuGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups[groupIndex] ?? false;
          const hasActiveItem = group.items.some(item => item.tab === activeTab);
          const sectionNumber = String(groupIndex + 1).padStart(2, '0');

          // When collapsed: force-open so item icons are always visible.
          // When expanded: respect the per-group expanded state.
          return (
            <Collapsible
              key={group.label}
              open={isCollapsed || isExpanded}
              onOpenChange={() => !isCollapsed && toggleGroup(groupIndex)}
            >
              <SidebarGroup className="px-0 py-1">
                {!isCollapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        'group/section relative flex items-center cursor-pointer h-auto py-2.5 transition-colors',
                        hasActiveItem
                          ? 'text-sidebar-foreground'
                          : 'text-sidebar-foreground/55 hover:text-sidebar-foreground'
                      )}
                    >
                      {/* Magazine TOC number */}
                      <span
                        className={cn(
                          'font-display font-black text-2xl leading-none w-9 shrink-0 transition-colors',
                          hasActiveItem
                            ? 'text-primary'
                            : 'text-sidebar-foreground/25 group-hover/section:text-primary/70'
                        )}
                      >
                        {sectionNumber}
                      </span>

                      {/* Section title */}
                      <span className="font-fira text-[15px] font-semibold tracking-tight flex-1 text-left">
                        {group.label}
                      </span>

                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-sidebar-foreground/30 group-hover/section:text-sidebar-foreground/60',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu
                      className={cn(
                        'space-y-0.5 relative',
                        isCollapsed ? 'pt-0.5 pb-0.5' : 'pl-9 pt-1 pb-2'
                      )}
                    >
                      {/* Magazine column rule — only when expanded */}
                      {!isCollapsed && (
                        <span
                          aria-hidden="true"
                          className="absolute left-9 top-1 bottom-2 w-px bg-sidebar-border"
                        />
                      )}
                      {group.items.map(item => {
                        const isActive = activeTab === item.tab;
                        return (
                          <SidebarMenuItem key={item.tab}>
                            <SidebarMenuButton
                              onClick={() => onTabChange(item.tab)}
                              isActive={isActive}
                              tooltip={isCollapsed ? item.title : undefined}
                              className={cn(
                                'group/item relative h-9 rounded-md transition-colors',
                                isCollapsed ? 'justify-center px-0' : 'pl-3 pr-2.5',
                                'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                                'data-[active=true]:text-sidebar-foreground data-[active=true]:bg-sidebar-accent',
                                !isCollapsed &&
                                  'before:absolute before:-left-[1px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100 data-[active=true]:before:w-[2px]'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'shrink-0 transition-colors',
                                  isCollapsed ? 'h-4 w-4' : 'h-3.5 w-3.5',
                                  isActive
                                    ? 'text-primary'
                                    : 'text-sidebar-foreground/50 group-hover/item:text-sidebar-foreground/80'
                                )}
                              />
                              {!isCollapsed && (
                                <span className="font-sans text-[13.5px] font-medium tracking-tight truncate">
                                  {item.title}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Link
          to="/admin"
          className={cn(
            'flex items-center gap-3 group/back rounded-md py-2 transition-colors text-sidebar-foreground/55 hover:text-sidebar-foreground',
            isCollapsed ? 'justify-center px-0' : 'px-2'
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/back:-translate-x-0.5" />
          {!isCollapsed && (
            <span className="font-fira text-[13px] font-medium tracking-tight">
              Volver al portal
            </span>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
