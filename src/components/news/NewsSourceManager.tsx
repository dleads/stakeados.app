'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Activity } from 'lucide-react';
import { newsSourceService } from '@/lib/services/newsSourceService';
import type {
  NewsSourceWithHealth,
  NewsSourceFilters,
  NewsSourceStats,
} from '@/types/news';
import { NewsSourceForm } from './NewsSourceForm';
import { NewsSourceCard } from './NewsSourceCard';
import { NewsSourceStats as StatsComponent } from './NewsSourceStats';

export function NewsSourceManager() {
  const t = useTranslations('admin.news_sources');
  const [sources, setSources] = useState<NewsSourceWithHealth[]>([]);
  const [stats, setStats] = useState<NewsSourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] =
    useState<NewsSourceWithHealth | null>(null);
  const [filters, setFilters] = useState<NewsSourceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSources();
    loadStats();
  }, [filters]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await newsSourceService.getNewsSources(filters);
      setSources(data);
    } catch (error) {
      console.error('Failed to load news sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await newsSourceService.getNewsSourceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateSource = () => {
    setEditingSource(null);
    setShowForm(true);
  };

  const handleEditSource = (source: NewsSourceWithHealth) => {
    setEditingSource(source);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSource(null);
    loadSources();
    loadStats();
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm(t('delete_confirmation'))) return;

    try {
      await newsSourceService.deleteNewsSource(sourceId);
      loadSources();
      loadStats();
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const handleToggleActive = async (source: NewsSourceWithHealth) => {
    try {
      await newsSourceService.updateNewsSource(source.id, {
        is_active: !source.is_active,
      });
      loadSources();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle source status:', error);
    }
  };

  const filteredSources = sources.filter(source => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        source.name.toLowerCase().includes(query) ||
        source.description?.toLowerCase().includes(query) ||
        source.url.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400 mt-1">{t('description')}</p>
        </div>
        <button
          onClick={handleCreateSource}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('add_source')}
        </button>
      </div>

      {/* Stats */}
      {stats && <StatsComponent stats={stats} />}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={filters.source_type || ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                source_type: (e.target.value as any) || undefined,
              }))
            }
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('all_types')}</option>
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="scraper">Scraper</option>
          </select>

          <select
            value={filters.is_active?.toString() || ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                is_active:
                  e.target.value === '' ? undefined : e.target.value === 'true',
              }))
            }
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('all_statuses')}</option>
            <option value="true">{t('active')}</option>
            <option value="false">{t('inactive')}</option>
          </select>

          <select
            value={filters.language || ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                language: e.target.value || undefined,
              }))
            }
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('all_languages')}</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery ? t('no_results') : t('no_sources')}
          </h3>
          <p className="text-gray-400 mb-4">
            {searchQuery ? t('try_different_search') : t('add_first_source')}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateSource}
              className="bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('add_source')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map(source => (
            <NewsSourceCard
              key={source.id}
              source={source}
              onEdit={handleEditSource}
              onDelete={handleDeleteSource}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <NewsSourceForm source={editingSource} onClose={handleFormClose} />
      )}
    </div>
  );
}
