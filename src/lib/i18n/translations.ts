import type { Locale } from '@/types/content';

export interface Translations {
  // Navigation
  'nav.home': string;
  'nav.courses': string;
  'nav.articles': string;
  'nav.news': string;
  'nav.community': string;
  'nav.profile': string;
  'nav.admin': string;

  // Homepage
  'home.hero.title': string;
  'home.hero.subtitle': string;
  'home.hero.cta.courses': string;
  'home.hero.cta.articles': string;
  'home.hero.cta.news': string;
  'home.news.title': string;
  'home.news.viewAll': string;
  'home.articles.title': string;
  'home.articles.viewAll': string;
  'home.navigation.title': string;
  'home.courses.title': string;
  'home.courses.viewAll': string;
  'home.courses.enroll': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.retry': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.create': string;
  'common.search': string;
  'common.filter': string;
  'common.sort': string;
  'common.readMore': string;
  'common.showLess': string;

  // Time
  'time.minutesAgo': string;
  'time.hoursAgo': string;
  'time.daysAgo': string;
  'time.weeksAgo': string;
  'time.monthsAgo': string;
  'time.yearsAgo': string;
  'time.justNow': string;

  // Course levels
  'course.level.beginner': string;
  'course.level.intermediate': string;
  'course.level.advanced': string;
  'course.comingSoon': string;
  'course.inDevelopment': string;
  'course.stayTuned': string;

  // Stats
  'stats.articles': string;
  'stats.news': string;
  'stats.courses': string;
  'stats.users': string;
  'stats.members': string;
  'stats.active': string;

  // Errors
  'error.notFound': string;
  'error.serverError': string;
  'error.networkError': string;
  'error.unauthorized': string;
  'error.forbidden': string;
  'error.tryAgain': string;
  'error.goHome': string;
  'error.contactSupport': string;

  // Admin
  'admin.dashboard': string;
  'admin.subtitle': string;
  'admin.articles': string;
  'admin.news': string;
  'admin.categories': string;
  'admin.tags': string;
  'admin.analytics': string;
  'admin.settings': string;
  'admin.users': string;
  'admin.backToSite': string;

  // Admin sections (dashboard tiles)
  'admin.sections.articles.title': string;
  'admin.sections.articles.description': string;
  'admin.sections.articles.stats': string;
  'admin.sections.news.title': string;
  'admin.sections.news.description': string;
  'admin.sections.news.stats': string;
  'admin.sections.categories.title': string;
  'admin.sections.categories.description': string;
  'admin.sections.categories.stats': string;
  'admin.sections.tags.title': string;
  'admin.sections.tags.description': string;
  'admin.sections.tags.stats': string;
  'admin.sections.analytics.title': string;
  'admin.sections.analytics.description': string;
  'admin.sections.analytics.stats': string;
  'admin.sections.ai.title': string;
  'admin.sections.ai.description': string;
  'admin.sections.ai.stats': string;
  'admin.sections.courses.title': string;
  'admin.sections.courses.description': string;
  'admin.sections.courses.stats': string;
  'admin.sections.notifications.title': string;
  'admin.sections.notifications.description': string;
  'admin.sections.notifications.stats': string;
  'admin.sections.email.title': string;
  'admin.sections.email.description': string;
  'admin.sections.email.stats': string;
  'admin.sections.discord.title': string;
  'admin.sections.discord.description': string;
  'admin.sections.discord.stats': string;
  'admin.sections.proposals.title': string;
  'admin.sections.proposals.description': string;
  'admin.sections.proposals.stats': string;
  'admin.sections.sources.title': string;
  'admin.sections.sources.description': string;
  'admin.sections.sources.stats': string;
  'admin.sections.users.title': string;
  'admin.sections.users.description': string;
  'admin.sections.users.stats': string;
}

export const translations: Record<Locale, Translations> = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.courses': 'Cursos',
    'nav.articles': 'Artículos',
    'nav.news': 'Noticias',
    'nav.community': 'Comunidad',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',

    // Homepage
    'home.hero.title': 'Bienvenido a Stakeados',
    'home.hero.subtitle':
      'La plataforma de aprendizaje descentralizada para educación Web3. Descubre artículos, noticias y cursos sobre tecnología blockchain.',
    'home.hero.cta.courses': 'Explorar Cursos',
    'home.hero.cta.articles': 'Leer Artículos',
    'home.hero.cta.news': 'Ver Noticias',
    'home.news.title': 'Últimas Noticias',
    'home.news.viewAll': 'Ver Todas las Noticias →',
    'home.articles.title': 'Artículos Destacados',
    'home.articles.viewAll': 'Ver Todos los Artículos →',
    'home.navigation.title': 'Explorar Plataforma',
    'home.courses.title': 'Cursos Populares',
    'home.courses.viewAll': 'Ver Todos los Cursos →',
    'home.courses.enroll': 'Inscribirse Ahora',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.readMore': 'Leer más',
    'common.showLess': 'Mostrar menos',

    // Time
    'time.minutesAgo': 'hace {minutes} minutos',
    'time.hoursAgo': 'hace {hours} horas',
    'time.daysAgo': 'hace {days} días',
    'time.weeksAgo': 'hace {weeks} semanas',
    'time.monthsAgo': 'hace {months} meses',
    'time.yearsAgo': 'hace {years} años',
    'time.justNow': 'ahora mismo',

    // Course levels
    'course.level.beginner': 'Principiante',
    'course.level.intermediate': 'Intermedio',
    'course.level.advanced': 'Avanzado',
    'course.comingSoon': 'Próximamente',
    'course.inDevelopment':
      'Nuestra plataforma educativa gratuita se encuentra en desarrollo',
    'course.stayTuned': 'Mantente atento para más actualizaciones',

    // Stats
    'stats.articles': 'Artículos',
    'stats.news': 'Noticias',
    'stats.courses': 'Cursos',
    'stats.users': 'Usuarios',
    'stats.members': 'Miembros',
    'stats.active': 'Activos',

    // Errors
    'error.notFound': 'Página no encontrada',
    'error.serverError': 'Error del servidor',
    'error.networkError': 'Error de conexión',
    'error.unauthorized': 'No autorizado',
    'error.forbidden': 'Acceso denegado',
    'error.tryAgain': 'Intentar de nuevo',
    'error.goHome': 'Ir al inicio',
    'error.contactSupport': 'Contactar soporte',

    // Admin
    'admin.dashboard': 'Panel de Administración',
    'admin.subtitle':
      'Administra tu plataforma Stakeados con herramientas avanzadas',
    'admin.articles': 'Artículos',
    'admin.news': 'Noticias',
    'admin.categories': 'Categorías',
    'admin.tags': 'Etiquetas',
    'admin.analytics': 'Analíticas',
    'admin.settings': 'Configuración',
    'admin.users': 'Usuarios',
    'admin.backToSite': 'Volver al Sitio',

    // Admin sections
    'admin.sections.articles.title': 'Artículos',
    'admin.sections.articles.description':
      'Gestiona y revisa los artículos de la comunidad',
    'admin.sections.articles.stats': 'Revisar envíos pendientes',
    'admin.sections.news.title': 'Gestión de noticias',
    'admin.sections.news.description':
      'Agregación y procesamiento de noticias con IA',
    'admin.sections.news.stats': 'Procesamiento automático desde 8+ fuentes',
    'admin.sections.categories.title': 'Categorías',
    'admin.sections.categories.description':
      'Organiza el contenido con categorías',
    'admin.sections.categories.stats': 'Organización de contenido',
    'admin.sections.tags.title': 'Etiquetas',
    'admin.sections.tags.description': 'Gestiona etiquetas y palabras clave',
    'admin.sections.tags.stats': 'Sistema de etiquetas',
    'admin.sections.analytics.title': 'Analíticas',
    'admin.sections.analytics.description':
      'Rendimiento de la plataforma e insights',
    'admin.sections.analytics.stats': 'Insights basados en datos',
    'admin.sections.ai.title': 'Procesamiento IA',
    'admin.sections.ai.description': 'Procesamiento y análisis automatizado',
    'admin.sections.ai.stats': 'Automatización con GPT-4',
    'admin.sections.courses.title': 'Cursos',
    'admin.sections.courses.description': 'Gestión de contenido educativo',
    'admin.sections.courses.stats': 'Plataforma de aprendizaje',
    'admin.sections.notifications.title': 'Notificaciones',
    'admin.sections.notifications.description':
      'Sistema de notificaciones a usuarios',
    'admin.sections.notifications.stats': 'Alertas push y email',
    'admin.sections.email.title': 'Gestión de email',
    'admin.sections.email.description': 'Newsletter y campañas de correo',
    'admin.sections.email.stats': 'Centro de comunicación',
    'admin.sections.discord.title': 'Integración Discord',
    'admin.sections.discord.description': 'Gestión de la comunidad en Discord',
    'admin.sections.discord.stats': 'Engagement de comunidad',
    'admin.sections.proposals.title': 'Propuestas',
    'admin.sections.proposals.description':
      'Propuestas de gobernanza de la comunidad',
    'admin.sections.proposals.stats': 'Gobernanza DAO',
    'admin.sections.sources.title': 'Fuentes de noticias',
    'admin.sections.sources.description': 'Gestión de fuentes y RSS',
    'admin.sections.sources.stats': 'Configuración de fuentes',
    'admin.sections.users.title': 'Usuarios',
    'admin.sections.users.description': 'Gestión de usuarios y roles',
    'admin.sections.users.stats': 'Roles y permisos',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.articles': 'Articles',
    'nav.news': 'News',
    'nav.community': 'Community',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',

    // Homepage
    'home.hero.title': 'Welcome to Stakeados',
    'home.hero.subtitle':
      'The decentralized learning platform for Web3 education. Discover articles, news, and courses on blockchain technology.',
    'home.hero.cta.courses': 'Explore Courses',
    'home.hero.cta.articles': 'Read Articles',
    'home.hero.cta.news': 'View News',
    'home.news.title': 'Latest News',
    'home.news.viewAll': 'View All News →',
    'home.articles.title': 'Featured Articles',
    'home.articles.viewAll': 'View All Articles →',
    'home.navigation.title': 'Explore Platform',
    'home.courses.title': 'Popular Courses',
    'home.courses.viewAll': 'Browse All Courses →',
    'home.courses.enroll': 'Enroll Now',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.readMore': 'Read more',
    'common.showLess': 'Show less',

    // Time
    'time.minutesAgo': '{minutes} minutes ago',
    'time.hoursAgo': '{hours} hours ago',
    'time.daysAgo': '{days} days ago',
    'time.weeksAgo': '{weeks} weeks ago',
    'time.monthsAgo': '{months} months ago',
    'time.yearsAgo': '{years} years ago',
    'time.justNow': 'just now',

    // Course levels
    'course.level.beginner': 'Beginner',
    'course.level.intermediate': 'Intermediate',
    'course.level.advanced': 'Advanced',
    'course.comingSoon': 'Coming Soon',
    'course.inDevelopment':
      'Our free educational platform is under development',
    'course.stayTuned': 'Stay tuned for more updates',

    // Stats
    'stats.articles': 'Articles',
    'stats.news': 'News',
    'stats.courses': 'Courses',
    'stats.users': 'Users',
    'stats.members': 'Members',
    'stats.active': 'Active',

    // Errors
    'error.notFound': 'Page not found',
    'error.serverError': 'Server error',
    'error.networkError': 'Network error',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Access denied',
    'error.tryAgain': 'Try again',
    'error.goHome': 'Go home',
    'error.contactSupport': 'Contact support',

    // Admin
    'admin.dashboard': 'Admin Dashboard',
    'admin.subtitle':
      'Manage your Stakeados platform with powerful admin tools',
    'admin.articles': 'Articles',
    'admin.news': 'News',
    'admin.categories': 'Categories',
    'admin.tags': 'Tags',
    'admin.analytics': 'Analytics',
    'admin.settings': 'Settings',
    'admin.users': 'Users',
    'admin.backToSite': 'Back to Site',

    // Admin sections
    'admin.sections.articles.title': 'Articles',
    'admin.sections.articles.description':
      'Manage and review community articles',
    'admin.sections.articles.stats': 'Review pending submissions',
    'admin.sections.news.title': 'News Management',
    'admin.sections.news.description':
      'AI-powered news aggregation and processing',
    'admin.sections.news.stats': 'Auto-processing from 8+ sources',
    'admin.sections.categories.title': 'Categories',
    'admin.sections.categories.description': 'Organize content with categories',
    'admin.sections.categories.stats': 'Content organization',
    'admin.sections.tags.title': 'Tags',
    'admin.sections.tags.description': 'Manage content tags and keywords',
    'admin.sections.tags.stats': 'Tag management system',
    'admin.sections.analytics.title': 'Analytics',
    'admin.sections.analytics.description':
      'Platform performance and user insights',
    'admin.sections.analytics.stats': 'Data-driven insights',
    'admin.sections.ai.title': 'AI Processing',
    'admin.sections.ai.description':
      'Automated content processing and analysis',
    'admin.sections.ai.stats': 'GPT-4 powered automation',
    'admin.sections.courses.title': 'Courses',
    'admin.sections.courses.description': 'Educational content management',
    'admin.sections.courses.stats': 'Learning platform',
    'admin.sections.notifications.title': 'Notifications',
    'admin.sections.notifications.description': 'User notification system',
    'admin.sections.notifications.stats': 'Push & email alerts',
    'admin.sections.email.title': 'Email Management',
    'admin.sections.email.description': 'Newsletter and email campaigns',
    'admin.sections.email.stats': 'Communication hub',
    'admin.sections.discord.title': 'Discord Integration',
    'admin.sections.discord.description': 'Community Discord management',
    'admin.sections.discord.stats': 'Community engagement',
    'admin.sections.proposals.title': 'Proposals',
    'admin.sections.proposals.description': 'Community governance proposals',
    'admin.sections.proposals.stats': 'DAO governance',
    'admin.sections.sources.title': 'News Sources',
    'admin.sections.sources.description': 'RSS feed and source management',
    'admin.sections.sources.stats': 'Source configuration',
    'admin.sections.users.title': 'Users',
    'admin.sections.users.description': 'User and role management',
    'admin.sections.users.stats': 'Roles & permissions',
  },
};
