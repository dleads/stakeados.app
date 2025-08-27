'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  categoryService,
  type CreateCategoryData,
  type UpdateCategoryData,
  type CategoryStats,
} from '@/lib/services/categoryService';
import type { Database } from '@/types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(
    async (includeInactive: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getCategories(includeInactive);
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load categories'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadStats = useCallback(async () => {
    try {
      const data = await categoryService.getCategoryStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading category stats:', err);
    }
  }, []);

  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category> => {
      const newCategory = await categoryService.createCategory(data);
      setCategories(prev =>
        [...prev, newCategory].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        )
      );
      await loadStats(); // Refresh stats
      return newCategory;
    },
    [loadStats]
  );

  const updateCategory = useCallback(
    async (data: UpdateCategoryData): Promise<Category> => {
      const updatedCategory = await categoryService.updateCategory(data);
      setCategories(prev =>
        prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat))
      );
      await loadStats(); // Refresh stats
      return updatedCategory;
    },
    [loadStats]
  );

  const deleteCategory = useCallback(
    async (id: string, reassignToCategoryId?: string): Promise<void> => {
      await categoryService.deleteCategory(id, reassignToCategoryId);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      await loadStats(); // Refresh stats
    },
    [loadStats]
  );

  const reorderCategories = useCallback(
    async (categoryIds: string[]): Promise<void> => {
      // Update local state immediately for better UX
      const reorderedCategories = categoryIds
        .map((id, index) => {
          const category = categories.find(cat => cat.id === id);
          return category ? { ...category, sort_order: index } : null;
        })
        .filter(Boolean) as Category[];

      setCategories(reorderedCategories);

      try {
        await categoryService.reorderCategories(categoryIds);
      } catch (err) {
        // Revert on error
        await loadCategories();
        throw err;
      }
    },
    [categories, loadCategories]
  );

  const searchCategories = useCallback(
    async (query: string): Promise<Category[]> => {
      return await categoryService.searchCategories(query);
    },
    []
  );

  const getCategoryById = useCallback(
    async (id: string): Promise<Category | null> => {
      return await categoryService.getCategoryById(id);
    },
    []
  );

  const getCategoryStatsById = useCallback(
    async (id: string): Promise<CategoryStats | null> => {
      return await categoryService.getCategoryStatsById(id);
    },
    []
  );

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  return {
    categories,
    stats,
    loading,
    error,
    loadCategories,
    loadStats,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    searchCategories,
    getCategoryById,
    getCategoryStatsById,
  };
}
