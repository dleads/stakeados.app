'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, Hash, Merge, Sparkles } from 'lucide-react';
import { tagService, type TagWithUsage } from '@/lib/services/tagService';
import type { ContentTag } from '@/types/content';
import { TagCard } from './TagCard';
import { TagForm } from './TagForm';
import { TagStats } from './TagStats';
import { TagMergeModal } from './TagMergeModal';

export function TagManager() {
  const t = useTranslations('admin.tags');
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [popularTags, setPopularTags] = useState<TagWithUsage[]>([]);
  const [trendingTags, setTrendingTags] = useState<TagWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<ContentTag | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadTags();
    loadPopularTags();
    loadTrendingTags();
  }, [sortBy]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getTags(undefined, sortBy);
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTags = async () => {
    try {
      const data = await tagService.getPopularTags(10);
      setPopularTags(data);
    } catch (err) {
      console.error('Error loading popular tags:', err);
    }
  };

  const loadTrendingTags = async () => {
    try {
      const data = await tagService.getTrendingTags(10);
      setTrendingTags(data);
    } catch (err) {
      console.error('Error loading trending tags:', err);
    }
  };

  const handleCreateTag = async (data: { id?: string; name: string }) => {
    try {
      const newTag = await tagService.createTag({ name: data.name });
      setTags(prev => [newTag, ...prev]);
      setShowForm(false);
    } catch (err) {
      throw err; // Let the form handle the error
    }
  };

  const handleUpdateTag = async (data: { id?: string; name: string }) => {
    try {
      if (!data.id) throw new Error('Tag ID is required for update');
      const updatedTag = await tagService.updateTag(data.id, {
        name: data.name,
      });
      setTags(prev =>
        prev.map(tag => (tag.id === updatedTag.id ? updatedTag : tag))
      );
      setEditingTag(null);
    } catch (err) {
      throw err; // Let the form handle the error
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await tagService.deleteTag(id);
      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const handleCleanupUnused = async () => {
    if (!confirm(t('cleanupConfirm'))) return;

    try {
      const deletedCount = await tagService.cleanupUnusedTags();
      setError(null);
      alert(t('cleanupSuccess', { count: deletedCount }));
      loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup tags');
    }
  };

  const handleMergeTags = async (sourceId: string, targetId: string) => {
    try {
      await tagService.mergeTags(sourceId, targetId);
      setShowMergeModal(false);
      setSelectedTags([]);
      loadTags();
      loadPopularTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge tags');
    }
  };

  const filteredTags = tags.filter(tag => {
    if (!searchQuery) return true;
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanupUnused}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('cleanup')}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addTag')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <TagStats popularTags={popularTags} trendingTags={trendingTags} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={sortBy}
          onChange={e =>
            setSortBy(e.target.value as 'name' | 'usage' | 'recent')
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="usage">{t('sortByUsage')}</option>
          <option value="name">{t('sortByName')}</option>
          <option value="recent">{t('sortByRecent')}</option>
        </select>
        {selectedTags.length >= 2 && (
          <button
            onClick={() => setShowMergeModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Merge className="w-4 h-4" />
            {t('mergeTags')}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTags.map(tag => (
          <TagCard
            key={tag.id}
            tag={tag}
            selected={selectedTags.includes(tag.id)}
            onSelect={selected => {
              if (selected) {
                setSelectedTags(prev => [...prev, tag.id]);
              } else {
                setSelectedTags(prev => prev.filter(id => id !== tag.id));
              }
            }}
            onEdit={() => setEditingTag(tag)}
            onDelete={() => handleDeleteTag(tag.id)}
          />
        ))}
      </div>

      {filteredTags.length === 0 && !loading && (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">{t('noTags')}</div>
          <p className="text-gray-500">{t('noTagsDescription')}</p>
        </div>
      )}

      {/* Tag Form Modal */}
      {(showForm || editingTag) && (
        <TagForm
          tag={editingTag}
          onSubmit={editingTag ? handleUpdateTag : handleCreateTag}
          onCancel={() => {
            setShowForm(false);
            setEditingTag(null);
          }}
        />
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <TagMergeModal
          selectedTagIds={selectedTags}
          tags={tags}
          onMerge={handleMergeTags}
          onCancel={() => {
            setShowMergeModal(false);
            setSelectedTags([]);
          }}
        />
      )}
    </div>
  );
}
