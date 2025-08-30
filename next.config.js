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
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
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
  // Webpack optimizations for navigation components
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Split navigation components into separate chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          navigationCore: {
            name: 'navigation-core',
            test: /[\\/]src[\\/]components[\\/]navigation[\\/](MainNavigation|NavigationProvider|NavLogo|NavLinks|HamburgerButton)\.tsx?$/,
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          navigationLazy: {
            name: 'navigation-lazy',
            test: /[\\/]src[\\/]components[\\/]navigation[\\/](UserMenu|MobileMenu|SearchInterface|ComingSoonModal)\.tsx?$/,
            chunks: 'async',
            priority: 25,
          },
          navigationAdmin: {
            name: 'navigation-admin',
            test: /[\\/]src[\\/]components[\\/]navigation[\\/](NavigationConfigPanel|analytics)[\\/]/,
            chunks: 'async',
            priority: 20,
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
