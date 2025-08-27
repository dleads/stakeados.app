'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Merge, Hash, AlertTriangle } from 'lucide-react';
import type { ContentTag } from '@/types/content';

interface TagMergeModalProps {
  selectedTagIds: string[];
  tags: ContentTag[];
  onMerge: (sourceId: string, targetId: string) => Promise<void>;
  onCancel: () => void;
}

export function TagMergeModal({
  selectedTagIds,
  tags,
  onMerge,
  onCancel,
}: TagMergeModalProps) {
  const t = useTranslations('admin.tags.merge');
  const [targetTagId, setTargetTagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const sourceTag = selectedTags.find(tag => tag.id !== targetTagId);
  const targetTag = selectedTags.find(tag => tag.id === targetTagId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetTagId || !sourceTag) {
      setError(t('selectTargetTag'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onMerge(sourceTag.id, targetTagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mergeError'));
    } finally {
      setLoading(false);
    }
  };

  if (selectedTagIds.length < 2) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Merge className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">{t('warning')}</p>
                <p>{t('warningDescription')}</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Selected Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectedTags')}
            </label>
            <div className="space-y-2">
              {selectedTags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-gray-500">
                    ({tag.usage_count} {t('uses')})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('targetTag')} *
            </label>
            <select
              value={targetTagId}
              onChange={e => setTargetTagId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">{t('selectTargetTag')}</option>
              {selectedTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.usage_count} {t('uses')})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('targetTagHelp')}</p>
          </div>

          {/* Merge Preview */}
          {targetTag && sourceTag && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                {t('mergePreview')}
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('source')}:</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    #{sourceTag.name}
                  </span>
                  <span className="text-xs">
                    ({sourceTag.usage_count} {t('uses')})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('target')}:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    #{targetTag.name}
                  </span>
                  <span className="text-xs">
                    ({targetTag.usage_count + sourceTag.usage_count} {t('uses')}{' '}
                    {t('afterMerge')})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !targetTagId}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('merging') : t('mergeTags')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
