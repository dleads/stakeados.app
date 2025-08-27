'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DuplicateGroup } from '@/hooks/useTagManager';

interface TagDuplicateManagerProps {
  duplicateGroups: DuplicateGroup[];
  onMergeTags: (sourceTagIds: string[], targetTagId: string) => Promise<void>;
  loading: boolean;
}

export default function TagDuplicateManager({
  duplicateGroups,
  onMergeTags,
  loading,
}: TagDuplicateManagerProps) {
  const t = useTranslations('admin.tags.duplicates');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState<Set<string>>(new Set());

  const handleGroupSelection = (groupId: string, selected: boolean) => {
    const newSelected = new Set(selectedGroups);
    if (selected) {
      newSelected.add(groupId);
    } else {
      newSelected.delete(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    const sourceTagIds = group.tags
      .filter(tag => tag.id !== group.suggestedTarget.id)
      .map(tag => tag.id);

    if (sourceTagIds.length === 0) return;

    setMerging(prev => new Set(prev).add(group.id));

    try {
      await onMergeTags(sourceTagIds, group.suggestedTarget.id);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setMerging(prev => {
        const newMerging = new Set(prev);
        newMerging.delete(group.id);
        return newMerging;
      });
    }
  };

  const handleBulkMerge = async () => {
    const groupsToMerge = duplicateGroups.filter(group =>
      selectedGroups.has(group.id)
    );

    for (const group of groupsToMerge) {
      await handleMergeGroup(group);
    }

    setSelectedGroups(new Set());
  };

  if (loading && duplicateGroups.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">
            {t('scanning')}
          </span>
        </div>
      </div>
    );
  }

  if (duplicateGroups.length === 0) {
    return (
      <div className="p-6 text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('noDuplicates')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('noDuplicatesDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('description', { count: duplicateGroups.length })}
          </p>
        </div>
        {selectedGroups.size > 0 && (
          <button
            onClick={handleBulkMerge}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {t('mergeSelected', { count: selectedGroups.size })}
          </button>
        )}
      </div>

      {/* Warning */}
      <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t('warning.title')}
            </h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              {t('warning.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-6">
        {duplicateGroups.map(group => (
          <div
            key={group.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGroups.has(group.id)}
                  onChange={e =>
                    handleGroupSelection(group.id, e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('group')} #{group.id.split('-')[1]}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('similarity')}: {(group.similarity * 100).toFixed(1)}% •
                    {t('totalUsage')}: {group.totalUsage}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleMergeGroup(group)}
                disabled={merging.has(group.id)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {merging.has(group.id) ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                    {t('merging')}
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-1" />
                    {t('merge')}
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Tags */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t('sourceTags')}
                </h4>
                <div className="space-y-2">
                  {group.tags
                    .filter(tag => tag.id !== group.suggestedTarget.id)
                    .map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {tag.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {tag.usage_count} uses
                          </span>
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Target Tag */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t('targetTag')}
                </h4>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor:
                            group.suggestedTarget.color || '#6B7280',
                        }}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {group.suggestedTarget.name}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {group.suggestedTarget.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.suggestedTarget.usage_count} uses
                      </span>
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                    {t('suggestedBecause')}
                  </p>
                </div>
              </div>
            </div>

            {/* Merge Preview */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <h5 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                {t('mergePreview')}
              </h5>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('mergePreviewDescription', {
                  sourceCount: group.tags.length - 1,
                  targetName: group.suggestedTarget.name,
                  totalUsage: group.totalUsage,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
