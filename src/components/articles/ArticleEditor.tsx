'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Eye, Tag, Globe, AlertCircle } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { ContentService } from '@/lib/services/contentService';
import { AIContentService } from '@/lib/services/aiContentService';
import type { Article, ContentCategory, Locale } from '@/types/content';

interface ArticleEditorProps {
  article?: Article;
  proposalId?: string;
  locale: Locale;
  onSave?: (article: Article) => void;
  onPublish?: (article: Article) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface EditorFormData {
  title: { en: string; es: string };
  content: { en: string; es: string };
  meta_description: { en: string; es: string };
  category: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  featured_image?: string;
  related_courses: string[];
  status: 'draft' | 'review';
}

interface ValidationErrors {
  title?: string;
  content?: string;
  meta_description?: string;
  category?: string;
  tags?: string;
  difficulty_level?: string;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  article,
  locale,
  onSave,
  onPublish,
  onError,
  className = '',
}) => {
  const t = useTranslations('editor');

  const [formData, setFormData] = useState<EditorFormData>({
    title: { en: '', es: '' },
    content: { en: '', es: '' },
    meta_description: { en: '', es: '' },
    category: '',
    tags: [],
    difficulty_level: 'beginner',
    featured_image: '',
    related_courses: [],
    status: 'draft',
  });

  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        meta_description: article.meta_description,
        category: article.category,
        tags: article.tags,
        difficulty_level: article.difficulty_level || 'beginner',
        featured_image: article.featured_image_url || '',
        related_courses: article.related_courses || [],
        status: article.status === 'published' ? 'review' : article.status,
      });
    }
  }, [article]);

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData] = await Promise.all([
          ContentService.getCategories(),
        ]);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories and tags:', error);
      }
    };
    loadData();
  }, []);

  // Auto-save functionality
  const handleAutoSave = useCallback(
    async (content: string) => {
      if (!isDirty) return;

      try {
        setSaving(true);
        const updatedFormData = {
          ...formData,
          content: { ...formData.content, [currentLocale]: content },
        };

        if (article?.id) {
          await ContentService.updateArticle({
            id: article.id,
            ...updatedFormData,
          });
        } else {
          // Create new draft
          const newArticle =
            await ContentService.createArticle(updatedFormData);
          if (onSave) onSave(newArticle);
        }

        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        if (onError) onError('Auto-save failed');
      } finally {
        setSaving(false);
      }
    },
    [formData, currentLocale, article?.id, isDirty, onSave, onError]
  );

  // Form validation
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.title[currentLocale].trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content[currentLocale].trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.meta_description[currentLocale].trim()) {
      newErrors.meta_description = 'Meta description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    return newErrors;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof EditorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear related errors
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLocalizedFieldChange = (
    field: 'title' | 'content' | 'meta_description',
    locale: Locale,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
    setIsDirty(true);

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // AI-powered suggestions
  const handleAISuggestions = async () => {
    if (!formData.content[currentLocale].trim()) return;

    try {
      setAiSuggesting(true);

      const aiService = new AIContentService();

      // Generate meta description if empty
      if (!formData.meta_description[currentLocale].trim()) {
        const metaDescription = await aiService.generateMetaDescription(
          formData.title[currentLocale],
          formData.content[currentLocale],
          currentLocale
        );
        handleLocalizedFieldChange(
          'meta_description',
          currentLocale,
          metaDescription
        );
      }

      // Suggest tags
      const suggestedTags = await aiService.suggestTags(
        formData.content[currentLocale]
      );

      // Merge with existing tags
      const newTags = [...new Set([...formData.tags, ...suggestedTags])];
      handleFieldChange('tags', newTags);
    } catch (error) {
      console.error('AI suggestions failed:', error);
      if (onError) onError('Failed to generate AI suggestions');
    } finally {
      setAiSuggesting(false);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const articleData = { ...formData, status: 'draft' as const };

      if (article?.id) {
        const updatedArticle = await ContentService.updateArticle({
          id: article.id,
          ...articleData,
        });
        if (onSave) onSave(updatedArticle);
      } else {
        const newArticle = await ContentService.createArticle(articleData);
        if (onSave) onSave(newArticle);
      }

      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
      if (onError) onError('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const articleData = { ...formData, status: 'review' as const };

      if (article?.id) {
        const updatedArticle = await ContentService.updateArticle({
          id: article.id,
          ...articleData,
        });
        if (onPublish) onPublish(updatedArticle);
      } else {
        const newArticle = await ContentService.createArticle(articleData);
        if (onPublish) onPublish(newArticle);
      }

      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Submit for review failed:', error);
      if (onError) onError('Failed to submit article for review');
    } finally {
      setSaving(false);
    }
  };

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const tagName = input.value.trim();

      if (tagName && !formData.tags.includes(tagName)) {
        handleFieldChange('tags', [...formData.tags, tagName]);
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleFieldChange(
      'tags',
      formData.tags.filter(tag => tag !== tagToRemove)
    );
  };

  const wordCount = formData.content[currentLocale]
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {article ? t('edit_article') : t('new_article')}
          </h1>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1">
              {t('last_saved')}: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCurrentLocale('en')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentLocale === 'en'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setCurrentLocale('es')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentLocale === 'es'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ES
            </button>
          </div>

          {/* Save buttons */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
            {saving ? t('saving') : t('save_draft')}
          </button>

          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Eye size={16} />
            {saving ? t('submitting') : t('submit_for_review')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('title')} ({currentLocale.toUpperCase()})
            </label>
            <input
              type="text"
              value={formData.title[currentLocale]}
              onChange={e =>
                handleLocalizedFieldChange(
                  'title',
                  currentLocale,
                  e.target.value
                )
              }
              placeholder={t('enter_title')}
              className={`w-full px-4 py-3 border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.title}
              </p>
            )}
          </div>

          {/* Content editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('content')} ({currentLocale.toUpperCase()})
            </label>
            <RichTextEditor
              value={formData.content[currentLocale]}
              onChange={value =>
                handleLocalizedFieldChange('content', currentLocale, value)
              }
              locale={currentLocale}
              placeholder={t('start_writing_content')}
              autoSave={true}
              onAutoSave={handleAutoSave}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.content}
              </p>
            )}
          </div>

          {/* Meta description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('meta_description')} ({currentLocale.toUpperCase()})
            </label>
            <textarea
              value={formData.meta_description[currentLocale]}
              onChange={e =>
                handleLocalizedFieldChange(
                  'meta_description',
                  currentLocale,
                  e.target.value
                )
              }
              placeholder={t('enter_meta_description')}
              rows={3}
              maxLength={160}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.meta_description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.meta_description ? (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.meta_description}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">
                  {t('meta_description_help')}
                </p>
              )}
              <span className="text-sm text-gray-500">
                {formData.meta_description[currentLocale].length}/160
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('article_stats')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('words')}:</span>
                <span className="font-medium">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('reading_time')}:</span>
                <span className="font-medium">
                  {readingTime} {t('minutes')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('characters')}:</span>
                <span className="font-medium">
                  {formData.content[currentLocale].length}
                </span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('ai_suggestions')}
            </h3>
            <button
              type="button"
              onClick={handleAISuggestions}
              disabled={aiSuggesting || !formData.content[currentLocale].trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {aiSuggesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Globe size={16} />
                  {t('generate_suggestions')}
                </>
              )}
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('category')}
            </label>
            <select
              value={formData.category}
              onChange={e => handleFieldChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('select_category')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name[currentLocale] || category.name.en}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.category}
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('difficulty_level')}
            </label>
            <select
              value={formData.difficulty_level}
              onChange={e =>
                handleFieldChange(
                  'difficulty_level',
                  e.target.value as 'beginner' | 'intermediate' | 'advanced'
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="beginner">{t('beginner')}</option>
              <option value="intermediate">{t('intermediate')}</option>
              <option value="advanced">{t('advanced')}</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tags')}
            </label>
            <input
              type="text"
              placeholder={t('add_tags_hint')}
              onKeyDown={handleTagInput}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.tags}
              </p>
            )}
          </div>

          {/* Featured image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('featured_image')}
            </label>
            <input
              type="url"
              value={formData.featured_image}
              onChange={e =>
                handleFieldChange('featured_image', e.target.value)
              }
              placeholder={t('image_url_placeholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.featured_image && (
              <div className="mt-2">
                <img
                  src={formData.featured_image}
                  alt="Featured image preview"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
