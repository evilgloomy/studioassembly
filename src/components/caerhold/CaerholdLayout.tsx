import { CaerholdHeader } from './CaerholdHeader';
import { CaerholdFooter } from './CaerholdFooter';
import { cn } from '@/lib/utils';

interface CaerholdLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function CaerholdLayout({ children, className }: CaerholdLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CaerholdHeader />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      <CaerholdFooter />
    </div>
  );
}
