import { redirect } from 'next/navigation';

export default function NewsPage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Sistema de Noticias&description=Estamos creando un sistema de noticias en tiempo real con notificaciones y categorización automática.&estimated=Q2 2024');
}

export const metadata = {
  title: 'Noticias - Próximamente',
  description: 'El sistema de noticias estará disponible pronto.',
};