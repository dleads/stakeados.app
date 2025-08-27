'use client';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Verificar si el usuario es admin basándose en el email o metadatos
  const isAdmin =
    user?.email === 'admin@stakeados.com' ||
    user?.user_metadata?.role === 'admin' ||
    user?.app_metadata?.role === 'admin';

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <>{children}</>;
}
