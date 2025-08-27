'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminArticleSchema } from '@/lib/schemas/articles';
import type { z } from 'zod';

type AdminArticleData = z.infer<typeof adminArticleSchema>;

interface UseAdvancedArticleEditorProps {
  initialArticle?: Partial<AdminArticleData> & { id?: string };
  autoSaveInterval?: number;
  onSave?: (article: AdminArticleData) => Promise<void>;
  onError?: (error: string) => void;
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

export const useAdvancedArticleEditor = ({
  initialArticle,
  autoSaveInterval = 30000,
  onSave,
  onError,
}: UseAdvancedArticleEditorProps) => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

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
    ...initialArticle,
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize form data when initialArticle changes
  useEffect(() => {
    if (initialArticle) {
      setFormData(prev => ({
        ...prev,
        ...initialArticle,
        tags: initialArticle.tags || [],
      }));
    }
  }, [initialArticle]);

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
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
        if (onError) onError('Failed to load editor data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [onError]);

  // Calculate reading time when content changes
  useEffect(() => {
    const wordCount = formData.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    if (readingTime !== formData.reading_time) {
      setFormData(prev => ({ ...prev, reading_time: readingTime }));
    }
  }, [formData.content]);

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

    if (isDirty && autoSaveInterval > 0) {
      autoSaveTimeoutRef.current = setTimeout(handleAutoSave, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isDirty, handleAutoSave, autoSaveInterval]);

  // Handle form field changes
  const handleFieldChange = useCallback(
    (field: keyof AdminArticleData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear related errors
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  // Tag management
  const addTag = useCallback(
    (tagName: string) => {
      const trimmedTag = tagName.trim().toLowerCase();
      if (trimmedTag && !formData.tags.includes(trimmedTag)) {
        handleFieldChange('tags', [...formData.tags, trimmedTag]);
      }
    },
    [formData.tags, handleFieldChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      handleFieldChange(
        'tags',
        formData.tags.filter(tag => tag !== tagToRemove)
      );
    },
    [formData.tags, handleFieldChange]
  );

  // Get suggested tags based on input
  const getSuggestedTags = useCallback(
    (input: string) => {
      return availableTags
        .filter(
          tag =>
            tag.name.toLowerCase().includes(input.toLowerCase()) &&
            !formData.tags.includes(tag.name)
        )
        .slice(0, 5);
    },
    [availableTags, formData.tags]
  );

  // Manual save
  const manualSave = useCallback(async () => {
    if (!validateForm() || !onSave) return false;

    try {
      setSaving(true);
      await onSave(formData);
      setLastSaved(new Date());
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Manual save failed:', error);
      if (onError) onError('Failed to save article');
      return false;
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, onSave, onError]);

  // Get word count
  const getWordCount = useCallback(() => {
    return formData.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }, [formData.content]);

  // Get character count
  const getCharacterCount = useCallback(() => {
    return formData.content.length;
  }, [formData.content]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return isDirty;
  }, [isDirty]);

  return {
    // Form data
    formData,
    setFormData,
    handleFieldChange,

    // Validation
    errors,
    validateForm,

    // State
    saving,
    lastSaved,
    isDirty,
    loadingData,

    // Data
    categories,
    availableTags,

    // Tag management
    addTag,
    removeTag,
    getSuggestedTags,

    // Actions
    manualSave,
    handleAutoSave,

    // Utilities
    getWordCount,
    getCharacterCount,
    hasUnsavedChanges,
  };
};
