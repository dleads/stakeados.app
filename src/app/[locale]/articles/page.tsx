import { redirect } from 'next/navigation';

export default function ArticlesPage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Sistema de Artículos&description=Estamos desarrollando un completo sistema de gestión de artículos con categorías, búsqueda avanzada y comentarios.&estimated=Q2 2024');
}

export const metadata = {
  title: 'Artículos - Próximamente',
  description: 'El sistema de artículos estará disponible pronto.',
};