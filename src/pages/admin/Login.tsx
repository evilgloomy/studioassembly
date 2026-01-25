import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import logo from '@/assets/logo.jpg';

export default function AdminLogin() {
  const { user, hasContentRole, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground tracking-widest uppercase text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (user && hasContentRole) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-12">
          <img 
            src={logo} 
            alt="Studio Assembly" 
            className="h-16 w-auto"
          />
        </div>

        <div className="border border-input p-8">
          <h1 className="text-lg font-bold tracking-widest uppercase text-center mb-8">
            Admin Access
          </h1>
          <LoginForm />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Access restricted to authorized team members only.
        </p>
      </div>
    </div>
  );
}
