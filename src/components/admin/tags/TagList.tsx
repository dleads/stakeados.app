'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  PencilIcon,
  TrashIcon,
  TagIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Tag } from '@/hooks/useTagManager';
import TagForm from './TagForm';

interface TagListProps {
  tags: Tag[];
  viewMode: 'list' | 'grid';
  selectedTags: string[];
  onTagSelection: (tagId: string, selected: boolean) => void;
  onSelectAll: (selectAll: boolean) => void;
  onUpdateTag: (tagId: string, updates: any) => void;
  onDeleteTag: (tagId: string) => void;
  loading: boolean;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onLoadMore: () => void;
}

export default function TagList({
  tags,
  viewMode,
  selectedTags,
  onTagSelection,
  onSelectAll,
  onUpdateTag,
  onDeleteTag,
  loading,
  pagination,
  onLoadMore,
}: TagListProps) {
  const t = useTranslations('admin.tags');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const allSelected = tags.length > 0 && selectedTags.length === tags.length;
  const someSelected =
    selectedTags.length > 0 && selectedTags.length < tags.length;

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleUpdateTag = async (updates: any) => {
    if (editingTag) {
      await onUpdateTag(editingTag.id, updates);
      setEditingTag(null);
    }
  };

  if (loading && tags.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="p-6 text-center">
        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('noTags')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('noTagsDescription')}
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="p-6">
        {/* Grid Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={e => onSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              {selectedTags.length > 0
                ? t('selectedCount', { count: selectedTags.length })
                : t('selectAll')}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('totalTags', { count: pagination.total })}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map(tag => (
            <div
              key={tag.id}
              className={`relative bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow ${
                selectedTags.includes(tag.id)
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={e => onTagSelection(tag.id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditTag(tag)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    disabled={tag.usage_count > 0}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tag.name}
                  </h3>
                </div>
                {tag.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {tag.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tag.slug}
                  </span>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <ChartBarIcon className="h-3 w-3 mr-1" />
                    {tag.usage_count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {pagination.hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? t('loading') : t('loadMore')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="overflow-hidden">
      {/* List Header */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={e => onSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-6 grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">{t('name')}</div>
            <div className="col-span-2">{t('slug')}</div>
            <div className="col-span-3">{t('description')}</div>
            <div className="col-span-1">{t('usage')}</div>
            <div className="col-span-1">{t('created')}</div>
            <div className="col-span-1">{t('actions')}</div>
          </div>
        </div>
      </div>

      {/* List Items */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tags.map(tag => (
          <div
            key={tag.id}
            className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              selectedTags.includes(tag.id)
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={e => onTagSelection(tag.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-6 grid grid-cols-12 gap-4 w-full">
                <div className="col-span-4 flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tag.name}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {tag.slug}
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {tag.description || '-'}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">
                    {tag.usage_count}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tag.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTag(tag)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTag(tag.id)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={tag.usage_count > 0}
                      title={
                        tag.usage_count > 0
                          ? t('cannotDeleteInUse')
                          : t('deleteTag')
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {pagination.hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <TagForm
          tag={editingTag}
          onSubmit={handleUpdateTag}
          onCancel={() => setEditingTag(null)}
          loading={loading}
        />
      )}
    </div>
  );
}
