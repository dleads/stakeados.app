import { LOCALES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import AppProviders from '@/components/app/AppProviders';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  // Validate locale
  if (!LOCALES.includes(locale as any)) {
    notFound();
  }

  // Cargar mensajes del locale
  let messages: Record<string, any> = {};
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (e) {
    console.warn(`No se encontraron mensajes para el locale "${locale}"`);
  }

  const ENABLE_WEB3 = process.env.NEXT_PUBLIC_WEB3_ENABLED === 'true';

  return (
    <AppProviders locale={locale} messages={messages} enableWeb3={ENABLE_WEB3}>
      {children}
    </AppProviders>
  );
}
