'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TagIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useTagManager, TagFilters } from '@/hooks/useTagManager';
import TagList from './TagList';
import TagForm from './TagForm';
import TagStatistics from './TagStatistics';
import TagDuplicateManager from './TagDuplicateManager';
import TagBulkOperations from './TagBulkOperations';

type ViewMode = 'list' | 'grid' | 'statistics' | 'duplicates';

export default function TagManager() {
  const t = useTranslations('admin.tags');
  const {
    tags,
    statistics,
    duplicateGroups,
    loading,
    error,
    pagination,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchDuplicates,
    mergeTags,
    bulkOperation,
    loadMore,
    clearError,
  } = useTagManager();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<TagFilters>({
    sortBy: 'usage_count',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Handle search
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      const newFilters = { ...filters, search: term || undefined };
      setFilters(newFilters);
      fetchTags(newFilters, 0, pagination.limit);
    },
    [filters, fetchTags, pagination.limit]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<TagFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      fetchTags(updatedFilters, 0, pagination.limit);
    },
    [filters, fetchTags, pagination.limit]
  );

  // Handle tag selection for bulk operations
  const handleTagSelection = useCallback((tagId: string, selected: boolean) => {
    setSelectedTags(prev =>
      selected ? [...prev, tagId] : prev.filter(id => id !== tagId)
    );
  }, []);

  // Handle select all/none
  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      setSelectedTags(selectAll ? tags.map(tag => tag.id) : []);
    },
    [tags]
  );

  // Handle tag creation
  const handleCreateTag = useCallback(
    async (tagData: any) => {
      try {
        await createTag(tagData);
        setShowCreateForm(false);
        // Refresh the list
        fetchTags(filters, 0, pagination.limit);
      } catch (error) {
        // Error is handled by the hook
      }
    },
    [createTag, fetchTags, filters, pagination.limit]
  );

  // Handle tag update
  const handleUpdateTag = useCallback(
    async (tagId: string, updates: any) => {
      try {
        await updateTag(tagId, updates);
        // Refresh the list
        fetchTags(filters, 0, pagination.limit);
      } catch (error) {
        // Error is handled by the hook
      }
    },
    [updateTag, fetchTags, filters, pagination.limit]
  );

  // Handle tag deletion
  const handleDeleteTag = useCallback(
    async (tagId: string) => {
      if (confirm(t('confirmDelete'))) {
        try {
          await deleteTag(tagId);
          setSelectedTags(prev => prev.filter(id => id !== tagId));
        } catch (error) {
          // Error is handled by the hook
        }
      }
    },
    [deleteTag, t]
  );

  // Handle duplicate detection
  const handleFindDuplicates = useCallback(async () => {
    setViewMode('duplicates');
    await fetchDuplicates(0.8, 0);
  }, [fetchDuplicates]);

  // Handle tag merge
  const handleMergeTags = useCallback(
    async (sourceTagIds: string[], targetTagId: string) => {
      try {
        await mergeTags(sourceTagIds, targetTagId, true);
        // Refresh duplicates
        await fetchDuplicates(0.8, 0);
        // Refresh main list
        fetchTags(filters, 0, pagination.limit);
      } catch (error) {
        // Error is handled by the hook
      }
    },
    [mergeTags, fetchDuplicates, fetchTags, filters, pagination.limit]
  );

  // Handle bulk operations
  const handleBulkOperation = useCallback(
    async (operation: string, data?: any) => {
      if (selectedTags.length === 0) return;

      try {
        await bulkOperation(operation as any, selectedTags, data);
        setSelectedTags([]);
        // Refresh the list
        fetchTags(filters, 0, pagination.limit);
      } catch (error) {
        // Error is handled by the hook
      }
    },
    [bulkOperation, selectedTags, fetchTags, filters, pagination.limit]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <TagIcon className="h-8 w-8 mr-3 text-blue-600" />
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('createTag')}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('error')}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-3">
                <button
                  onClick={clearError}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100"
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'list'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                viewMode === 'grid'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('statistics')}
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                viewMode === 'statistics'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ChartBarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleFindDuplicates}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
                viewMode === 'duplicates'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {(viewMode === 'list' || viewMode === 'grid') && (
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => {
                /* TODO: Open filter modal */
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {t('filters')}
            </button>
          </div>
        )}
      </div>

      {/* Bulk Operations */}
      {selectedTags.length > 0 &&
        (viewMode === 'list' || viewMode === 'grid') && (
          <TagBulkOperations
            selectedCount={selectedTags.length}
            onBulkOperation={handleBulkOperation}
            onClearSelection={() => setSelectedTags([])}
          />
        )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {viewMode === 'statistics' && <TagStatistics statistics={statistics} />}

        {viewMode === 'duplicates' && (
          <TagDuplicateManager
            duplicateGroups={duplicateGroups}
            onMergeTags={handleMergeTags}
            loading={loading}
          />
        )}

        {(viewMode === 'list' || viewMode === 'grid') && (
          <TagList
            tags={tags}
            viewMode={viewMode}
            selectedTags={selectedTags}
            onTagSelection={handleTagSelection}
            onSelectAll={handleSelectAll}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
            loading={loading}
            pagination={pagination}
            onLoadMore={() => loadMore(filters)}
          />
        )}
      </div>

      {/* Create Tag Modal */}
      {showCreateForm && (
        <TagForm
          onSubmit={handleCreateTag}
          onCancel={() => setShowCreateForm(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
