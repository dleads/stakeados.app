'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Editor } from '@tinymce/tinymce-react';
import {
  Save,
  Eye,
  EyeOff,
  Upload,
  X,
  Tag,
  Calendar,
  Globe,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Settings,
  Loader2,
} from 'lucide-react';
import {
  adminArticleSchema,
  articleScheduleSchema,
} from '@/lib/schemas/articles';
import { ArticleSchedulingInterface } from './ArticleSchedulingInterface';
import { useArticleScheduling } from '@/hooks/useArticleScheduling';
import type { z } from 'zod';

type AdminArticleData = z.infer<typeof adminArticleSchema>;
type ArticleScheduleData = z.infer<typeof articleScheduleSchema>;

interface AdvancedArticleEditorProps {
  article?: Partial<AdminArticleData> & { id?: string };
  onSave?: (article: AdminArticleData) => Promise<void>;
  onSchedule?: (scheduleData: ArticleScheduleData) => Promise<void>;
  onPublish?: (article: AdminArticleData) => Promise<void>;
  onError?: (error: string) => void;
  className?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Tag {
  id: string;
  name: string;
  usage_count?: number;
}

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

export const AdvancedArticleEditor: React.FC<AdvancedArticleEditorProps> = ({
  article,
  onSave,
  onSchedule,
  onPublish,
  onError,
  className = '',
}) => {
  const t = useTranslations('admin.articles.editor');
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<AdminArticleData>({
    title: '',
    content: '',
    summary: '',
    category_id: '',
    status: 'draft',
    language: 'es',
    seo_title: '',
    seo_description: '',
    featured_image: '',
    tags: [],
    reading_time: 0,
    author_id: '',
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrlInfo, setImageUrlInfo] = useState<{
    valid: boolean;
    warning?: string;
  }>({ valid: true });

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);

  // Scheduling hook
  const { scheduleArticle, loading: schedulingLoading } =
    useArticleScheduling();

  // Initialize form data
  useEffect(() => {
    if (article) {
      setFormData(prev => ({
        ...prev,
        ...article,
        tags: article.tags || [],
      }));
    }
  }, [article]);

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAvailableTags(tagsData.tags || []);
        }
      } catch (error) {
        console.error('Failed to load categories and tags:', error);
      }
    };

    loadData();
  }, []);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!isDirty || !onSave) return;

    try {
      setSaving(true);
      await onSave(formData);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) onError('Auto-save failed');
    } finally {
      setSaving(false);
    }
  }, [formData, isDirty, onSave, onError]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (isDirty) {
      autoSaveTimeoutRef.current = setTimeout(handleAutoSave, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isDirty, handleAutoSave]);

  // Calculate reading time
  useEffect(() => {
    const wordCount = formData.content
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    if (readingTime !== formData.reading_time) {
      setFormData(prev => ({ ...prev, reading_time: readingTime }));
    }
  }, [formData.content]);

  // Handle form field changes
  const handleFieldChange = (field: keyof AdminArticleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Lightweight validation for featured image URL
    if (field === 'featured_image') {
      const url = String(value || '').trim();
      if (!url) {
        setImageUrlInfo({ valid: true, warning: undefined });
        return;
      }
      try {
        const u = new URL(url);
        const isHttps = u.protocol === 'https:';
        const isCloudinary = u.hostname === 'res.cloudinary.com';
        if (!isHttps) {
          setImageUrlInfo({
            valid: false,
            warning: 'La URL debe usar https://',
          });
        } else if (!isCloudinary) {
          setImageUrlInfo({
            valid: true,
            warning:
              'Se recomienda usar Cloudinary (res.cloudinary.com) para mejor rendimiento.',
          });
        } else {
          setImageUrlInfo({ valid: true, warning: undefined });
        }
      } catch {
        setImageUrlInfo({ valid: false, warning: 'URL inválida' });
      }
    }
  };

  // Handle content change from TinyMCE
  const handleContentChange = (content: string) => {
    handleFieldChange('content', content);
  };

  // Validate form
  const validateForm = (): boolean => {
    try {
      adminArticleSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (files: FileList) => {
    const newUploads: ImageUpload[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));

    setImageUploads(prev => [...prev, ...newUploads]);

    // Upload each file
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('type', 'article-image');

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setImageUploads(prev =>
            prev.map(u =>
              u.file === upload.file
                ? { ...u, uploading: false, uploaded: true, url: result.url }
                : u
            )
          );
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setImageUploads(prev =>
          prev.map(u =>
            u.file === upload.file
              ? { ...u, uploading: false, error: 'Upload failed' }
              : u
          )
        );
      }
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  // Handle tag management
  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    const currTags = formData.tags ?? [];
    if (trimmedTag && !currTags.includes(trimmedTag)) {
      handleFieldChange('tags', [...currTags, trimmedTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currTags = formData.tags ?? [];
    handleFieldChange(
      'tags',
      currTags.filter(tag => tag !== tagToRemove)
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Handle save actions
  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const draftData = { ...formData, status: 'draft' as const };
      if (onSave) await onSave(draftData);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
      if (onError) onError('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const reviewData = { ...formData, status: 'review' as const };
      if (onSave) await onSave(reviewData);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Submit for review failed:', error);
      if (onError) onError('Failed to submit for review');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const publishData = {
        ...formData,
        status: 'published' as const,
        published_at: new Date().toISOString(),
      };
      if (onPublish) await onPublish(publishData);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Publish failed:', error);
      if (onError) onError('Failed to publish article');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedulePublish = async (scheduleData: ArticleScheduleData) => {
    if (!validateForm()) return;

    try {
      if (article?.id) {
        const success = await scheduleArticle(article.id, scheduleData);
        if (success) {
          setShowScheduleModal(false);
        }
      } else if (onSchedule) {
        await onSchedule(scheduleData);
        setShowScheduleModal(false);
      }
    } catch (error) {
      console.error('Schedule failed:', error);
      if (onError) onError('Failed to schedule article');
    }
  };

  // TinyMCE configuration
  const editorConfig = {
    height: 500,
    menubar: false,
    plugins: [
      'advlist',
      'autolink',
      'lists',
      'link',
      'image',
      'charmap',
      'preview',
      'anchor',
      'searchreplace',
      'visualblocks',
      'code',
      'fullscreen',
      'insertdatetime',
      'media',
      'table',
      'help',
      'wordcount',
    ],
    toolbar:
      'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style:
      'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    setup: (editor: any) => {
      editor.on('change', () => {
        const content = editor.getContent();
        handleContentChange(content);
      });
    },
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {article?.id ? t('edit_article') : t('new_article')}
          </h1>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock size={14} />
              {t('last_saved')}: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {saving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              {t('saving')}
            </div>
          )}

          {/* Action buttons */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {t('save_draft')}
          </button>

          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            <Eye size={16} />
            {t('submit_review')}
          </button>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
          >
            <Calendar size={16} />
            {t('schedule')}
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Globe size={16} />
            {t('publish_now')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('title')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
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

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('summary')}
            </label>
            <textarea
              value={formData.summary || ''}
              onChange={e => handleFieldChange('summary', e.target.value)}
              placeholder={t('enter_summary')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Content editor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('content')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    showPreview
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPreview ? t('hide_preview') : t('show_preview')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div className={showPreview ? '' : 'lg:col-span-2'}>
                <Editor
                  onInit={(_evt, editor) => (editorRef.current = editor)}
                  value={formData.content}
                  init={editorConfig}
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.content}
                  </p>
                )}
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    {t('preview')}
                  </h3>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEO Panel */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <span className="font-medium">{t('seo_optimization')}</span>
              </div>
              <span
                className={`transform transition-transform ${showSeoPanel ? 'rotate-180' : ''}`}
              >
                ▼
              </span>
            </button>

            {showSeoPanel && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seo_title')}
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title || ''}
                    onChange={e =>
                      handleFieldChange('seo_title', e.target.value)
                    }
                    placeholder={t('seo_title_placeholder')}
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.seo_title || '').length}/60 {t('characters')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seo_description')}
                  </label>
                  <textarea
                    value={formData.seo_description || ''}
                    onChange={e =>
                      handleFieldChange('seo_description', e.target.value)
                    }
                    placeholder={t('seo_description_placeholder')}
                    maxLength={160}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.seo_description || '').length}/160{' '}
                    {t('characters')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('featured_image_url')}
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image || ''}
                    onChange={e =>
                      handleFieldChange('featured_image', e.target.value)
                    }
                    placeholder={t('featured_image_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {/* URL validation feedback */}
                  {imageUrlInfo.warning && (
                    <p
                      className={`mt-1 text-xs ${imageUrlInfo.valid ? 'text-gray-600' : 'text-red-600'}`}
                    >
                      {imageUrlInfo.warning}
                    </p>
                  )}
                  {/* Preview */}
                  {formData.featured_image && imageUrlInfo.valid && (
                    <div className="mt-2">
                      <img
                        src={formData.featured_image}
                        alt="Cover preview"
                        className="w-full max-w-sm h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <span className="font-medium">
                  {
                    formData.content
                      .replace(/<[^>]*>/g, '')
                      .split(/\s+/)
                      .filter(word => word.length > 0).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('reading_time')}:</span>
                <span className="font-medium">
                  {formData.reading_time} {t('minutes')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('status')}:</span>
                <span
                  className={`font-medium capitalize ${
                    formData.status === 'published'
                      ? 'text-green-600'
                      : formData.status === 'review'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('category')}
            </label>
            <select
              value={formData.category_id || ''}
              onChange={e => handleFieldChange('category_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('select_category')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('language')}
            </label>
            <select
              value={formData.language}
              onChange={e =>
                handleFieldChange('language', e.target.value as 'es' | 'en')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tags')}
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder={t('add_tags_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Suggested tags */}
            {tagInput && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {availableTags
                  .filter(
                    tag =>
                      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                      !(formData.tags ?? []).includes(tag.name)
                  )
                  .slice(0, 5)
                  .map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleAddTag(tag.name)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      {tag.name} ({tag.usage_count || 0})
                    </button>
                  ))}
              </div>
            )}

            {/* Selected tags */}
            {(formData.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.tags ?? []).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('images')}
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
            >
              <ImageIcon size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {t('drag_drop_images')}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 mx-auto px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                <Upload size={14} />
                {t('browse_files')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={e =>
                  e.target.files && handleImageUpload(e.target.files)
                }
                className="hidden"
              />
            </div>

            {/* Uploaded images */}
            {imageUploads.length > 0 && (
              <div className="mt-4 space-y-2">
                {imageUploads.map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 border rounded"
                  >
                    <img
                      src={upload.preview}
                      alt="Upload preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {upload.file.name}
                      </p>
                      {upload.uploading && (
                        <p className="text-xs text-gray-500">Uploading...</p>
                      )}
                      {upload.uploaded && (
                        <p className="text-xs text-green-600">Uploaded</p>
                      )}
                      {upload.error && (
                        <p className="text-xs text-red-600">{upload.error}</p>
                      )}
                    </div>
                    {upload.url && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(upload.url!);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy URL
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ArticleSchedulingInterface
          onSchedule={handleSchedulePublish}
          onClose={() => setShowScheduleModal(false)}
          loading={schedulingLoading}
        />
      )}
    </div>
  );
};

export default AdvancedArticleEditor;
