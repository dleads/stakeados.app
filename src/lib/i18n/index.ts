// Main exports for the i18n system
export {
  useTranslation,
  getTranslation,
  getTranslations,
  hasTranslation,
  formatRelativeTime,
} from './useTranslation';
export { translations } from './translations';
export {
  getLocalizedPath,
  getLocalizedUrl,
  getCanonicalRoute,
  getLanguageSwitcherUrls,
  getNavigationItems,
  matchesRoute,
  getBreadcrumbs,
  routeMap,
} from './navigation';

export type { TranslationKey, UseTranslationReturn } from './useTranslation';
export type { Translations } from './translations';
