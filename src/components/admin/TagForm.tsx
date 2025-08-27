'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Hash } from 'lucide-react';
import type { ContentTag } from '@/types/content';

interface TagFormProps {
  tag?: ContentTag | null;
  onSubmit: (data: { id?: string; name: string }) => Promise<void>;
  onCancel: () => void;
}

export function TagForm({ tag, onSubmit, onCancel }: TagFormProps) {
  const t = useTranslations('admin.tags.form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(tag?.name || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!name.trim()) {
        throw new Error(t('nameRequired'));
      }

      const submitData = tag
        ? { id: tag.id, name: name.trim() }
        : { name: name.trim() };

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {tag ? t('editTitle') : t('createTitle')}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('name')} *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('namePlaceholder')}
                required
                maxLength={50}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('nameHelp')}</p>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preview')}
              </label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <Hash className="w-3 h-3" />
                  {name.trim().toLowerCase()}
                </span>
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
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? t('saving') : tag ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
