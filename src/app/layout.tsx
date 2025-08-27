import './globals.css';
import '../styles/gaming-effects.css';
import { Metadata, Viewport } from 'next';

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
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
