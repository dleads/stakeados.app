'use client';

import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RoleProvider } from '@/components/auth/RoleProvider';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { NavigationProvider } from '@/components/navigation/NavigationProvider';
import { NavigationPerformanceProvider } from '@/components/navigation/performance/NavigationPerformanceProvider';
import MainNavigation from '@/components/navigation/MainNavigation';

interface AppProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, any>;
  enableWeb3: boolean;
}

export default function AppProviders({
  children,
  locale,
  messages,
  enableWeb3,
}: AppProvidersProps) {
  const Tree = (
    <AuthProvider>
      <RoleProvider>
        <NavigationPerformanceProvider>
          <NavigationProvider>
            <MainNavigation />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
          </NavigationProvider>
        </NavigationPerformanceProvider>
      </RoleProvider>
    </AuthProvider>
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {enableWeb3 ? <Web3Provider>{Tree}</Web3Provider> : Tree}
    </NextIntlClientProvider>
  );
}
