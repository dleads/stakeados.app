'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      await supabase.auth.signOut();
      router.replace('../sign-in');
    };
    run();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <p className="text-sm opacity-80">Cerrando sesión…</p>
    </div>
  );
}
