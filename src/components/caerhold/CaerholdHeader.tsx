import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Newspaper, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';

interface CaerholdHeaderProps {
  className?: string;
}

export function CaerholdHeader({ className }: CaerholdHeaderProps) {
  const { role, isAdmin } = useAuthContext();
  const hasCaerholdAccess = isAdmin || role === 'caerhold_admin' || role === 'caerhold_editor';

  return (
    <header className={cn('border-b border-border bg-card', className)}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to Studio Assembly">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link to="/caerhold" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-widest uppercase">
              City of Caerhold
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <Link 
            to="/caerhold/feed" 
            className="flex items-center gap-2 text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <Newspaper className="h-4 w-4" />
            Feed
          </Link>
          <Link 
            to="/caerhold/residents" 
            className="flex items-center gap-2 text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            Residents
          </Link>
          <Link 
            to="/caerhold/locations" 
            className="flex items-center gap-2 text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Locations
          </Link>
          {hasCaerholdAccess && (
            <Link 
              to="/admin/caerhold" 
              className="text-sm tracking-widest uppercase text-primary hover:underline"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
