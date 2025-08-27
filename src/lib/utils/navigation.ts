// Mock navigation utilities to replace next-intl/navigation
import {
  useRouter as useNextRouter,
  usePathname as useNextPathname,
} from 'next/navigation';
import NextLink from 'next/link';
import { redirect as nextRedirect } from 'next/navigation';

export const Link = NextLink;
export const redirect = nextRedirect;
export const usePathname = useNextPathname;
export const useRouter = useNextRouter;

// Helper function to get localized path
export function getLocalizedPath(path: string, locale: string): string {
  const pathMappings: Record<string, Record<string, string>> = {
    '/courses': {
      en: '/courses',
      es: '/cursos',
    },
    '/community': {
      en: '/community',
      es: '/comunidad',
    },
    '/news': {
      en: '/news',
      es: '/noticias',
    },
    '/profile': {
      en: '/profile',
      es: '/perfil',
    },
    '/genesis': {
      en: '/genesis',
      es: '/genesis',
    },
  };

  return pathMappings[path]?.[locale] || path;
}

// Helper function to get canonical path from localized path
export function getCanonicalPath(
  localizedPath: string,
  locale: string
): string {
  const reverseMappings: Record<string, string> = {
    '/cursos': '/courses',
    '/comunidad': '/community',
    '/noticias': '/news',
    '/perfil': '/profile',
  };

  if (locale === 'es' && reverseMappings[localizedPath]) {
    return reverseMappings[localizedPath];
  }

  return localizedPath;
}
