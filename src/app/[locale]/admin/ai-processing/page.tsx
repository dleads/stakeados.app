import { Metadata } from 'next';
import { AIProcessingDashboard } from '@/components/news/AIProcessingDashboard';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Processing - Stakeados',
    description: 'AI-powered content processing and analysis',
  };
}

export default function AIProcessingPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AIProcessingDashboard />
      </div>
    </div>
  );
}
