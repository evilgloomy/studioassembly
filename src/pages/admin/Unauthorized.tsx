import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.jpg';

export default function Unauthorized() {
  const { signOut, user } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-12">
          <img 
            src={logo} 
            alt="Studio Assembly" 
            className="h-16 w-auto"
          />
        </div>

        <div className="border border-input p-8">
          <h1 className="text-lg font-bold tracking-widest uppercase mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {user 
              ? "Your account doesn't have the required permissions to access the admin area."
              : "You need to be signed in to access this area."
            }
          </p>

          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full tracking-widest uppercase">
              <Link to="/">Return to Site</Link>
            </Button>
            {user && (
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                className="w-full tracking-widest uppercase text-muted-foreground"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
