import { NextRequest, NextResponse } from 'next/server';
import { seoService } from '@/lib/services/seoService';

export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(_request: NextRequest) {
  try {
    // Generate complete sitemap XML
    const sitemapXml = await seoService.generateSitemap();

    return new NextResponse(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return minimal sitemap in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en" />
    <xhtml:link rel="alternate" hreflang="es" href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/es" />
  </url>
  <url>
    <loc>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/es</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en" />
    <xhtml:link rel="alternate" hreflang="es" href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/es" />
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  }
}
