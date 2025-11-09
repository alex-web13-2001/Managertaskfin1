import React from 'react';
import { Home, CheckSquare, FolderKanban, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type NavigationItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  view: string;
};

const navigationItems: NavigationItem[] = [
  { title: 'Дашборд', icon: Home, view: 'dashboard' },
  { title: 'Личные задачи', icon: CheckSquare, view: 'tasks' },
  { title: 'Проекты', icon: FolderKanban, view: 'projects' },
  { title: 'Категории', icon: Tag, view: 'categories' },
];

export function SidebarNav({
  currentView,
  onViewChange,
  onLogout,
}: {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="pt-16">
      <SidebarContent>
        <div className="flex flex-col h-full">
          <SidebarMenu className="px-2 py-2 flex-1">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.view}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        isActive={currentView === item.view}
                        onClick={() => onViewChange(item.view)}
                        className="w-full"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[state=expanded]:hidden">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          
          {/* Toggle Button */}
          <div className="px-2 py-2 border-t">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="w-full group-data-[collapsible=icon]:justify-center"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <>
                        <ChevronLeft className="w-4 h-4" />
                        <span>Свернуть</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[state=expanded]:hidden">
                  <p>Развернуть</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
