import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';

import NewsDetailView from '@/components/news/NewsDetailView';
import type { Locale } from '@/types';

interface NewsDetailPageProps {
  params: {
    locale: Locale;
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params: { locale, id },
}: NewsDetailPageProps): Promise<Metadata> {
  const supabase = createClient();

  const { data: article, error } = await supabase
    .from('news')
    .select('title, summary, source_name, published_at')
    .eq('id', id)
    .single();

  if (error || !article) {
    return {
      title: 'Article Not Found | Stakeados',
      description: 'The requested news article could not be found.',
    };
  }

  // Extract localized title and summary
  const titleObj = article.title as Record<string, string> | string;
  const summaryObj = article.summary as Record<string, string> | string;

  const title =
    typeof titleObj === 'string'
      ? titleObj
      : titleObj[locale] || titleObj['en'] || 'Untitled Article';

  const summary =
    typeof summaryObj === 'string'
      ? summaryObj
      : summaryObj[locale] || summaryObj['en'] || 'No summary available';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stakeados.com';

  return {
    title: `${title} | Stakeados News`,
    description: summary,
    openGraph: {
      title,
      description: summary,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: article.source_name ? [article.source_name] : undefined,
      // images: article.image_url ? [
      //   {
      //     url: article.image_url,
      //     width: 1200,
      //     height: 630,
      //     alt: title,
      //   }
      // ] : undefined,
      url: `${baseUrl}/${locale}/news/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      // images: article.image_url ? [article.image_url] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/news/${id}`,
      languages: {
        en: `${baseUrl}/en/news/${id}`,
        es: `${baseUrl}/es/news/${id}`,
      },
    },
  };
}

export default async function NewsDetailPage({
  params: { locale, id },
}: NewsDetailPageProps) {
  // Validate that the article exists
  const supabase = createClient();

  const { data: article, error } = await supabase
    .from('news')
    .select('id')
    .eq('id', id)
    .single();

  if (error || !article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stakeados-gray-900">
      <div className="container mx-auto px-4 py-8">
        <NewsDetailView
          articleId={id}
          locale={locale}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
}
