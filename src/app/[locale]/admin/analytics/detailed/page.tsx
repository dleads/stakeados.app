import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArticlePerformanceView } from '@/components/admin/analytics/ArticlePerformanceView';
import { ContentTrendAnalysis } from '@/components/admin/analytics/ContentTrendAnalysis';
import { EngagementMetricsVisualization } from '@/components/admin/analytics/EngagementMetricsVisualization';
import { CustomReportBuilder } from '@/components/admin/analytics/CustomReportBuilder';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.analytics');

  return {
    title: `${t('title')} - Detailed Analytics`,
    description: t('subtitle'),
  };
}

interface DetailedAnalyticsPageProps {
  searchParams: { tab?: string; articleId?: string };
}

export default async function DetailedAnalyticsPage({
  searchParams,
}: DetailedAnalyticsPageProps) {
  const t = await getTranslations('admin.analytics');
  const defaultTab = searchParams.tab || 'trends';
  const articleId = searchParams.articleId;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')} - Detailed Views
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics and reporting tools
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">{t('trendAnalysis.title')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('engagement.title')}</TabsTrigger>
          <TabsTrigger value="reports">{t('reportBuilder.title')}</TabsTrigger>
          <TabsTrigger value="article" disabled={!articleId}>
            {t('articlePerformance.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <ContentTrendAnalysis />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <EngagementMetricsVisualization />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <CustomReportBuilder />
        </TabsContent>

        {articleId && (
          <TabsContent value="article" className="space-y-6">
            <ArticlePerformanceView articleId={articleId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
