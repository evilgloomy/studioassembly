import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  LogOut,
  ChevronLeft,
  Home,
  PanelTop,
  Info,
  Landmark,
  FileEdit,
  Upload,
  UserPlus,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpg';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { 
    path: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    exact: true,
  },
  { 
    path: '/admin/posts', 
    label: 'Posts', 
    icon: FileText,
  },
  { 
    path: '/admin/media', 
    label: 'Media', 
    icon: Image,
  },
  { 
    path: '/admin/pages/home', 
    label: 'Homepage', 
    icon: PanelTop,
  },
  { 
    path: '/admin/pages/about', 
    label: 'About Page', 
    icon: Info,
  },
  { 
    path: '/admin/team', 
    label: 'Team', 
    icon: Users,
    adminOnly: true,
  },
];

const caerholdNavItems = [
  { path: '/admin/caerhold', label: 'City Dashboard', icon: Landmark, exact: true },
  { path: '/admin/caerhold/media', label: 'City Media', icon: Image },
  { path: '/admin/caerhold/drafts', label: 'Post Drafts', icon: FileEdit },
  { path: '/admin/caerhold/residents', label: 'Residents', icon: Users, exact: true },
  { path: '/admin/caerhold/residents/import', label: 'Import Residents', icon: Upload },
  { path: '/admin/caerhold/residents/drafts', label: 'Resident Drafts', icon: UserPlus },
  { path: '/admin/caerhold/locations', label: 'Locations', icon: MapPin },
  { path: '/admin/caerhold/districts', label: 'Districts', icon: Landmark },
  { path: '/admin/caerhold/welcome-config', label: 'Welcome Config', icon: PanelTop },
];

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const { profile, role, signOut, isAdmin } = useAuthContext();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const hasCaerholdAccess = isAdmin || role === 'caerhold_admin' || role === 'caerhold_editor';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background border-r border-input transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-input">
          {!collapsed && (
            <img src={logo} alt="Studio Assembly" className="h-8 w-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('h-8 w-8', collapsed && 'mx-auto')}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-none transition-colors',
                'hover:bg-secondary',
                isActive(item.path, item.exact) 
                  ? 'bg-secondary font-medium' 
                  : 'text-muted-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm tracking-wide uppercase">{item.label}</span>
              )}
            </Link>
          ))}

          {/* Caerhold Section */}
          {hasCaerholdAccess && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-3">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                    Caerhold
                  </span>
                </div>
              )}
              {collapsed && <div className="border-t border-input my-2" />}
              {caerholdNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-none transition-colors',
                    'hover:bg-secondary',
                    isActive(item.path, item.exact) 
                      ? 'bg-secondary font-medium' 
                      : 'text-muted-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm tracking-wide uppercase">{item.label}</span>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-input space-y-1">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-secondary rounded-none transition-colors',
              collapsed && 'justify-center px-2'
            )}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm tracking-wide uppercase">View Site</span>
            )}
          </Link>

          {!collapsed && profile && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground truncate">
                {profile.display_name || 'User'}
              </div>
              <div className="uppercase tracking-wider">{role}</div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-secondary rounded-none transition-colors',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm tracking-wide uppercase">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
