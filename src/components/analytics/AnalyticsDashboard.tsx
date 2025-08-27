'use client';

import React, { useState, useEffect } from 'react';
import { getWeb3Analytics, type Web3Analytics } from '@/lib/analytics/coinbase';
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Award,
  Activity,
  Globe,
  RefreshCw,
  Target,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
  showWeb3Metrics?: boolean;
  showUserMetrics?: boolean;
  showPerformanceMetrics?: boolean;
}

export default function AnalyticsDashboard({
  className = '',
  showWeb3Metrics = true,
  showUserMetrics = true,
  showPerformanceMetrics = true,
}: AnalyticsDashboardProps) {
  const [web3Analytics, setWeb3Analytics] = useState<Web3Analytics | null>(
    null
  );
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>(
    '7d'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user analytics data
  const [userAnalytics] = useState({
    totalUsers: 1250,
    activeUsers: 890,
    newUsers: 156,
    returningUsers: 734,
    averageSessionDuration: '8m 32s',
    bounceRate: '23%',
    topPages: [
      { page: '/courses', views: 2340, percentage: 28 },
      { page: '/dashboard', views: 1890, percentage: 23 },
      { page: '/community', views: 1456, percentage: 17 },
      { page: '/news', views: 1234, percentage: 15 },
      { page: '/genesis', views: 890, percentage: 11 },
    ],
  });

  // Mock performance metrics
  const [performanceMetrics] = useState({
    averageLoadTime: '1.2s',
    firstContentfulPaint: '0.8s',
    largestContentfulPaint: '1.5s',
    cumulativeLayoutShift: '0.05',
    firstInputDelay: '12ms',
    errorRate: '0.3%',
    uptime: '99.9%',
  });

  const loadWeb3Analytics = async () => {
    if (!showWeb3Metrics) return;

    setIsLoading(true);
    setError(null);

    try {
      const analytics = await getWeb3Analytics(timeframe);
      setWeb3Analytics(analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeb3Analytics();
  }, [timeframe, showWeb3Metrics]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-stakeados-primary" />
          <div>
            <h2 className="text-2xl font-bold text-neon">
              Analytics Dashboard
            </h2>
            <p className="text-stakeados-gray-300">
              Platform insights and metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value as any)}
            className="bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            onClick={loadWeb3Analytics}
            disabled={isLoading}
            className="btn-ghost"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="notification-error">
          <p>Error loading analytics: {error}</p>
        </div>
      )}

      {/* Web3 Metrics */}
      {showWeb3Metrics && web3Analytics && (
        <div className="card-gaming">
          <h3 className="text-xl font-bold text-neon mb-6">Web3 Metrics</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-stakeados-primary" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(web3Analytics.totalTransactions)}
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Total Transactions
              </div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-stakeados-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(web3Analytics.nftsMinted)}
              </div>
              <div className="text-sm text-stakeados-gray-300">NFTs Minted</div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-stakeados-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(web3Analytics.gaslessTransactions)}
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Gasless Transactions
              </div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-stakeados-purple" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(web3Analytics.uniqueUsers)}
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Unique Users
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                Transaction Success Rate
              </h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stakeados-gray-300">Successful:</span>
                <span className="text-stakeados-primary font-semibold">
                  {formatPercentage(
                    web3Analytics.successfulTransactions,
                    web3Analytics.totalTransactions
                  )}
                  %
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${formatPercentage(web3Analytics.successfulTransactions, web3Analytics.totalTransactions)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                Gas Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">
                    Total Gas Used:
                  </span>
                  <span className="text-white">
                    {web3Analytics.totalGasUsed} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">
                    Average Gas Price:
                  </span>
                  <span className="text-white">
                    {web3Analytics.averageGasPrice} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Metrics */}
      {showUserMetrics && (
        <div className="card-gaming">
          <h3 className="text-xl font-bold text-neon mb-6">User Metrics</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-stakeados-primary" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(userAnalytics.totalUsers)}
              </div>
              <div className="text-sm text-stakeados-gray-300">Total Users</div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-stakeados-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(userAnalytics.activeUsers)}
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Active Users
              </div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-stakeados-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(userAnalytics.newUsers)}
              </div>
              <div className="text-sm text-stakeados-gray-300">New Users</div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-stakeados-purple" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {userAnalytics.bounceRate}
              </div>
              <div className="text-sm text-stakeados-gray-300">Bounce Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                Top Pages
              </h4>
              <div className="space-y-3">
                {userAnalytics.topPages.map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-stakeados-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-white">{page.page}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-stakeados-primary font-semibold">
                        {formatNumber(page.views)}
                      </div>
                      <div className="text-xs text-stakeados-gray-400">
                        {page.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                Engagement Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">
                    Avg. Session Duration:
                  </span>
                  <span className="text-white font-semibold">
                    {userAnalytics.averageSessionDuration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">
                    Returning Users:
                  </span>
                  <span className="text-stakeados-blue font-semibold">
                    {formatPercentage(
                      userAnalytics.returningUsers,
                      userAnalytics.totalUsers
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">New Users:</span>
                  <span className="text-stakeados-yellow font-semibold">
                    {formatPercentage(
                      userAnalytics.newUsers,
                      userAnalytics.totalUsers
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="card-gaming">
          <h3 className="text-xl font-bold text-neon mb-6">
            Performance Metrics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-stakeados-primary" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {performanceMetrics.averageLoadTime}
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Avg Load Time
              </div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-stakeados-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {performanceMetrics.firstContentfulPaint}
              </div>
              <div className="text-sm text-stakeados-gray-300">First Paint</div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-stakeados-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {performanceMetrics.uptime}
              </div>
              <div className="text-sm text-stakeados-gray-300">Uptime</div>
            </div>

            <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-stakeados-red" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {performanceMetrics.errorRate}
              </div>
              <div className="text-sm text-stakeados-gray-300">Error Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                Core Web Vitals
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">LCP:</span>
                  <span className="text-stakeados-primary font-semibold">
                    {performanceMetrics.largestContentfulPaint}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">FID:</span>
                  <span className="text-stakeados-blue font-semibold">
                    {performanceMetrics.firstInputDelay}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stakeados-gray-300">CLS:</span>
                  <span className="text-stakeados-yellow font-semibold">
                    {performanceMetrics.cumulativeLayoutShift}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-stakeados-primary mb-3">
                System Health
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300">API Response:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-stakeados-primary rounded-full"></div>
                    <span className="text-stakeados-primary font-semibold">
                      Healthy
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300">Database:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-stakeados-primary rounded-full"></div>
                    <span className="text-stakeados-primary font-semibold">
                      Healthy
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300">
                    Web3 Services:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-stakeados-primary rounded-full"></div>
                    <span className="text-stakeados-primary font-semibold">
                      Healthy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Services Status */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-4">Analytics Services</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-stakeados-primary rounded-full"></div>
              <span className="font-semibold text-white">Google Analytics</span>
            </div>
            <p className="text-sm text-stakeados-gray-300">
              User behavior and conversion tracking
            </p>
          </div>

          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-stakeados-blue rounded-full"></div>
              <span className="font-semibold text-white">Highlight</span>
            </div>
            <p className="text-sm text-stakeados-gray-300">
              Session recording and error monitoring
            </p>
          </div>

          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-stakeados-yellow rounded-full"></div>
              <span className="font-semibold text-white">
                Coinbase Analytics
              </span>
            </div>
            <p className="text-sm text-stakeados-gray-300">
              Web3 transaction and wallet analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
