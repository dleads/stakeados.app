const createNextIntlPlugin = require('next-intl/plugin');
let withBundleAnalyzer = config => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer is optional; proceed without it if not installed
}

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  typescript: {
    // Temporal: no romper el build por errores de TS (usaremos `npm run typecheck` aparte)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporal: no romper el build por ESLint (usaremos `npm run lint` aparte)
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.pexels.com', 'res.cloudinary.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'recharts',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
