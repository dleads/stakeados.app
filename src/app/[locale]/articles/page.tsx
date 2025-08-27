import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n';
import ArticleGrid from '@/components/articles/ArticleGrid';
import StakeadosLayout from '@/components/layout/StakeadosLayout';
import type { Locale } from '@/types/content';

interface ArticlesPageProps {
  params: {
    locale: Locale;
  };
  searchParams: {
    category?: string;
    difficulty?: string;
    search?: string;
  };
}

export async function generateMetadata({
  params,
}: ArticlesPageProps): Promise<Metadata> {
  const title = getTranslation(params.locale, 'nav.articles');
  const description =
    'Discover educational articles about blockchain, DeFi, and Web3 from our community of experts.';

  return {
    title: `${title} | Stakeados`,
    description,
    openGraph: {
      title: `${title} | Stakeados`,
      description,
      type: 'website',
    },
  };
}

export default function ArticlesPage({
  params,
  searchParams,
}: ArticlesPageProps) {
  return (
    <StakeadosLayout locale={params.locale}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              {getTranslation(params.locale, 'nav.articles')}
            </span>
          </h1>
          <p className="text-gray-300 text-center max-w-2xl mx-auto">
            Discover educational articles about blockchain, DeFi, and Web3 from
            our community of experts.
          </p>
        </div>

        <ArticleGrid
          locale={params.locale}
          showFilters={true}
          showSearch={true}
          categoryFilter={searchParams.category}
          className="max-w-7xl mx-auto"
        />
      </div>
    </StakeadosLayout>
  );
}
