import { Navigate, useLocation } from 'react-router-dom';
import { useCaerholdAuth } from '@/hooks/caerhold/useCaerholdAuth';

interface CaerholdProtectedRouteProps {
  children: React.ReactNode;
}

export function CaerholdProtectedRoute({ children }: CaerholdProtectedRouteProps) {
  const { user, hasCaerholdAccess, isLoading } = useCaerholdAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground tracking-widest uppercase text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!hasCaerholdAccess) {
    return <Navigate to="/caerhold" replace />;
  }

  return <>{children}</>;
}
