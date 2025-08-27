import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import RSSSourceManagerPage from './RSSSourceManagerPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.news.sources');

  return {
    title: `${t('title')} - Stakeados Admin`,
    description: t('subtitle'),
  };
}

export default function Page() {
  return <RSSSourceManagerPage />;
}
