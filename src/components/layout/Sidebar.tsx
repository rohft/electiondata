import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  PieChart,
  GitCompare,
  BarChart3,
  Edit3,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

type NavItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'upload', icon: Upload, labelKey: 'nav.upload' },
  { id: 'segments', icon: PieChart, labelKey: 'nav.segments' },
  { id: 'comparison', icon: GitCompare, labelKey: 'nav.comparison' },
  { id: 'infographics', icon: BarChart3, labelKey: 'nav.infographics' },
  { id: 'templates', icon: FileText, labelKey: 'nav.templates' },
  { id: 'edit', icon: Edit3, labelKey: 'nav.edit' },
  { id: 'export', icon: Download, labelKey: 'nav.export' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2 fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent">
              <BarChart3 className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">VoterPulse</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'transition-colors focus-ring',
            isCollapsed && 'mx-auto'
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'transition-all duration-200 focus-ring',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary-foreground')} />
              {!isCollapsed && (
                <span className="truncate slide-in-left">{t(item.labelKey)}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-medium group-hover:block">
                  {t(item.labelKey)}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={() => onSectionChange('settings')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
            'transition-all duration-200 focus-ring',
            activeSection === 'settings'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">{t('nav.settings')}</span>}
        </button>
      </div>
    </aside>
  );
};
