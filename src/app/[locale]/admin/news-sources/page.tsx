import { Metadata } from 'next';
import { NewsSourceManager } from '@/components/news/NewsSourceManager';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'News Sources - Stakeados',
    description: 'Manage news sources and feeds',
  };
}

export default function NewsSourcesPage() {
  return <NewsSourceManager />;
}
