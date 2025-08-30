import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redirect to coming soon page with specific feature information
  redirect('/coming-soon?feature=Configuración&description=Estamos desarrollando un panel de configuración completo con preferencias de notificaciones, privacidad y personalización.&estimated=Q2 2024');
}

export const metadata = {
  title: 'Configuración - Próximamente',
  description: 'El panel de configuración estará disponible pronto.',
};