import { NextRequest, NextResponse } from 'next/server';
import { seoService } from '@/lib/services/seoService';

export const runtime = 'edge';
export const revalidate = 86400; // Cache for 24 hours

export async function GET(_request: NextRequest) {
  try {
    const robotsTxt = seoService.generateRobotsTxt();

    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control':
          'public, s-maxage=86400, stale-while-revalidate=172800',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);

    // Return fallback robots.txt
    const fallbackRobots = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /dashboard/

# Allow specific paths
Allow: /api/og/

# Crawl delay
Crawl-delay: 1`;

    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }
}
