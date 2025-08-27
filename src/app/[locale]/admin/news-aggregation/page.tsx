import { Metadata } from 'next';
import { NewsAggregationDashboard } from '@/components/news/NewsAggregationDashboard';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'News Aggregation - Stakeados',
    description: 'AI-powered news aggregation and analysis',
  };
}

export default function NewsAggregationPage() {
  return <NewsAggregationDashboard />;
}
