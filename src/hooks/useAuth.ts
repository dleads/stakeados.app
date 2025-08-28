'use client';

import { useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  is_genesis: boolean | null;
  total_points: number | null;
  created_at: string | null;
  updated_at: string | null;
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

        if (error) {
          setAuthState(prev => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
          return;
        }

        if (session?.user) {
          // Sincronizar cookies del servidor (SSR)
          try {
            await fetch('/api/auth/callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'SIGNED_IN', session }),
            });
          } catch {}

          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!isMountedRef.current) return;

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          setAuthState({
            user: session.user,
            profile: profile || null,
            session,
            loading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        setAuthState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;

      // Sincronizar cookies del servidor en cada cambio de auth
      try {
        await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session }),
        });
      } catch {}

      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!isMountedRef.current) return;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        setAuthState({
          user: session.user,
          profile: profile || null,
          session,
          loading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user,
        }));
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      return { error };
    }

    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      return { error };
    }

    return { error: null };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) return { error: new Error('Not authenticated') };

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (error) {
      return { error };
    }

    setAuthState(prev => ({ ...prev, profile: data }));
    return { error: null, data };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!authState.user,
    isGenesisHolder: authState.profile?.is_genesis || false,
  };
}
