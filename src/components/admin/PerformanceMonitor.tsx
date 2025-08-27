'use client';

import { useState, useEffect } from 'react';
import { queryOptimizer } from '@/lib/database/queryOptimizer';
import { contentCache } from '@/lib/cache/contentCache';

interface QueryStats {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  rows: number;
}

interface TableStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

interface IndexStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idxTupRead: number;
  idxTupFetch: number;
  idxScan: number;
  usageLevel: string;
}

export default function PerformanceMonitor() {
  const [queryStats, setQueryStats] = useState<QueryStats[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [indexStats, setIndexStats] = useState<IndexStats[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'queries' | 'tables' | 'indexes' | 'cache'
  >('queries');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const [queries, tables, indexes, cache] = await Promise.all([
        queryOptimizer.getQueryPerformanceStats(),
        queryOptimizer.getTableStats(),
        queryOptimizer.getIndexUsageStats(),
        contentCache.getCacheStats(),
      ]);

      setQueryStats(queries);
      setTableStats(tables);
      setIndexStats(indexes);
      setCacheStats(cache);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMaterializedViews = async () => {
    try {
      await queryOptimizer.refreshMaterializedViews();
      alert('Materialized views refreshed successfully');
    } catch (error) {
      alert('Failed to refresh materialized views');
    }
  };

  const updateViewCounts = async () => {
    try {
      await queryOptimizer.updateArticleViewCounts();
      alert('Article view counts updated successfully');
    } catch (error) {
      alert('Failed to update view counts');
    }
  };

  const clearCache = async () => {
    try {
      await contentCache.clearAllCache();
      alert('Cache cleared successfully');
      loadPerformanceData();
    } catch (error) {
      alert('Failed to clear cache');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={refreshMaterializedViews}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Views
          </button>
          <button
            onClick={updateViewCounts}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Update Counts
          </button>
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear Cache
          </button>
          <button
            onClick={loadPerformanceData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'queries', label: 'Query Performance' },
            { key: 'tables', label: 'Table Statistics' },
            { key: 'indexes', label: 'Index Usage' },
            { key: 'cache', label: 'Cache Statistics' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Query Performance Tab */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Slow Queries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Time (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mean Time (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rows
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queryStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {stat.query}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.calls.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.totalTime.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stat.meanTime > 1000
                            ? 'bg-red-100 text-red-800'
                            : stat.meanTime > 500
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {stat.meanTime.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.rows.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table Statistics Tab */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Table Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.tableName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.rowCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.tableSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.indexSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.totalSize}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Index Usage Tab */}
      {activeTab === 'indexes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Index Usage Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tuples Read
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {indexStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.tablename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.indexname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.idxScan.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.idxTupRead.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stat.usageLevel === 'High Usage'
                            ? 'bg-green-100 text-green-800'
                            : stat.usageLevel === 'Medium Usage'
                              ? 'bg-yellow-100 text-yellow-800'
                              : stat.usageLevel === 'Low Usage'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {stat.usageLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cache Statistics Tab */}
      {activeTab === 'cache' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cache Statistics</h3>
          {cacheStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-900">
                  Connection Status
                </h4>
                <p
                  className={`text-2xl font-bold ${cacheStats.connected ? 'text-green-600' : 'text-red-600'}`}
                >
                  {cacheStats.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-900">
                  Memory Usage
                </h4>
                <div className="mt-2 text-sm text-gray-600">
                  <pre className="whitespace-pre-wrap">{cacheStats.memory}</pre>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-900">
                  Keyspace Info
                </h4>
                <div className="mt-2 text-sm text-gray-600">
                  <pre className="whitespace-pre-wrap">
                    {cacheStats.keyspace}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Cache statistics not available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
