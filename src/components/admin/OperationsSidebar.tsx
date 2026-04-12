import {
  LayoutDashboard,
  BadgeCheck,
  BookUser,
  ArrowLeft,
  Gauge,
  Briefcase,
  CalendarDays,
  Kanban,
  LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
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
    label: 'Overview',
    icon: Gauge,
    items: [
      { title: 'Dashboard', tab: 'dashboard', icon: LayoutDashboard },
      { title: 'Calendario', tab: 'calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Gestión',
    icon: Briefcase,
    items: [
      { title: 'Acreditaciones', tab: 'accreditations', icon: BadgeCheck },
      { title: 'Kanban', tab: 'kanban', icon: Kanban },
      { title: 'Contactos', tab: 'contacts', icon: BookUser },
    ],
  },
];

interface OperationsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OperationsSidebar({ activeTab, onTabChange }: OperationsSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={cn(isCollapsed ? 'w-14' : 'w-60', 'bg-brand-blue')}
      collapsible="icon"
    >
      <SidebarHeader className="bg-brand-blue border-b border-blue-500/30 py-6">
        <div className="flex justify-center items-center">
          <img
            src={adminLogo}
            alt="Conciertos Latam"
            className={cn(
              'transition-all duration-200',
              isCollapsed ? 'h-12 w-12 object-contain' : 'h-28 w-auto max-w-[200px]',
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-brand-blue">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-3 py-2 text-blue-100/60">
              <div className="flex items-center gap-2">
                <group.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {group.label}
                  </span>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.tab)}
                      isActive={activeTab === item.tab}
                      className={cn(
                        'text-blue-50/90 hover:bg-blue-700/50',
                        'data-[active=true]:bg-primary/20 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="bg-brand-blue border-t border-blue-500/30 p-3">
        <Button
          asChild
          variant="outline"
          className={cn(
            'w-full bg-blue-700/50 border-blue-400/30 text-blue-50 hover:bg-blue-600 hover:text-white',
            isCollapsed && 'px-2',
          )}
        >
          <Link to="/admin" className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Volver al portal</span>}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
