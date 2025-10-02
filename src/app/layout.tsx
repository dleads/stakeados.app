import './globals.css';
import '../styles/gaming-effects.css';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import GA from '@/components/analytics/GA';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Stakeados - Decentralized Learning Platform',
  description:
    'Discover articles, news, and courses on decentralized learning. Join our community of educators and learners.',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Stakeados',
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
    'msapplication-tap-highlight': 'no',
    'touch-action': 'manipulation',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#00FF88',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProd = process.env.NODE_ENV === 'production';
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {isProd && (
          <>
            {/* Google Analytics */}
            <Script
              id="ga4-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-15Y51MPDQG'}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-inline" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-15Y51MPDQG'}', { send_page_view: false });
              `}
            </Script>

            {/* Google AdSense */}
            <Script
              id="adsense-script"
              strategy="afterInteractive"
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-6769576032098869'}`}
            />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          {isProd && <GA />}
          {children}
        </Suspense>
      </body>
    </html>
  );
}
