import { getRequestConfig } from 'next-intl/server';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants';

export default getRequestConfig(async ({ locale }) => {
  // Resolver locale como string válido; fallback a DEFAULT_LOCALE
  const resolvedLocale: string = (LOCALES as readonly string[]).includes(
    locale as any
  )
    ? (locale as string)
    : DEFAULT_LOCALE;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});

// Export routing configuration
export const routing = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always' as const,
  pathnames: {
    '/': '/',
    '/articles': {
      en: '/articles',
      es: '/articulos',
    },
    '/articles/[slug]': {
      en: '/articles/[slug]',
      es: '/articulos/[slug]',
    },
    '/news': {
      en: '/news',
      es: '/noticias',
    },
    '/news/[id]': {
      en: '/news/[id]',
      es: '/noticias/[id]',
    },
    '/courses': {
      en: '/courses',
      es: '/cursos',
    },
    '/community': {
      en: '/community',
      es: '/comunidad',
    },
    '/profile': {
      en: '/profile',
      es: '/perfil',
    },
    '/search': {
      en: '/search',
      es: '/buscar',
    },
    '/categories': {
      en: '/categories',
      es: '/categorias',
    },
    '/tags': {
      en: '/tags',
      es: '/etiquetas',
    },
  },
};
