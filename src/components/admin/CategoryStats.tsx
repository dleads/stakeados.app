'use client';

import { useState, useEffect } from 'react';
import { Folder, FileText, Newspaper, Eye, TrendingUp } from 'lucide-react';
import {
  categoryService,
  type CategoryStats,
} from '@/lib/services/categoryService';

export function CategoryStats() {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getCategoryStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading category stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const totalCategories = stats.length;
  const totalArticles = stats.reduce(
    (sum, stat) => sum + stat.article_count,
    0
  );
  const totalNews = stats.reduce((sum, stat) => sum + stat.news_count, 0);
  const totalViews = stats.reduce((sum, stat) => sum + stat.total_views, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-600 rounded mb-2" />
            <div className="h-8 bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
        Error al cargar estadísticas: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Categories */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Categorías</p>
            <p className="text-2xl font-bold text-white">{totalCategories}</p>
          </div>
          <div className="p-2 bg-emerald-600/20 rounded-lg">
            <Folder className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Total Articles */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Artículos</p>
            <p className="text-2xl font-bold text-white">{totalArticles}</p>
          </div>
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Total News */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Noticias</p>
            <p className="text-2xl font-bold text-white">{totalNews}</p>
          </div>
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Newspaper className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Total Views */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Vistas</p>
            <p className="text-2xl font-bold text-white">
              {totalViews.toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-yellow-600/20 rounded-lg">
            <Eye className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
