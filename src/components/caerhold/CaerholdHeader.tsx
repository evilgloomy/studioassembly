import { Link } from 'react-router-dom';
import { MapPin, Newspaper, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCaerholdAuth } from '@/hooks/caerhold/useCaerholdAuth';

interface CaerholdHeaderProps {
  className?: string;
}

export function CaerholdHeader({ className }: CaerholdHeaderProps) {
  const { hasCaerholdAccess } = useCaerholdAuth();

  return (
    <header className={cn('border-b border-border bg-card', className)}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/caerhold" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-widest uppercase">
            City of Caerhold
          </span>
        </Link>

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
              to="/caerhold/admin" 
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
