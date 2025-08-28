import type { Locale } from '@/types';

// Minimal NewsArticle shape to type helpers safely on client
export type NewsArticle = {
  title: string;
  description?: string | null;
  summary?: string | null;
  // Optional localized summaries
  summary_en?: string | null;
  summary_es?: string | null;
};

// Helper function to get localized news title (client-safe)
export const getNewsTitle = (
  article: NewsArticle,
  _locale: Locale = 'en'
): string => {
  return article.title || 'Untitled Article';
};

// Helper function to get localized news summary (client-safe)
export const getNewsSummary = (
  article: NewsArticle,
  locale: Locale = 'en'
): string => {
  const articleAny = article as any;
  if (locale === 'es' && articleAny.summary_es) {
    return articleAny.summary_es;
  }
  return articleAny.summary_en || articleAny.summary || articleAny.description || 'No summary available';
};

// Helper function to get localized news content (client-safe)
export const getNewsContent = (
  article: NewsArticle,
  _locale: Locale = 'en'
): string => {
  const articleAny = article as any;
  return articleAny.description || 'No content available';
};
