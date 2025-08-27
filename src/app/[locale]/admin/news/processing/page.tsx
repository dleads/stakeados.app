import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import NewsProcessingInterface from '@/components/admin/news/NewsProcessingInterface';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.news.processing');

  return {
    title: `${t('interface.title')} - Stakeados Admin`,
    description: t('interface.subtitle'),
  };
}

export default async function NewsProcessingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NewsProcessingInterface />
    </div>
  );
}
