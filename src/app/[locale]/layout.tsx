import { LOCALES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RoleProvider } from '@/components/auth/RoleProvider';
import { Web3Provider } from '@/components/web3/Web3Provider';

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

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Web3Provider>
        <AuthProvider>
          <RoleProvider>{children}</RoleProvider>
        </AuthProvider>
      </Web3Provider>
    </NextIntlClientProvider>
  );
}
