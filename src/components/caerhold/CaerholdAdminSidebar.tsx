import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image, 
  FileEdit, 
  Users, 
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/caerhold/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/caerhold/admin/media', icon: Image, label: 'Media' },
  { to: '/caerhold/admin/drafts', icon: FileEdit, label: 'Drafts' },
  { to: '/caerhold/admin/residents', icon: Users, label: 'Residents' },
  { to: '/caerhold/admin/locations', icon: MapPin, label: 'Locations' },
];

export function CaerholdAdminSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen">
      <div className="p-6 border-b border-border">
        <NavLink to="/caerhold" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs tracking-widest uppercase">Back to City</span>
        </NavLink>
        <h1 className="text-lg font-bold tracking-widest uppercase mt-4">
          Caerhold Admin
        </h1>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-none border transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm tracking-widest uppercase">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
