'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface TagBulkOperationsProps {
  selectedCount: number;
  onBulkOperation: (operation: string, data?: any) => Promise<void>;
  onClearSelection: () => void;
}

export default function TagBulkOperations({
  selectedCount,
  onBulkOperation,
  onClearSelection,
}: TagBulkOperationsProps) {
  const t = useTranslations('admin.tags.bulk');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateData, setUpdateData] = useState({
    description: '',
    color: '#6B7280',
  });
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!confirm(t('confirmDelete', { count: selectedCount }))) {
      return;
    }

    setLoading(true);
    try {
      await onBulkOperation('delete');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!updateData.description && !updateData.color) {
      return;
    }

    setLoading(true);
    try {
      const data: any = {};
      if (updateData.description) data.description = updateData.description;
      if (updateData.color) data.color = updateData.color;

      await onBulkOperation('update', data);
      setShowUpdateForm(false);
      setUpdateData({ description: '', color: '#6B7280' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {t('selected', { count: selectedCount })}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUpdateForm(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              {t('update')}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-3 w-3 mr-1" />
              {t('delete')}
            </button>
            <button
              onClick={onClearSelection}
              className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-3 w-3 mr-1" />
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('updateTags', { count: selectedCount })}
              </h3>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('updateDescription')}
              </p>

              {/* Description */}
              <div>
                <label
                  htmlFor="bulk-description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t('form.description')}
                </label>
                <textarea
                  id="bulk-description"
                  rows={3}
                  value={updateData.description}
                  onChange={e =>
                    setUpdateData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('form.descriptionPlaceholder')}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('form.descriptionHelp')}
                </p>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.color')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={updateData.color}
                    onChange={e =>
                      setUpdateData(prev => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={updateData.color}
                    onChange={e =>
                      setUpdateData(prev => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                    placeholder="#6B7280"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('form.colorHelp')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t('form.cancel')}
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={
                    loading || (!updateData.description && !updateData.color)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      {t('form.updating')}
                    </>
                  ) : (
                    t('form.update')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
