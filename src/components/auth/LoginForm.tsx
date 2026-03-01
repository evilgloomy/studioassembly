import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

interface LoginFormProps {
  mode?: 'login' | 'signup';
}

export function LoginForm({ mode: initialMode = 'login' }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password, displayName || undefined);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: error.message,
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Account created',
        description: 'Your account has been created. Please contact an admin to assign your role.',
      });

      // Switch to login mode after signup
      setMode('login');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Welcome back',
      description: 'You have successfully signed in.',
    });

    navigate(from, { replace: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-xs tracking-widest uppercase">
            Display Name
          </Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="border-input bg-background"
            disabled={isLoading}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs tracking-widest uppercase">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studioassembly.ca"
          className="border-input bg-background"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs tracking-widest uppercase">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-input bg-background"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full tracking-widest uppercase"
        disabled={isLoading}
      >
        {isLoading ? (mode === 'signup' ? 'Creating...' : 'Signing in...') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
      </Button>

      {mode === 'login' && (
        <div className="text-center">
          <button
            type="button"
            onClick={async () => {
              if (!email) {
                toast({ variant: 'destructive', title: 'Enter your email first' });
                return;
              }
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
              } else {
                toast({ title: 'Check your email', description: 'A password reset link has been sent.' });
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  );
}
