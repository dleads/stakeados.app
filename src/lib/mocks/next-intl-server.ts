// Mock implementation of next-intl/server to avoid errors during transition

export async function getTranslations(namespace?: string) {
  return (key: string, _params?: any) => {
    console.warn(
      `Translation missing: ${namespace ? namespace + '.' : ''}${key}`
    );
    return key;
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
  return {};
}

export function getFormatter() {
  return {
    dateTime: (value: Date, options?: any) => value.toLocaleDateString(),
    number: (value: number, options?: any) => value.toString(),
    relativeTime: (value: number, options?: any) => value.toString(),
  };
}
