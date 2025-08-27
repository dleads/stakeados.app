'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { newsSourceService } from '@/lib/services/newsSourceService';
import type {
  NewsSourceWithHealth,
  NewsSourceCategory,
  CreateNewsSourceRequest,
} from '@/types/news';

interface NewsSourceFormProps {
  source?: NewsSourceWithHealth | null;
  onClose: () => void;
}

export function NewsSourceForm({ source, onClose }: NewsSourceFormProps) {
  const t = useTranslations('admin.news_sources.form');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
  } | null>(null);
  const [categories, setCategories] = useState<NewsSourceCategory[]>([]);

  const [formData, setFormData] = useState<CreateNewsSourceRequest>({
    name: source?.name || '',
    description: source?.description || '',
    url: source?.url || '',
    source_type: source?.source_type || 'rss',
    api_key: source?.api_key || '',
    api_endpoint: source?.api_endpoint || '',
    headers: source?.headers || {},
    categories: source?.categories || [],
    language: source?.language || 'en',
    fetch_interval: source?.fetch_interval || 3600,
    priority: source?.priority || 1,
    quality_score: source?.quality_score || 5.0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await newsSourceService.getNewsSourceCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('name_required');
    }

    if (!formData.url.trim()) {
      newErrors.url = t('url_required');
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = t('invalid_url');
      }
    }

    if (formData.source_type === 'api' && !formData.api_endpoint?.trim()) {
      newErrors.api_endpoint = t('api_endpoint_required');
    }

    if (formData.fetch_interval && formData.fetch_interval < 300) {
      newErrors.fetch_interval = t('fetch_interval_min');
    }

    if (
      formData.priority &&
      (formData.priority < 1 || formData.priority > 10)
    ) {
      newErrors.priority = t('priority_range');
    }

    if (
      formData.quality_score &&
      (formData.quality_score < 1 || formData.quality_score > 10)
    ) {
      newErrors.quality_score = t('quality_score_range');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateSource = async () => {
    if (!formData.url.trim()) {
      setErrors({ url: t('url_required') });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await newsSourceService.validateNewsSource(
        formData.url,
        formData.source_type
      );
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (source) {
        await newsSourceService.updateNewsSource(source.id, formData);
      } else {
        await newsSourceService.createNewsSource(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save news source:', error);
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to save news source',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories?.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...(prev.categories || []), categoryName],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {source ? t('edit_source') : t('add_source')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {t('basic_info')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('name_placeholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('description')}
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('description_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('source_type')} *
              </label>
              <select
                value={formData.source_type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    source_type: e.target.value as 'rss' | 'api' | 'scraper',
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="rss">RSS Feed</option>
                <option value="api">API</option>
                <option value="scraper">Web Scraper</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('url')} *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.url}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, url: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('url_placeholder')}
                />
                <button
                  type="button"
                  onClick={handleValidateSource}
                  disabled={validating || !formData.url.trim()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t('validate')}
                </button>
              </div>
              {errors.url && (
                <p className="mt-1 text-sm text-red-400">{errors.url}</p>
              )}

              {validationResult && (
                <div
                  className={`mt-2 p-3 rounded-lg border ${
                    validationResult.isValid
                      ? 'bg-green-900/20 border-green-800 text-green-300'
                      : 'bg-red-900/20 border-red-800 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {validationResult.isValid
                        ? t('validation_success')
                        : t('validation_failed')}
                    </span>
                  </div>
                  {validationResult.responseTime && (
                    <p className="text-xs mt-1">
                      {t('response_time')}: {validationResult.responseTime}ms
                    </p>
                  )}
                  {validationResult.error && (
                    <p className="text-xs mt-1">{validationResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* API Configuration */}
          {formData.source_type === 'api' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">
                {t('api_config')}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('api_endpoint')} *
                </label>
                <input
                  type="url"
                  value={formData.api_endpoint}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      api_endpoint: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('api_endpoint_placeholder')}
                />
                {errors.api_endpoint && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.api_endpoint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('api_key')}
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, api_key: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('api_key_placeholder')}
                />
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {t('categories')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.categories?.includes(category.name) || false
                    }
                    onChange={() => handleCategoryToggle(category.name)}
                    className="rounded border-gray-500 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-white">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">{t('settings')}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('language')}
                </label>
                <select
                  value={formData.language}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, language: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fetch_interval')} ({t('seconds')})
                </label>
                <input
                  type="number"
                  min="300"
                  value={formData.fetch_interval}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      fetch_interval: parseInt(e.target.value) || 3600,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.fetch_interval && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.fetch_interval}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('priority')} (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priority: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-400">{errors.priority}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('quality_score')} (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.quality_score}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      quality_score: parseFloat(e.target.value) || 5.0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.quality_score && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.quality_score}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary hover:bg-primary/80 disabled:bg-primary/50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {source ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
