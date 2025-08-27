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
  distDir: '.next-build',
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
  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID:
      process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_BASE_CHAIN_ID: process.env.NEXT_PUBLIC_BASE_CHAIN_ID,
    NEXT_PUBLIC_COINBASE_API_KEY: process.env.NEXT_PUBLIC_COINBASE_API_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
  // Image optimization
  images: {
    domains: ['images.pexels.com', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Redirect legacy login route to the new auth sign-in
  async redirects() {
    return [
      {
        source: '/:locale/padentro',
        destination: '/:locale/auth/sign-in',
        permanent: false,
      },
    ];
  },
  transpilePackages: ['discord.js', 'tailwind-merge'],
  // Webpack configuration for Node.js polyfills
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Avoid eval-based source maps in development as Edge runtime forbids code generation
    if (dev) {
      config.devtool = 'source-map';
    }

    // Remove broken next-intl aliases; use current mock provider in app/[locale]/layout.tsx
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },
  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'",
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
