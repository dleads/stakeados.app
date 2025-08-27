'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  X,
  Hash,
  BookOpen,
  Newspaper,
  Save,
} from 'lucide-react';
import {
  searchService,
  type AdvancedSearchFilters,
} from '@/lib/services/searchService';
import { categoryService } from '@/lib/services/categoryService';
import { tagService } from '@/lib/services/tagService';
import type {
  ContentCategory,
  ContentTag,
  Locale,
  LocalizedContent,
} from '@/types/content';

interface AdvancedSearchProps {
  initialFilters?: AdvancedSearchFilters;
  onSearch: (filters: AdvancedSearchFilters) => void;
  locale: Locale;
  showSaveSearch?: boolean;
  userId?: string;
}

export function AdvancedSearch({
  initialFilters = {},
  onSearch,
  locale,
  showSaveSearch = false,
  userId,
}: AdvancedSearchProps) {
  const t = useTranslations('search');
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    categories: [],
    tags: [],
    contentType: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc',
    locale,
    limit: 20,
    offset: 0,
    ...initialFilters,
  });

  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      // Convert database categories to ContentCategory format
      const convertedCategories = data.map(cat => ({
        id: cat.id,
        name:
          typeof cat.name === 'string'
            ? { en: cat.name, es: cat.name }
            : (cat.name as LocalizedContent),
        slug: cat.slug,
        description: cat.description
          ? typeof cat.description === 'string'
            ? { en: cat.description, es: cat.description }
            : (cat.description as LocalizedContent)
          : undefined,
        color: cat.color || '#000000',
        icon: cat.icon || undefined,
        order_index: undefined,
        is_active: undefined,
        created_at: cat.created_at || new Date().toISOString(),
      }));
      setCategories(convertedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await tagService.getTags(50, 'usage');
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Add to search history if user is logged in
      if (userId && filters.query) {
        await searchService.addToSearchHistory(userId, filters.query);
      }

      onSearch(filters);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];

    handleFilterChange('categories', newCategories);
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(name => name !== tagName)
      : [...currentTags, tagName];

    handleFilterChange('tags', newTags);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      tags: [],
      contentType: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc',
      locale,
      limit: 20,
      offset: 0,
    });
  };

  const hasActiveFilters = Boolean(
    filters.query ||
      filters.categories?.length ||
      filters.tags?.length ||
      filters.difficulty ||
      filters.author ||
      filters.dateRange ||
      filters.contentType !== 'all'
  );

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.query || ''}
              onChange={e => handleFilterChange('query', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t('searching') : t('search')}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('advancedFilters')}
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('contentType')}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: t('allContent'), icon: BookOpen },
                { value: 'article', label: t('articles'), icon: BookOpen },
                { value: 'news', label: t('news'), icon: Newspaper },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange('contentType', value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    filters.contentType === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('categories')}
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition-colors ${
                    filters.categories?.includes(category.id)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: filters.categories?.includes(category.id)
                      ? category.color
                      : undefined,
                    borderColor: filters.categories?.includes(category.id)
                      ? category.color
                      : undefined,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name[locale]}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tags')}
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tags.slice(0, 20).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.name)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors ${
                    filters.tags?.includes(tag.name)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {tag.name}
                  <span className="text-xs opacity-75">
                    ({tag.usage_count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('difficulty')}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'beginner', label: t('beginner') },
                { value: 'intermediate', label: t('intermediate') },
                { value: 'advanced', label: t('advanced') },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() =>
                    handleFilterChange(
                      'difficulty',
                      filters.difficulty === value ? undefined : value
                    )
                  }
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    filters.difficulty === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dateRange')}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={
                  filters.dateRange?.from?.toISOString().split('T')[0] || ''
                }
                onChange={e => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    from: date,
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="text-gray-500">{t('to')}</span>
              <input
                type="date"
                value={filters.dateRange?.to?.toISOString().split('T')[0] || ''}
                onChange={e => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    to: date,
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sortBy')}
            </label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="relevance">{t('relevance')}</option>
                <option value="date">{t('date')}</option>
                <option value="popularity">{t('popularity')}</option>
                <option value="reading_time">{t('readingTime')}</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={e => handleFilterChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="desc">{t('descending')}</option>
                <option value="asc">{t('ascending')}</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('clearFilters')}
            </button>

            <div className="flex gap-2">
              {showSaveSearch && userId && (
                <button
                  onClick={() => {
                    // TODO: Implement save search modal
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {t('saveSearch')}
                </button>
              )}

              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? t('searching') : t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <Search className="w-3 h-3" />"{filters.query}"
              <button
                onClick={() => handleFilterChange('query', '')}
                className="ml-1 text-primary/60 hover:text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.categories?.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <span
                key={categoryId}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: category.color }}
              >
                {category.name[locale]}
                <button
                  onClick={() => handleCategoryToggle(categoryId)}
                  className="ml-1 text-white/80 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}

          {filters.tags?.map(tagName => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
            >
              <Hash className="w-3 h-3" />
              {tagName}
              <button
                onClick={() => handleTagToggle(tagName)}
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
