import {
  LayoutDashboard,
  BadgeCheck,
  BookUser,
  ArrowLeft,
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
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  tab: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', tab: 'dashboard', icon: LayoutDashboard },
      { title: 'Calendario', tab: 'calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Gestión',
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
      className={cn(
        isCollapsed ? 'w-[60px]' : 'w-72',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border'
      )}
      collapsible="icon"
    >
      {/* No header — brand identity lives in the full-width topbar above */}

      {/* Magazine TOC body — pt reserves space for the sticky topbar that overlays the top of the fixed sidebar */}
      <SidebarContent className="px-3 pt-[64px] pb-5">
        {menuGroups.map((group, groupIndex) => {
          const hasActiveItem = group.items.some((item) => item.tab === activeTab);
          const sectionNumber = String(groupIndex + 1).padStart(2, '0');

          return (
            <SidebarGroup key={group.label} className="px-0 py-1">
              <SidebarGroupLabel
                className={cn(
                  'flex items-center h-auto py-2.5',
                  hasActiveItem ? 'text-sidebar-foreground' : 'text-sidebar-foreground/55'
                )}
              >
                {isCollapsed ? null : (
                  <>
                    <span
                      className={cn(
                        'font-display font-black text-2xl leading-none w-9 shrink-0 transition-colors',
                        hasActiveItem ? 'text-primary' : 'text-sidebar-foreground/25'
                      )}
                    >
                      {sectionNumber}
                    </span>
                    <span className="font-fira text-[15px] font-semibold tracking-tight flex-1 text-left">
                      {group.label}
                    </span>
                  </>
                )}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className={cn('space-y-0.5 relative', isCollapsed ? '' : 'pl-9 pt-1 pb-2')}>
                  {!isCollapsed && (
                    <span
                      aria-hidden="true"
                      className="absolute left-9 top-1 bottom-2 w-px bg-sidebar-border"
                    />
                  )}
                  {group.items.map((item) => {
                    const isActive = activeTab === item.tab;
                    return (
                      <SidebarMenuItem key={item.tab}>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.tab)}
                          isActive={isActive}
                          className={cn(
                            'group/item relative h-9 pl-3 pr-2.5 rounded-md transition-colors',
                            'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                            'data-[active=true]:text-sidebar-foreground data-[active=true]:bg-sidebar-accent',
                            'before:absolute before:-left-[1px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-primary before:opacity-0',
                            'data-[active=true]:before:opacity-100 data-[active=true]:before:w-[2px]'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 transition-colors',
                              isActive
                                ? 'text-primary'
                                : 'text-sidebar-foreground/40 group-hover/item:text-sidebar-foreground/70'
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
            </SidebarGroup>
          );
        })}
      </SidebarContent>

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
