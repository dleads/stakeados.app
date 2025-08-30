import type { NavigationConfig } from '@/types/navigation';

export const mockNavigationConfig: NavigationConfig = {
  sections: [
    {
      id: 'home',
      label: 'Inicio',
      href: '/',
      isImplemented: true,
    },
    {
      id: 'articles',
      label: 'Artículos',
      href: '/articles',
      isImplemented: true,
      children: [
        {
          id: 'articles-list',
          label: 'Todos los Artículos',
          href: '/articles',
          isImplemented: true,
        },
        {
          id: 'articles-categories',
          label: 'Categorías',
          href: '/articles/categories',
          isImplemented: false,
        },
      ],
    },
    {
      id: 'news',
      label: 'Noticias',
      href: '/news',
      isImplemented: false,
    },
    {
      id: 'community',
      label: 'Comunidad',
      href: '/community',
      requiredAuth: true,
      isImplemented: false,
    },
    {
      id: 'admin',
      label: 'Admin',
      href: '/admin',
      requiredAuth: true,
      requiredRoles: ['admin'],
      isImplemented: false,
    },
  ],
  userMenuItems: [
    {
      id: 'profile',
      label: 'Mi Perfil',
      href: '/profile',
      requiredAuth: true,
      isImplemented: false,
    },
    {
      id: 'settings',
      label: 'Configuración',
      href: '/settings',
      requiredAuth: true,
      isImplemented: false,
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      href: '#',
      requiredAuth: true,
      isImplemented: true,
      action: 'logout',
    },
  ],
  adminMenuItems: [
    {
      id: 'admin-dashboard',
      label: 'Panel Admin',
      href: '/admin',
      requiredAuth: true,
      isImplemented: false,
    },
  ],
};