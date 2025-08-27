'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';
import {
  Tag,
  FolderOpen,
  Plus,
  X,
  Check,
  Eye,
  Save,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  parent_id?: string;
  article_count: number;
  news_count: number;
}

interface NewsItem {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  source_name: string;
  processed: boolean;
  trending_score: number;
  created_at: string;
  category?: Category;
  language: 'es' | 'en';
  tags?: string[];
  image_url?: string;
  ai_metadata?: {
    keywords?: string[];
    relevance_score?: number;
    suggested_categories?: string[];
    suggested_tags?: string[];
  };
}

interface NewsCategorizationInterfaceProps {
  newsItems: NewsItem[];
  categories: Category[];
  onCategorizeNews?: (newsId: string, categoryId: string) => Promise<void>;
  onTagNews?: (newsId: string, tags: string[]) => Promise<void>;
  onApproveNews?: (newsId: string) => Promise<void>;
  onRejectNews?: (newsId: string, reason: string) => Promise<void>;
  onUpdateImageUrl?: (newsId: string, imageUrl: string) => Promise<void>;
  className?: string;
}

export default function NewsCategorizationInterface({
  newsItems,
  categories,
  onCategorizeNews,
  onTagNews,
  onApproveNews,
  onRejectNews,
  onUpdateImageUrl,
  className,
}: NewsCategorizationInterfaceProps) {
  const t = useTranslations('admin.news.categorization');
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterProcessed, setFilterProcessed] = useState<boolean | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [editingTags, setEditingTags] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [newTag, setNewTag] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState<{
    [key: string]: string;
  }>({});
  const [imageUrlError, setImageUrlError] = useState<{
    [key: string]: string | null;
  }>({});

  const validateImageUrl = (
    url?: string
  ): { valid: boolean; warning?: string; error?: string } => {
    if (!url || url.trim() === '') return { valid: false, error: 'URL vacía' };
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:')
        return { valid: false, error: 'La URL debe usar https' };
      if (u.hostname !== 'res.cloudinary.com') {
        return {
          valid: true,
          warning: 'Dominio no recomendado (ideal: res.cloudinary.com)',
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'URL inválida' };
    }
  };

  const handleImageUrlChange = (newsId: string, value: string) => {
    setEditingImageUrl(prev => ({ ...prev, [newsId]: value }));
    const res = validateImageUrl(value);
    setImageUrlError(prev => ({ ...prev, [newsId]: res.error || null }));
  };

  const handleSaveImageUrl = async (newsId: string) => {
    if (!onUpdateImageUrl) return;
    const value = editingImageUrl[newsId];
    const res = validateImageUrl(value);
    if (!res.valid) {
      setImageUrlError(prev => ({
        ...prev,
        [newsId]: res.error || 'URL inválida',
      }));
      return;
    }
    try {
      await onUpdateImageUrl(newsId, value);
    } catch (e) {
      console.error('Error updating image URL:', e);
    }
  };

  // Filter news items based on search and filters
  const filteredNews = newsItems.filter(item => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !filterCategory || item.category?.id === filterCategory;
    const matchesProcessed =
      filterProcessed === null || item.processed === filterProcessed;

    return matchesSearch && matchesCategory && matchesProcessed;
  });

  // Group categories by parent
  const categoriesByParent = categories.reduce(
    (acc, category) => {
      const parentId = category.parent_id || 'root';
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(category);
      return acc;
    },
    {} as { [key: string]: Category[] }
  );

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorizeNews = async (newsId: string, categoryId: string) => {
    if (onCategorizeNews) {
      try {
        await onCategorizeNews(newsId, categoryId);
      } catch (error) {
        console.error('Error categorizing news:', error);
      }
    }
  };

  const handleAddTag = (newsId: string, tag: string) => {
    if (!tag.trim()) return;

    const currentTags = editingTags[newsId] || [];
    if (!currentTags.includes(tag.trim())) {
      setEditingTags(prev => ({
        ...prev,
        [newsId]: [...currentTags, tag.trim()],
      }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (newsId: string, tagToRemove: string) => {
    setEditingTags(prev => ({
      ...prev,
      [newsId]: (prev[newsId] || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSaveTags = async (newsId: string) => {
    if (onTagNews) {
      try {
        const tags = editingTags[newsId] || [];
        await onTagNews(newsId, tags);
        setEditingTags(prev => {
          const newState = { ...prev };
          delete newState[newsId];
          return newState;
        });
      } catch (error) {
        console.error('Error saving tags:', error);
      }
    }
  };

  const renderCategoryTree = (parentId: string = 'root', level: number = 0) => {
    const children = categoriesByParent[parentId] || [];

    return children.map(category => {
      const hasChildren = categoriesByParent[category.id]?.length > 0;
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id} className={cn('', level > 0 && 'ml-4')}>
          <div className="flex items-center gap-2 p-2 hover:bg-stakeados-gray-700 rounded-gaming transition-colors">
            {hasChildren && (
              <button
                onClick={() => toggleCategoryExpansion(category.id)}
                className="p-1 text-stakeados-gray-400 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />

            <span className="text-white text-sm flex-1">{category.name}</span>

            <div className="flex items-center gap-2 text-xs text-stakeados-gray-400">
              <span>{category.news_count}</span>
              <FolderOpen className="w-3 h-3" />
            </div>
          </div>

          {hasChildren &&
            isExpanded &&
            renderCategoryTree(category.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-4 gap-6', className)}>
      {/* Categories Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-stakeados-primary" />
            {t('categories.title')}
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => setFilterCategory('')}
              className={cn(
                'w-full text-left p-2 rounded-gaming transition-colors',
                !filterCategory
                  ? 'bg-stakeados-primary/20 text-stakeados-primary'
                  : 'text-stakeados-gray-300 hover:bg-stakeados-gray-700'
              )}
            >
              {t('categories.all')}
            </button>
            {renderCategoryTree()}
          </div>
        </div>
      </div>

      {/* News Items */}
      <div className="lg:col-span-3">
        {/* Filters */}
        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stakeados-gray-400" />
                <input
                  type="text"
                  placeholder={t('filters.search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
              >
                <option value="">{t('filters.allCategories')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={
                  filterProcessed === null ? '' : filterProcessed.toString()
                }
                onChange={e =>
                  setFilterProcessed(
                    e.target.value === '' ? null : e.target.value === 'true'
                  )
                }
                className="px-3 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
              >
                <option value="">{t('filters.allStatus')}</option>
                <option value="true">{t('filters.processed')}</option>
                <option value="false">{t('filters.unprocessed')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="space-y-4">
          {filteredNews.map(item => (
            <div
              key={item.id}
              className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full mt-2 flex-shrink-0',
                    item.processed ? 'bg-green-500' : 'bg-yellow-500'
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium line-clamp-2 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-stakeados-gray-400 text-sm">
                        {item.source_name} •{' '}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          item.language === 'es'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                        )}
                      >
                        {item.language.toUpperCase()}
                      </span>

                      {item.trending_score > 50 && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                          Trending {item.trending_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cover Image URL */}
                  <div className="mb-4">
                    <p className="text-stakeados-gray-400 text-sm mb-2">
                      Imagen de portada (URL)
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://res.cloudinary.com/..."
                        value={editingImageUrl[item.id] ?? item.image_url ?? ''}
                        onChange={e =>
                          handleImageUrlChange(item.id, e.target.value)
                        }
                        className="flex-1 px-3 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                      />
                      {onUpdateImageUrl && (
                        <button
                          onClick={() => handleSaveImageUrl(item.id)}
                          className="px-3 py-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors"
                        >
                          Guardar
                        </button>
                      )}
                    </div>
                    {imageUrlError[item.id] && (
                      <p className="text-red-400 text-xs mt-1">
                        {imageUrlError[item.id]}
                      </p>
                    )}
                    {!imageUrlError[item.id] &&
                      (editingImageUrl[item.id] || item.image_url) && (
                        <div className="mt-2">
                          <div className="relative w-full max-w-md h-32 rounded-gaming overflow-hidden border border-stakeados-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={editingImageUrl[item.id] ?? item.image_url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {validateImageUrl(
                            editingImageUrl[item.id] ?? item.image_url
                          ).warning && (
                            <p className="text-yellow-400 text-xs mt-1">
                              {
                                validateImageUrl(
                                  editingImageUrl[item.id] ?? item.image_url
                                ).warning
                              }
                            </p>
                          )}
                        </div>
                      )}
                  </div>

                  {/* AI Suggestions */}
                  {item.ai_metadata?.suggested_categories &&
                    item.ai_metadata.suggested_categories.length > 0 && (
                      <div className="mb-3">
                        <p className="text-stakeados-gray-400 text-sm mb-2">
                          {t('aiSuggestions.categories')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.ai_metadata.suggested_categories.map(
                            categoryId => {
                              const category = categories.find(
                                c => c.id === categoryId
                              );
                              return category ? (
                                <button
                                  key={categoryId}
                                  onClick={() =>
                                    handleCategorizeNews(item.id, categoryId)
                                  }
                                  className="flex items-center gap-2 px-3 py-1 bg-stakeados-gray-700 hover:bg-stakeados-primary/20 border border-stakeados-gray-600 hover:border-stakeados-primary/50 rounded-gaming text-sm transition-colors"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </button>
                              ) : null;
                            }
                          )}
                        </div>
                      </div>
                    )}

                  {/* Current Category */}
                  <div className="mb-3">
                    <p className="text-stakeados-gray-400 text-sm mb-2">
                      {t('currentCategory')}
                    </p>
                    {item.category ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <span className="text-white text-sm">
                          {item.category.name}
                        </span>
                        <button
                          onClick={() => handleCategorizeNews(item.id, '')}
                          className="p-1 text-stakeados-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <select
                        onChange={e =>
                          e.target.value &&
                          handleCategorizeNews(item.id, e.target.value)
                        }
                        className="px-3 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
                        defaultValue=""
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <p className="text-stakeados-gray-400 text-sm mb-2">
                      {t('tags.title')}
                    </p>

                    {/* Current Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editingTags[item.id] || item.tags || []).map(tag => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2 py-1 bg-stakeados-primary/20 text-stakeados-primary rounded-gaming text-sm"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(item.id, tag)}
                            className="text-stakeados-primary/70 hover:text-stakeados-primary"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Tag Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={t('tags.addPlaceholder')}
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            handleAddTag(item.id, newTag);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                      />
                      <button
                        onClick={() => handleAddTag(item.id, newTag)}
                        className="p-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {editingTags[item.id] && (
                        <button
                          onClick={() => handleSaveTags(item.id)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-gaming transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* AI Suggested Tags */}
                    {item.ai_metadata?.suggested_tags &&
                      item.ai_metadata.suggested_tags.length > 0 && (
                        <div className="mt-2">
                          <p className="text-stakeados-gray-400 text-xs mb-1">
                            {t('aiSuggestions.tags')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.ai_metadata.suggested_tags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => handleAddTag(item.id, tag)}
                                className="px-2 py-1 bg-stakeados-gray-700 hover:bg-stakeados-primary/20 border border-stakeados-gray-600 hover:border-stakeados-primary/50 rounded text-xs transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedNews(
                          selectedNews === item.id ? null : item.id
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white text-sm rounded-gaming transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      {t('actions.preview')}
                    </button>

                    {!item.processed && onApproveNews && (
                      <button
                        onClick={() => onApproveNews(item.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-gaming transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        {t('actions.approve')}
                      </button>
                    )}

                    {onRejectNews && (
                      <button
                        onClick={() =>
                          onRejectNews(item.id, 'Manual rejection')
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-gaming transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('actions.reject')}
                      </button>
                    )}
                  </div>

                  {/* Preview */}
                  {selectedNews === item.id && item.summary && (
                    <div className="mt-4 p-4 bg-stakeados-gray-800 rounded-gaming border border-stakeados-gray-600">
                      <p className="text-stakeados-gray-300 text-sm">
                        {item.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
              <p className="text-stakeados-gray-400">{t('noNews')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
