'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    // Align with global type expectations used by Next/gtag typings
    gtag: (...args: any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

const GA: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    // Evitar track en rutas administrativas o API
    const path = pathname || '/';
    if (path.startsWith('/admin') || path.startsWith('/api')) return;

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-15Y51MPDQG';

    const page_path = `${path}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    window.gtag('config', gaId, {
      page_path,
    });
  }, [pathname, searchParams]);

  return null;
};

export default GA;
