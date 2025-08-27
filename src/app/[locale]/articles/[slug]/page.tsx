import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleDetailView from '@/components/articles/ArticleDetailView';
import { ContentService } from '@/lib/services/contentService';
import type { Locale } from '@/types/content';

interface ArticlePageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

// Helper function to find article by slug
async function getArticleBySlug(slug: string, locale: Locale) {
  try {
    // Search for articles that match the slug
    const searchResult = await ContentService.searchArticles({
      query: slug.replace(/-/g, ' '),
      locale,
      limit: 50,
    });

    // Find exact match by generating slug from title
    const article = searchResult.data.find(
      article => ContentService.generateSlug(article.title[locale]) === slug
    );

    if (!article) {
      return null;
    }

    // Get full article details
    return await ContentService.getArticleById(article.id);
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug, params.locale);

  if (!article) {
    return {
      title: 'Article Not Found | Stakeados',
    };
  }

  const title = article.title[params.locale];
  const description = article.meta_description[params.locale];
  const imageUrl = article.featured_image_url || '/og-article-default.jpg';

  return {
    title: `${title} | Stakeados`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [imageUrl],
      authors: [article.author_name],
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/${params.locale}/${params.locale === 'es' ? 'articulos' : 'articles'}/${params.slug}`,
      languages: {
        en: `/en/articles/${ContentService.generateSlug(article.title.en)}`,
        es: `/es/articulos/${ContentService.generateSlug(article.title.es)}`,
      },
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug, params.locale);

  if (!article) {
    notFound();
  }

  return <ArticleDetailView article={article} locale={params.locale} />;
}
