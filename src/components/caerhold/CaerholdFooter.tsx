import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CaerholdFooterProps {
  className?: string;
}

export function CaerholdFooter({ className }: CaerholdFooterProps) {
  return (
    <footer className={cn('border-t border-border bg-card py-8', className)}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} City of Caerhold. A Studio Assembly project.
          </div>
          <nav className="flex items-center gap-6">
            <Link 
              to="/caerhold" 
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/caerhold/feed" 
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Feed
            </Link>
            <Link 
              to="/caerhold/residents" 
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Residents
            </Link>
            <Link 
              to="/caerhold/locations" 
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Locations
            </Link>
            <Link 
              to="/" 
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Studio Assembly
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
