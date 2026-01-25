import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthor: boolean;
  hasContentRole: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAdmin: false,
    isEditor: false,
    isAuthor: false,
    hasContentRole: false,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch role using the security definer function
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      const role = roleData as AppRole | null;

      return {
        profile,
        role,
        isAdmin: role === 'admin',
        isEditor: role === 'editor',
        isAuthor: role === 'author',
        hasContentRole: role !== null,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        profile: null,
        role: null,
        isAdmin: false,
        isEditor: false,
        isAuthor: false,
        hasContentRole: false,
      };
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to prevent potential deadlock with Supabase auth
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id);
            setState({
              user: session.user,
              session,
              ...userData,
              isLoading: false,
            });
          }, 0);
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            isAdmin: false,
            isEditor: false,
            isAuthor: false,
            hasContentRole: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        setState({
          user: session.user,
          session,
          ...userData,
          isLoading: false,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    if (!state.user) {
      return { error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', state.user.id)
      .select()
      .single();

    if (!error && data) {
      setState(prev => ({
        ...prev,
        profile: {
          id: data.id,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          bio: data.bio,
        },
      }));
    }

    return { data, error };
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
