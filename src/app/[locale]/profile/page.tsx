import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Perfil de Usuario&description=Estamos creando un sistema completo de perfiles con estadísticas, logros y configuración personalizada.&estimated=Q2 2024');
}

export const metadata = {
  title: 'Mi Perfil - Próximamente',
  description: 'El sistema de perfiles estará disponible pronto.',
};