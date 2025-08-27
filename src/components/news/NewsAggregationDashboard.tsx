'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Play,
  RefreshCw,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Database,
} from 'lucide-react';
import type { NewsAggregationJob } from '@/types/news';

interface AggregationStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_articles_fetched: number;
  total_articles_processed: number;
  avg_processing_time: string | null;
}

export function NewsAggregationDashboard() {
  const t = useTranslations('admin.news_aggregation');
  const [jobs, setJobs] = useState<NewsAggregationJob[]>([]);
  const [stats, setStats] = useState<AggregationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Set up polling for job updates
    const interval = setInterval(loadData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/news/aggregate');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data.jobs);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load aggregation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAggregationJob = async (
    jobType: 'fetch' | 'process' | 'cleanup' | 'full'
  ) => {
    try {
      setRunningJob(jobType);

      const response = await fetch('/api/admin/news/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobType }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Job completed:', result);
        await loadData(); // Refresh data
      } else {
        const error = await response.json();
        console.error('Job failed:', error);
      }
    } catch (error) {
      console.error('Failed to run job:', error);
    } finally {
      setRunningJob(null);
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'fetch':
        return <Download className="w-4 h-4" />;
      case 'process':
        return <RefreshCw className="w-4 h-4" />;
      case 'cleanup':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return '-';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400 mt-1">{t('description')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runAggregationJob('fetch')}
            disabled={runningJob !== null}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {runningJob === 'fetch' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('fetch_news')}
          </button>

          <button
            onClick={() => runAggregationJob('full')}
            disabled={runningJob !== null}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:bg-primary/50 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {runningJob === 'full' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {t('run_full_pipeline')}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">
                {stats.total_jobs}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('total_jobs')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">
                {stats.completed_jobs}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('completed_jobs')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {stats.total_articles_fetched}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('articles_fetched')}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">
                {stats.total_articles_processed}
              </span>
            </div>
            <p className="text-sm text-gray-400">{t('articles_processed')}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {t('quick_actions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => runAggregationJob('process')}
            disabled={runningJob !== null}
            className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {runningJob === 'process' ? (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            ) : (
              <RefreshCw className="w-5 h-5 text-blue-400" />
            )}
            <div className="text-left">
              <div className="font-medium text-white">
                {t('process_articles')}
              </div>
              <div className="text-sm text-gray-400">
                {t('process_description')}
              </div>
            </div>
          </button>

          <button
            onClick={() => runAggregationJob('cleanup')}
            disabled={runningJob !== null}
            className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {runningJob === 'cleanup' ? (
              <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
            ) : (
              <Trash2 className="w-5 h-5 text-red-400" />
            )}
            <div className="text-left">
              <div className="font-medium text-white">{t('cleanup_old')}</div>
              <div className="text-sm text-gray-400">
                {t('cleanup_description')}
              </div>
            </div>
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-green-400" />
            <div className="text-left">
              <div className="font-medium text-white">{t('refresh_data')}</div>
              <div className="text-sm text-gray-400">
                {t('refresh_description')}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Job History */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {t('job_history')}
        </h3>

        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">{t('no_jobs')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('type')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('status')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('started')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('duration')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('results')}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    {t('error')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getJobTypeIcon('fetch')}
                        <span className="text-white capitalize">fetch</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.status)}
                        <span
                          className={`capitalize ${
                            job.status === 'completed'
                              ? 'text-green-400'
                              : job.status === 'failed'
                                ? 'text-red-400'
                                : job.status === 'running'
                                  ? 'text-blue-400'
                                  : 'text-yellow-400'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {job.started_at
                        ? formatDate(job.started_at.toISOString())
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatDuration(
                        job.started_at?.toISOString(),
                        job.completed_at?.toISOString()
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-300">
                        {job.articles_fetched > 0 && (
                          <div>Fetched: {job.articles_fetched}</div>
                        )}
                        {job.articles_processed > 0 && (
                          <div>Processed: {job.articles_processed}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {job.error_message && (
                        <div
                          className="text-sm text-red-400 max-w-xs truncate"
                          title={job.error_message}
                        >
                          {job.error_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
