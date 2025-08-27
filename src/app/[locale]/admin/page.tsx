import React from 'react';
import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Panel de Administración - Stakeados',
  description: 'Panel administrativo para gestionar la plataforma Stakeados',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
