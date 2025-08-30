import { redirect } from 'next/navigation';

export default function CommunityPage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Comunidad&description=Estamos construyendo un espacio de comunidad con foros, chat en tiempo real y eventos virtuales.&estimated=Q3 2024');
}

export const metadata = {
  title: 'Comunidad - Próximamente',
  description: 'La plataforma de comunidad estará disponible pronto.',
};