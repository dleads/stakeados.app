import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export default async function AdminLayoutWrapper({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // 1) Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/${params.locale}/auth/sign-in?next=${encodeURIComponent(`/${params.locale}/admin`)}`
    );
  }

  // 2) Verificar rol admin del perfil
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    // Si no es admin, redirigimos al inicio del sitio (o al login con motivo)
    redirect(`/${params.locale}`);
  }

  return <AdminLayout locale={params.locale}>{children}</AdminLayout>;
}

export const metadata = {
  title: 'Panel de Administración - Stakeados',
  description: 'Panel administrativo para gestionar la plataforma Stakeados',
};
