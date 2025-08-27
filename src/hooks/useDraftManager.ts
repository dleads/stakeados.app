'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ContentService } from '@/lib/services/contentService';
import type { Article, Locale } from '@/types/content';

interface DraftState {
  id?: string;
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

interface UseDraftManagerOptions {
  articleId?: string;
  autoSaveInterval?: number;
  enableAutoSave?: boolean;
  onSave?: (article: Article) => void;
  onError?: (error: string) => void;
}

interface UseDraftManagerReturn {
  draft: DraftState;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  updateDraft: (updates: Partial<DraftState>) => void;
  updateLocalizedField: (
    field: 'title' | 'content' | 'meta_description',
    locale: Locale,
    value: string
  ) => void;
  saveDraft: () => Promise<Article | null>;
  loadDraft: (articleId: string) => Promise<void>;
  resetDraft: () => void;
  createVersion: (changeSummary?: string) => Promise<void>;
  getWordCount: (locale: Locale) => number;
  getReadingTime: (locale: Locale) => number;
  validateDraft: () => { isValid: boolean; errors: Record<string, string> };
}

const INITIAL_DRAFT_STATE: DraftState = {
  title: { en: '', es: '' },
  content: { en: '', es: '' },
  meta_description: { en: '', es: '' },
  category: '',
  tags: [],
  difficulty_level: 'beginner',
  featured_image: '',
  related_courses: [],
  status: 'draft',
};

export const useDraftManager = ({
  articleId,
  autoSaveInterval = 30000, // 30 seconds
  enableAutoSave = true,
  onSave,
  onError,
}: UseDraftManagerOptions = {}): UseDraftManagerReturn => {
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT_STATE);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDraftRef = useRef<string>('');

  // Load existing draft
  const loadDraft = useCallback(
    async (id: string) => {
      try {
        const article = await ContentService.getArticleById(id);
        if (article) {
          const draftState: DraftState = {
            id: article.id,
            title: article.title,
            content: article.content,
            meta_description: article.meta_description,
            category: article.category,
            tags: article.tags,
            difficulty_level: article.difficulty_level || 'beginner',
            featured_image: article.featured_image_url || '',
            related_courses: article.related_courses || [],
            status: article.status === 'published' ? 'review' : article.status,
          };

          setDraft(draftState);
          setLastSaved(new Date(article.updated_at));
          setIsDirty(false);

          // Store reference for comparison
          lastSavedDraftRef.current = JSON.stringify(draftState);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        if (onError) onError('Failed to load draft');
      }
    },
    [onError]
  );

  // Initialize draft if articleId is provided
  useEffect(() => {
    if (articleId) {
      loadDraft(articleId);
    }
  }, [articleId, loadDraft]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !isDirty || isSaving) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveDraft();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isDirty, isSaving, enableAutoSave, autoSaveInterval]);

  // Update draft state
  const updateDraft = useCallback((updates: Partial<DraftState>) => {
    setDraft(prev => {
      const newDraft = { ...prev, ...updates };
      const newDraftString = JSON.stringify(newDraft);

      // Check if actually changed
      if (newDraftString !== lastSavedDraftRef.current) {
        setIsDirty(true);
      }

      return newDraft;
    });
  }, []);

  // Update localized fields
  const updateLocalizedField = useCallback(
    (
      field: 'title' | 'content' | 'meta_description',
      locale: Locale,
      value: string
    ) => {
      updateDraft({
        [field]: {
          ...draft[field],
          [locale]: value,
        },
      });
    },
    [draft, updateDraft]
  );

  // Save draft
  const saveDraft = useCallback(async (): Promise<Article | null> => {
    if (!isDirty && draft.id) return null;

    try {
      setIsSaving(true);

      const articleData = {
        title: draft.title,
        content: draft.content,
        meta_description: draft.meta_description,
        category: draft.category,
        tags: draft.tags,
        difficulty_level: draft.difficulty_level,
        featured_image_url: draft.featured_image,
        related_courses: draft.related_courses,
        status: draft.status,
      };

      let savedArticle: Article;

      if (draft.id) {
        // Update existing draft
        savedArticle = await ContentService.updateArticle({
          id: draft.id,
          ...articleData,
        });
      } else {
        // Create new draft
        savedArticle = await ContentService.createArticle(articleData);
        setDraft(prev => ({ ...prev, id: savedArticle.id }));
      }

      setLastSaved(new Date());
      setIsDirty(false);
      lastSavedDraftRef.current = JSON.stringify(draft);

      if (onSave) onSave(savedArticle);

      return savedArticle;
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (onError) onError('Failed to save draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [draft, isDirty, onSave, onError]);

  // Reset draft to initial state
  const resetDraft = useCallback(() => {
    setDraft(INITIAL_DRAFT_STATE);
    setIsDirty(false);
    setLastSaved(null);
    lastSavedDraftRef.current = '';
  }, []);

  // Create version (for version history)
  const createVersion = useCallback(
    async (_changeSummary?: string) => {
      if (!draft.id) {
        throw new Error('Cannot create version for unsaved draft');
      }

      try {
        // In a real implementation, this would create a version record
        // For now, we'll just save the current state
        await saveDraft();

        // Here you would typically call an API to create a version record
        // await ContentService.createVersion(draft.id, changeSummary)
      } catch (error) {
        console.error('Failed to create version:', error);
        throw error;
      }
    },
    [draft.id, saveDraft]
  );

  // Get word count for a specific locale
  const getWordCount = useCallback(
    (locale: Locale): number => {
      return draft.content[locale].split(/\s+/).filter(word => word.length > 0)
        .length;
    },
    [draft.content]
  );

  // Get reading time for a specific locale
  const getReadingTime = useCallback(
    (locale: Locale): number => {
      const wordCount = getWordCount(locale);
      return Math.max(1, Math.ceil(wordCount / 200));
    },
    [getWordCount]
  );

  // Validate draft
  const validateDraft = useCallback((): {
    isValid: boolean;
    errors: Record<string, string>;
  } => {
    const errors: Record<string, string> = {};

    // Check required fields for at least one locale
    const hasEnglishTitle = draft.title.en.trim().length > 0;
    const hasSpanishTitle = draft.title.es.trim().length > 0;
    if (!hasEnglishTitle && !hasSpanishTitle) {
      errors.title = 'Title is required in at least one language';
    }

    const hasEnglishContent = draft.content.en.trim().length > 0;
    const hasSpanishContent = draft.content.es.trim().length > 0;
    if (!hasEnglishContent && !hasSpanishContent) {
      errors.content = 'Content is required in at least one language';
    }

    if (!draft.category) {
      errors.category = 'Category is required';
    }

    if (draft.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    }

    // Validate meta descriptions if content exists
    if (hasEnglishContent && !draft.meta_description.en.trim()) {
      errors.meta_description_en =
        'English meta description is required when English content exists';
    }

    if (hasSpanishContent && !draft.meta_description.es.trim()) {
      errors.meta_description_es =
        'Spanish meta description is required when Spanish content exists';
    }

    // Validate meta description length
    if (draft.meta_description.en.length > 160) {
      errors.meta_description_en_length =
        'English meta description must be 160 characters or less';
    }

    if (draft.meta_description.es.length > 160) {
      errors.meta_description_es_length =
        'Spanish meta description must be 160 characters or less';
    }

    // Validate minimum content length
    const minWordCount = 100;
    if (hasEnglishContent && getWordCount('en') < minWordCount) {
      errors.content_en_length = `English content must be at least ${minWordCount} words`;
    }

    if (hasSpanishContent && getWordCount('es') < minWordCount) {
      errors.content_es_length = `Spanish content must be at least ${minWordCount} words`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [draft, getWordCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    isDirty,
    isSaving,
    lastSaved,
    updateDraft,
    updateLocalizedField,
    saveDraft,
    loadDraft,
    resetDraft,
    createVersion,
    getWordCount,
    getReadingTime,
    validateDraft,
  };
};

export default useDraftManager;
