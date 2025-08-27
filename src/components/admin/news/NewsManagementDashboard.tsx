'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Newspaper,
  Rss,
  Bot,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Settings,
  BarChart3,
  Globe,
  Activity,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewsManagement } from '@/hooks/useNewsManagement';
import NewsCategorizationInterface from './NewsCategorizationInterface';
import AIProcessingMonitor from './AIProcessingMonitor';
import RSSSourceManager from './RSSSourceManager';

export default function NewsManagementDashboard() {
  const t = useTranslations('admin.news');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sources' | 'processing' | 'queue'
  >('overview');

  const {
    stats,
    sources,
    processingJobs,
    newsQueue,
    categories,
    loading,
    refreshing,
    error,
    refresh,
    toggleSourceStatus,
  } = useNewsManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-stakeados-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-stakeados-primary" />
            {t('title')}
          </h1>
          <p className="text-stakeados-gray-400 mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn('w-4 h-4', refreshing && 'animate-spin')}
            />
            {t('refresh')}
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors">
            <Settings className="w-4 h-4" />
            {t('settings')}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stakeados-gray-400 text-sm">
                {t('stats.totalNews')}
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <Newspaper className="w-8 h-8 text-stakeados-primary" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-500">{stats.processed}</span>
            <span className="text-stakeados-gray-400">
              {t('stats.processed')}
            </span>
            <span className="text-yellow-500">{stats.unprocessed}</span>
            <span className="text-stakeados-gray-400">
              {t('stats.pending')}
            </span>
          </div>
        </div>

        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stakeados-gray-400 text-sm">
                {t('stats.activeSources')}
              </p>
              <p className="text-2xl font-bold text-white">{stats.sources}</p>
            </div>
            <Rss className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-stakeados-gray-400">
                {sources.filter(s => s.health_status === 'healthy').length}{' '}
                {t('stats.healthy')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stakeados-gray-400 text-sm">
                {t('stats.trending')}
              </p>
              <p className="text-2xl font-bold text-white">{stats.trending}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-stakeados-gray-400">
              {t('stats.highEngagement')}
            </span>
          </div>
        </div>

        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stakeados-gray-400 text-sm">
                {t('stats.aiProcessing')}
              </p>
              <p className="text-2xl font-bold text-white">
                {processingJobs.filter(j => j.status === 'processing').length}
              </p>
            </div>
            <Bot className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Activity className="w-3 h-3 text-purple-500" />
            <span className="text-stakeados-gray-400">
              {t('stats.activeJobs')}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-stakeados-gray-600">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: t('tabs.overview'), icon: BarChart3 },
            { id: 'sources', label: t('tabs.sources'), icon: Rss },
            { id: 'processing', label: t('tabs.processing'), icon: Bot },
            { id: 'queue', label: t('tabs.queue'), icon: Clock },
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-stakeados-primary text-stakeados-primary'
                    : 'border-transparent text-stakeados-gray-400 hover:text-stakeados-gray-300 hover:border-stakeados-gray-300'
                )}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Distribution */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-stakeados-primary" />
                {t('overview.languageDistribution')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300">Español</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-stakeados-gray-700 rounded-full h-2">
                      <div
                        className="bg-stakeados-primary h-2 rounded-full"
                        style={{
                          width: `${(stats.by_language.es / stats.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {stats.by_language.es}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300">English</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-stakeados-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(stats.by_language.en / stats.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {stats.by_language.en}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-stakeados-primary" />
                {t('overview.recentActivity')}
              </h3>
              <div className="space-y-3">
                {newsQueue.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming"
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        item.processed ? 'bg-green-500' : 'bg-yellow-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-stakeados-gray-400 text-xs">
                        {item.source_name}
                      </p>
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <RSSSourceManager
            sources={sources.map(source => ({
              // Campos existentes del hook
              id: source.id,
              name: source.name,
              url: source.url,
              is_active: source.is_active,
              health_status: (source.health_status as any) || 'unknown',
              last_fetched_at: source.last_fetched_at,
              priority: source.priority,
              source_type: source.source_type,
              quality_score: source.quality_score,
              consecutive_failures: source.consecutive_failures || 0,
              // Campos requeridos por RSSSourceManager.NewsSource
              description: undefined,
              api_key: undefined,
              api_endpoint: undefined,
              headers: undefined,
              categories: [],
              language: 'es',
              fetch_interval: 60,
              max_failures: 5,
              last_successful_fetch_at: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              articles_today: source.articles_today || 0,
            }))}
            categories={categories.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description ?? undefined,
              color: (c.color as string | undefined) ?? '#888888',
              icon: undefined,
            }))}
            onCreateSource={async sourceData => {
              try {
                const response = await fetch('/api/admin/news-sources', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(sourceData),
                });
                if (!response.ok) throw new Error('Failed to create source');
                await refresh();
              } catch (error) {
                console.error('Error creating source:', error);
              }
            }}
            onUpdateSource={async (id, updates) => {
              try {
                const response = await fetch(`/api/admin/news-sources/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates),
                });
                if (!response.ok) throw new Error('Failed to update source');
                await refresh();
              } catch (error) {
                console.error('Error updating source:', error);
              }
            }}
            onDeleteSource={async id => {
              try {
                const response = await fetch(`/api/admin/news-sources/${id}`, {
                  method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete source');
                await refresh();
              } catch (error) {
                console.error('Error deleting source:', error);
              }
            }}
            onTestSource={async id => {
              try {
                const response = await fetch(
                  `/api/admin/news-sources/${id}/test`,
                  {
                    method: 'POST',
                  }
                );
                if (!response.ok) throw new Error('Failed to test source');
                const result = await response.json();
                return result;
              } catch (error) {
                console.error('Error testing source:', error);
                return {
                  success: false,
                  status: 'error',
                  response_time: 0,
                  articles_fetched: 0,
                  error_message:
                    error instanceof Error ? error.message : 'Unknown error',
                };
              }
            }}
            onToggleSource={toggleSourceStatus}
            onFetchNow={async id => {
              try {
                const response = await fetch(
                  `/api/admin/news-sources/${id}/fetch`,
                  {
                    method: 'POST',
                  }
                );
                if (!response.ok) throw new Error('Failed to fetch source');
                await refresh();
              } catch (error) {
                console.error('Error fetching source:', error);
              }
            }}
            loading={loading}
            error={error}
          />
        )}

        {activeTab === 'processing' && (
          <AIProcessingMonitor
            jobs={processingJobs}
            onStartBatch={async options => {
              try {
                const response = await fetch('/api/admin/ai/processing', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(options),
                });
                if (!response.ok)
                  throw new Error('Failed to start batch processing');
                await refresh();
              } catch (error) {
                console.error('Error starting batch processing:', error);
              }
            }}
            onCancelJob={async jobId => {
              try {
                const response = await fetch(
                  `/api/admin/ai/processing/${jobId}/cancel`,
                  {
                    method: 'POST',
                  }
                );
                if (!response.ok) throw new Error('Failed to cancel job');
                await refresh();
              } catch (error) {
                console.error('Error canceling job:', error);
              }
            }}
            onRetryJob={async jobId => {
              try {
                const response = await fetch(
                  `/api/admin/ai/processing/${jobId}/retry`,
                  {
                    method: 'POST',
                  }
                );
                if (!response.ok) throw new Error('Failed to retry job');
                await refresh();
              } catch (error) {
                console.error('Error retrying job:', error);
              }
            }}
          />
        )}

        {activeTab === 'queue' && (
          <NewsCategorizationInterface
            newsItems={newsQueue.map(item => ({
              ...item,
              // Ajustar category al tipo esperado por el componente
              category: item.category
                ? {
                    id: item.category.id,
                    name: item.category.name,
                    slug: item.category.name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9\-]/g, ''),
                    color: item.category.color,
                    article_count: 0,
                    news_count: 0,
                  }
                : undefined,
            }))}
            categories={categories.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              color: (c.color as string | undefined) ?? '#888888',
              description: c.description ?? undefined,
              parent_id: c.parent_id ?? undefined,
              article_count: c.article_count,
              news_count: c.news_count,
            }))}
            onUpdateImageUrl={async (newsId, imageUrl) => {
              try {
                const response = await fetch(`/api/admin/news/${newsId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image_url: imageUrl }),
                });
                if (!response.ok) throw new Error('Failed to update image URL');
                await refresh();
              } catch (error) {
                console.error('Error updating image URL:', error);
              }
            }}
            onCategorizeNews={async (newsId, categoryId) => {
              try {
                const response = await fetch(
                  `/api/admin/news/${newsId}/categorize`,
                  {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category_id: categoryId }),
                  }
                );
                if (!response.ok) throw new Error('Failed to categorize news');
                await refresh();
              } catch (error) {
                console.error('Error categorizing news:', error);
              }
            }}
            onTagNews={async (newsId, tags) => {
              try {
                const response = await fetch(`/api/admin/news/${newsId}/tags`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tags }),
                });
                if (!response.ok) throw new Error('Failed to tag news');
                await refresh();
              } catch (error) {
                console.error('Error tagging news:', error);
              }
            }}
            onApproveNews={async newsId => {
              try {
                const response = await fetch(
                  `/api/admin/news/${newsId}/approve`,
                  {
                    method: 'POST',
                  }
                );
                if (!response.ok) throw new Error('Failed to approve news');
                await refresh();
              } catch (error) {
                console.error('Error approving news:', error);
              }
            }}
            onRejectNews={async (newsId, reason) => {
              try {
                const response = await fetch(
                  `/api/admin/news/${newsId}/reject`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                  }
                );
                if (!response.ok) throw new Error('Failed to reject news');
                await refresh();
              } catch (error) {
                console.error('Error rejecting news:', error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
