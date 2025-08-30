import { redirect } from 'next/navigation';

export default function CoursesPage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Sistema de Cursos&description=Estamos desarrollando una plataforma completa de cursos con videos, ejercicios interactivos y certificaciones.&estimated=Q4 2024');
}

export const metadata = {
  title: 'Cursos - Próximamente',
  description: 'El sistema de cursos estará disponible pronto.',
};