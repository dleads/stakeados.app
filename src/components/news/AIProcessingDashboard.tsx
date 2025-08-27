'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Brain,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  Globe,
  Target,
} from 'lucide-react';

interface ProcessingStats {
  totalRawArticles: number;
  processedArticles: number;
  publishedArticles: number;
  averageRelevanceScore: number;
  processingRate: number;
}

export function AIProcessingDashboard() {
  const t = useTranslations('admin.ai_processing');
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStats();

    // Set up polling for stats updates
    const interval = setInterval(loadStats, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/news/process');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load processing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const runProcessing = async () => {
    try {
      setProcessing(true);

      const response = await fetch('/api/admin/news/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 50 }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Processing completed:', result);
        await loadStats(); // Refresh stats
      } else {
        const error = await response.json();
        console.error('Processing failed:', error);
      }
    } catch (error) {
      console.error('Failed to run processing:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getRelevanceScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProcessingRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    if (rate >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('description')}</p>
        </div>

        <button
          onClick={runProcessing}
          disabled={processing}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:bg-primary/50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {processing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {processing ? t('processing') : t('process_articles')}
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-3xl font-bold text-blue-400">
                {stats.totalRawArticles}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('raw_articles')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('last_24h')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Brain className="w-6 h-6 text-purple-400" />
              <span className="text-3xl font-bold text-purple-400">
                {stats.processedArticles}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('processed_articles')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('ai_enhanced')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-3xl font-bold text-green-400">
                {stats.publishedArticles}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('published_articles')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('high_quality')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-6 h-6 text-yellow-400" />
              <span
                className={`text-3xl font-bold ${getRelevanceScoreColor(stats.averageRelevanceScore)}`}
              >
                {stats.averageRelevanceScore}/10
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('avg_relevance')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('ai_scored')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-6 h-6 text-orange-400" />
              <span
                className={`text-3xl font-bold ${getProcessingRateColor(stats.processingRate)}`}
              >
                {stats.processingRate}%
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('processing_rate')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('success_rate')}</p>
          </div>
        </div>
      )}

      {/* AI Features Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          {t('ai_features')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-900/20 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">
                {t('content_analysis')}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('content_analysis_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-900/20 p-2 rounded-lg">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">
                {t('relevance_scoring')}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('relevance_scoring_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-900/20 p-2 rounded-lg">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">{t('translation')}</h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('translation_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-yellow-900/20 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">{t('categorization')}</h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('categorization_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-red-900/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">
                {t('sentiment_analysis')}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('sentiment_analysis_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-white">
                {t('keyword_extraction')}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {t('keyword_extraction_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Pipeline */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {t('processing_pipeline')}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-blue-900/20 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400 mt-2">{t('fetch')}</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-600"></div>

            <div className="flex flex-col items-center">
              <div className="bg-purple-900/20 p-3 rounded-full">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400 mt-2">{t('analyze')}</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-600"></div>

            <div className="flex flex-col items-center">
              <div className="bg-green-900/20 p-3 rounded-full">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400 mt-2">
                {t('translate')}
              </span>
            </div>

            <div className="w-8 h-0.5 bg-gray-600"></div>

            <div className="flex flex-col items-center">
              <div className="bg-primary/20 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm text-gray-400 mt-2">{t('publish')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
