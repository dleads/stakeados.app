'use client';

import { useAuthContext } from '@/components/auth/AuthProvider';

export function useUser() {
  const { user, profile, isAuthenticated, loading } = useAuthContext();

  return {
    user,
    profile,
    isAuthenticated,
    loading,
    // Alias para compatibilidad
    currentUser: user,
    userProfile: profile,
    isLoggedIn: isAuthenticated,
  };
}
