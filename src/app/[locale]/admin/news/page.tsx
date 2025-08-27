import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import NewsManagementDashboard from '@/components/admin/news/NewsManagementDashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.news');

  return {
    title: `${t('title')} - Stakeados Admin`,
    description: t('subtitle'),
  };
}

export default async function NewsAdminPage() {
  return <NewsManagementDashboard />;
}
