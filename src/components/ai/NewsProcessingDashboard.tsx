'use client';

import React, { useEffect } from 'react';
import { useNewsProcessing } from '@/hooks/useNewsProcessing';
import {
  Bot,
  Rss,
  TrendingUp,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  Globe,
  Clock,
  Target,
} from 'lucide-react';

interface NewsProcessingDashboardProps {
  className?: string;
  showControls?: boolean;
}

export default function NewsProcessingDashboard({
  className = '',
  showControls = true,
}: NewsProcessingDashboardProps) {
  const {
    isProcessing,
    isConfigured,
    connectionStatus,
    error,
    success,
    statistics,
    lastProcessingResult,
    feedHealth,
    testConnection,
    fetchAndProcessFeeds,
    reprocessArticles,
    loadStatistics,
    loadFeedHealth,
    cleanupLowQuality,
    clearMessages,
    getAvailableFeeds,
    canProcess,
  } = useNewsProcessing();

  const availableFeeds = getAvailableFeeds();

  useEffect(() => {
    loadStatistics();
    loadFeedHealth();
    if (isConfigured) {
      testConnection();
    }
  }, [loadStatistics, loadFeedHealth, testConnection, isConfigured]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-stakeados-primary';
      case 'error':
        return 'text-stakeados-red';
      default:
        return 'text-stakeados-gray-400';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-stakeados-blue" />
          <div>
            <h2 className="text-2xl font-bold text-neon">AI News Processing</h2>
            <p className="text-stakeados-gray-300">
              Automated news aggregation and processing
            </p>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={!isConfigured}
              className="btn-ghost"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Connection
            </button>
            <button
              onClick={fetchAndProcessFeeds}
              disabled={!canProcess || isProcessing}
              className="btn-primary"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Fetch & Process
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Configuration Status */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">System Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-stakeados-gray-800 rounded-gaming">
            <Bot
              className={`w-6 h-6 ${isConfigured ? 'text-stakeados-primary' : 'text-stakeados-gray-400'}`}
            />
            <div>
              <div className="font-semibold text-white">OpenAI API</div>
              <div
                className={`text-sm ${isConfigured ? 'text-stakeados-primary' : 'text-stakeados-red'}`}
              >
                {isConfigured ? 'Configured' : 'Not Configured'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className={getConnectionStatusColor()}>
              {getConnectionStatusIcon()}
            </div>
            <div>
              <div className="font-semibold text-white">Connection</div>
              <div className={`text-sm ${getConnectionStatusColor()}`}>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'error'
                    ? 'Error'
                    : 'Unknown'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-stakeados-gray-800 rounded-gaming">
            <Rss
              className={`w-6 h-6 ${feedHealth.length > 0 ? 'text-stakeados-blue' : 'text-stakeados-gray-400'}`}
            />
            <div>
              <div className="font-semibold text-white">RSS Feeds</div>
              <div className="text-sm text-stakeados-blue">
                {feedHealth.filter(f => f.status === 'healthy').length}/
                {feedHealth.length} Healthy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="notification-error">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-red hover:text-stakeados-red/80"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="notification-success">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Globe className="w-6 h-6 text-stakeados-blue" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistics.totalArticles}
          </div>
          <div className="text-sm text-stakeados-gray-300">Total Articles</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Bot className="w-6 h-6 text-stakeados-primary" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistics.processedArticles}
          </div>
          <div className="text-sm text-stakeados-gray-300">AI Processed</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-6 h-6 text-stakeados-yellow" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistics.averageRelevanceScore.toFixed(1)}
          </div>
          <div className="text-sm text-stakeados-gray-300">Avg Relevance</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-stakeados-purple" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistics.processingRate}
          </div>
          <div className="text-sm text-stakeados-gray-300">Last 24h</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Filter className="w-6 h-6 text-stakeados-orange" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistics.topCategories.length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Categories</div>
        </div>
      </div>

      {/* Last Processing Result */}
      {lastProcessingResult && (
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-4">
            Last Processing Result
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-blue">
                {lastProcessingResult.processed}
              </div>
              <div className="text-xs text-stakeados-gray-300">Processed</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-primary">
                {lastProcessingResult.stored}
              </div>
              <div className="text-xs text-stakeados-gray-300">Stored</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-yellow">
                {lastProcessingResult.duplicates}
              </div>
              <div className="text-xs text-stakeados-gray-300">Duplicates</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-orange">
                {lastProcessingResult.lowRelevance}
              </div>
              <div className="text-xs text-stakeados-gray-300">
                Low Relevance
              </div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-red">
                {lastProcessingResult.errors}
              </div>
              <div className="text-xs text-stakeados-gray-300">Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Categories */}
      {statistics.topCategories.length > 0 && (
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-4">Top Categories</h3>

          <div className="space-y-2">
            {statistics.topCategories.slice(0, 8).map(category => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming"
              >
                <span className="text-white font-medium">
                  {category.category}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-stakeados-gray-700 rounded-full h-2">
                    <div
                      className="bg-stakeados-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (category.count / statistics.topCategories[0].count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-stakeados-primary font-semibold w-8 text-right">
                    {category.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSS Feed Health */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">RSS Feed Health</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableFeeds.map(feed => {
            const health = feedHealth.find(h => h.feedName === feed.name);
            const status = health?.status || 'unknown';

            return (
              <div
                key={feed.name}
                className="flex items-center justify-between p-4 bg-stakeados-gray-800 rounded-gaming"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === 'healthy'
                        ? 'bg-stakeados-primary'
                        : status === 'warning'
                          ? 'bg-stakeados-yellow'
                          : status === 'error'
                            ? 'bg-stakeados-red'
                            : 'bg-stakeados-gray-500'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-white">{feed.name}</div>
                    <div className="text-sm text-stakeados-gray-400">
                      Priority: {feed.priority} • Category: {feed.category}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-stakeados-primary">
                    {health?.avgItemsPerFetch || 0} items/fetch
                  </div>
                  <div className="text-xs text-stakeados-gray-400">
                    {health?.errorCount || 0} errors
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      {showControls && canProcess && (
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-4">Control Panel</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => reprocessArticles(10)}
              disabled={isProcessing}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reprocess Articles
            </button>

            <button
              onClick={() => cleanupLowQuality()}
              disabled={isProcessing}
              className="btn-secondary"
            >
              <Filter className="w-4 h-4 mr-2" />
              Cleanup Low Quality
            </button>

            <button onClick={loadStatistics} className="btn-ghost">
              <BarChart3 className="w-4 h-4 mr-2" />
              Refresh Stats
            </button>
          </div>
        </div>
      )}

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="card-gaming border-2 border-stakeados-yellow/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-stakeados-yellow" />
            <h3 className="text-lg font-bold text-stakeados-yellow">
              Configuration Required
            </h3>
          </div>

          <p className="text-stakeados-gray-300 mb-4">
            OpenAI API key is required for news processing. Please configure
            your environment variables.
          </p>

          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <code className="text-stakeados-primary text-sm">
              OPENAI_API_KEY=your_openai_api_key_here
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
