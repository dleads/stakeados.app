'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Tag } from '@/hooks/useTagManager';

interface TagFormProps {
  tag?: Tag;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#F97316', // Orange
];

export default function TagForm({
  tag,
  onSubmit,
  onCancel,
  loading,
}: TagFormProps) {
  const t = useTranslations('admin.tags');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6B7280',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        color: tag.color || '#6B7280',
      });
      setAutoSlug(false);
    }
  }, [tag]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: autoSlug ? generateSlug(name) : prev.slug,
    }));

    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setAutoSlug(false);
    setFormData(prev => ({ ...prev, slug }));

    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (formData.name.length > 50) {
      newErrors.name = t('validation.nameTooLong');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t('validation.slugRequired');
    } else if (formData.slug.length > 50) {
      newErrors.slug = t('validation.slugTooLong');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('validation.slugInvalid');
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = t('validation.descriptionTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {tag ? t('editTag') : t('createTag')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('form.name')} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.name
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('form.namePlaceholder')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('form.slug')} *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={e => handleSlugChange(e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.slug
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('form.slugPlaceholder')}
              />
            </div>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.slug}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('form.slugHelp')}
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('form.description')}
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.description
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('form.descriptionPlaceholder')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/500
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.color')}
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color
                      ? 'border-gray-900 dark:border-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                placeholder="#6B7280"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading
                ? t('form.saving')
                : tag
                  ? t('form.update')
                  : t('form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
