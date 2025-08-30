import type { NavigationConfig } from '@/types/navigation';

// Default navigation configuration with isImplemented flags
export const defaultNavigationConfig: NavigationConfig = {
  sections: [
    {
      id: 'home',
      label: 'Inicio',
      href: '/',
      isImplemented: true
    },
    {
      id: 'articles',
      label: 'Artículos',
      href: '/articles',
      isImplemented: false, // Will be updated when article system is implemented
      children: [
        {
          id: 'articles-list',
          label: 'Todos los Artículos',
          href: '/articles',
          isImplemented: false
        },
        {
          id: 'articles-categories',
          label: 'Categorías',
          href: '/articles/categories',
          isImplemented: false
        }
      ]
    },
    {
      id: 'news',
      label: 'Noticias',
      href: '/news',
      isImplemented: false // Will be updated when news system is implemented
    },
    {
      id: 'community',
      label: 'Comunidad',
      href: '/community',
      requiredAuth: true,
      requiredRoles: ['student', 'instructor', 'admin'], // Specify allowed roles
      isImplemented: false // Will be updated when community features are implemented
    },
    {
      id: 'courses',
      label: 'Cursos',
      href: '/courses',
      requiredAuth: true,
      isImplemented: false, // Will be updated when course system is implemented
      badge: {
        text: 'Próximamente',
        variant: 'coming-soon'
      }
    }
  ],
  userMenuItems: [
    {
      id: 'profile',
      label: 'Mi Perfil',
      href: '/profile',
      requiredAuth: true,
      isImplemented: false // Will be updated when profile system is implemented
    },
    {
      id: 'settings',
      label: 'Configuración',
      href: '/settings',
      requiredAuth: true,
      isImplemented: false // Will be updated when settings are implemented
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      href: '#',
      requiredAuth: true,
      isImplemented: true,
      action: 'logout'
    }
  ],
  adminMenuItems: [
    {
      id: 'admin-dashboard',
      label: 'Panel Admin',
      href: '/admin',
      requiredAuth: true,
      isImplemented: true // Admin panel is already implemented
    },
    {
      id: 'admin-users',
      label: 'Gestión de Usuarios',
      href: '/admin/users',
      requiredAuth: true,
      isImplemented: false // Will be updated when user management is implemented
    },
    {
      id: 'admin-content',
      label: 'Gestión de Contenido',
      href: '/admin/content',
      requiredAuth: true,
      isImplemented: false // Will be updated when content management is implemented
    },
    {
      id: 'admin-analytics',
      label: 'Analytics',
      href: '/admin/analytics',
      requiredAuth: true,
      isImplemented: false // Will be updated when analytics are implemented
    },
    {
      id: 'admin-settings',
      label: 'Configuración del Sistema',
      href: '/admin/settings',
      requiredAuth: true,
      isImplemented: false // Will be updated when system settings are implemented
    }
  ]
};

// Helper function to update navigation configuration
export function updateNavigationConfig(
  config: NavigationConfig,
  updates: Partial<NavigationConfig>
): NavigationConfig {
  return {
    ...config,
    ...updates,
    sections: updates.sections || config.sections,
    userMenuItems: updates.userMenuItems || config.userMenuItems,
    adminMenuItems: updates.adminMenuItems || config.adminMenuItems,
  };
}

// Helper function to enable/disable a navigation section
export function toggleNavigationSection(
  config: NavigationConfig,
  sectionId: string,
  isImplemented: boolean
): NavigationConfig {
  return {
    ...config,
    sections: config.sections.map(section =>
      section.id === sectionId
        ? { ...section, isImplemented }
        : section
    ),
  };
}

// Helper function to enable/disable a user menu item
export function toggleUserMenuItem(
  config: NavigationConfig,
  itemId: string,
  isImplemented: boolean
): NavigationConfig {
  return {
    ...config,
    userMenuItems: config.userMenuItems.map(item =>
      item.id === itemId
        ? { ...item, isImplemented }
        : item
    ),
  };
}

// Helper function to enable/disable an admin menu item
export function toggleAdminMenuItem(
  config: NavigationConfig,
  itemId: string,
  isImplemented: boolean
): NavigationConfig {
  return {
    ...config,
    adminMenuItems: config.adminMenuItems.map(item =>
      item.id === itemId
        ? { ...item, isImplemented }
        : item
    ),
  };
}

// Helper function to check if a user can access a navigation section
export function canAccessSection(
  section: NavigationSection,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  // Check authentication requirement
  if (section.requiredAuth && !isAuthenticated) {
    return false;
  }
  
  // Check role requirements
  if (section.requiredRoles && section.requiredRoles.length > 0) {
    if (!userRole || !section.requiredRoles.includes(userRole)) {
      return false;
    }
  }
  
  return true;
}

// Helper function to get navigation sections filtered by user permissions
export function getFilteredSections(
  sections: NavigationSection[],
  isAuthenticated: boolean,
  userRole?: string | null
): NavigationSection[] {
  return sections.filter(section => 
    canAccessSection(section, isAuthenticated, userRole)
  );
}

// Helper function to add role requirements to a section
export function addRoleRequirement(
  config: NavigationConfig,
  sectionId: string,
  roles: string[]
): NavigationConfig {
  return {
    ...config,
    sections: config.sections.map(section =>
      section.id === sectionId
        ? { ...section, requiredRoles: roles }
        : section
    ),
  };
}