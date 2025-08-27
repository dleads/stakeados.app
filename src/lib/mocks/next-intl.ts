// Mock implementation of next-intl to avoid errors during transition
// This is a temporary solution while we migrate to our custom i18n system

// Import real translations
import esMessages from '../../../messages/es.json';

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the path if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

export function useTranslations(namespace?: string) {
  return (key: string, _params?: any) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const translation = getNestedValue(esMessages, fullKey);

    if (translation === fullKey) {
      console.warn(`Translation missing: ${fullKey}`);
    }

    return translation;
  };
}

export function useLocale() {
  return 'es'; // Default locale
}

// Server-side functions
export async function getTranslations(namespace?: string) {
  return (key: string, _params?: any) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const translation = getNestedValue(esMessages, fullKey);

    if (translation === fullKey) {
      console.warn(`Translation missing: ${fullKey}`);
    }

    return translation;
  };
}

export function getLocale() {
  return 'es';
}

export function getNow() {
  return new Date();
}

export function getTimeZone() {
  return 'UTC';
}

export function getMessages() {
  return esMessages;
}

export function getFormatter() {
  return {
    dateTime: (value: Date, options?: any) => value.toLocaleDateString(),
    number: (value: number, options?: any) => value.toString(),
    relativeTime: (value: number, options?: any) => value.toString(),
  };
}
