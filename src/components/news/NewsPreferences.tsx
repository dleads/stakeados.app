'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Bell,
  Tag,
  Globe,
  Star,
  Save,
  X,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { NewsPreferences as NewsPreferencesType } from '@/app/api/news/preferences/route';

interface NewsPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Predefined categories
const AVAILABLE_CATEGORIES = [
  'DeFi',
  'NFTs',
  'Base',
  'Trading',
  'Regulation',
  'Technology',
  'Market Analysis',
  'Bitcoin',
  'Ethereum',
  'Altcoins',
  'Web3',
  'Blockchain',
  'Security',
  'Infrastructure',
];

// Fetch user preferences
const fetchPreferences = async (): Promise<NewsPreferencesType> => {
  const response = await fetch('/api/news/preferences');
  if (!response.ok) {
    throw new Error('Failed to fetch preferences');
  }
  const data = await response.json();
  return data.preferences;
};

// Update user preferences
const updatePreferences = async (
  preferences: NewsPreferencesType
): Promise<void> => {
  const response = await fetch('/api/news/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }
};

export default function NewsPreferences({
  isOpen,
  onClose,
  className = '',
}: NewsPreferencesProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NewsPreferencesType>({
    categories: [],
    keywords: [],
    sources: [],
    minRelevanceScore: 6,
    excludeKeywords: [],
    preferredLanguage: 'en',
    notificationSettings: {
      breakingNews: true,
      dailyDigest: false,
      weeklyRoundup: true,
    },
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences query
  const { data, isLoading, error } = useQuery({
    queryKey: ['newsPreferences'],
    queryFn: fetchPreferences,
    enabled: isOpen,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setHasChanges(false);
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (data) {
      setPreferences(data);
      setHasChanges(false);
    }
  }, [data]);

  // Handle category toggle
  const handleCategoryToggle = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
    setHasChanges(true);
  };

  // Handle keyword addition
  const handleAddKeyword = () => {
    if (
      newKeyword.trim() &&
      !preferences.keywords.includes(newKeyword.trim())
    ) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
      setHasChanges(true);
    }
  };

  // Handle keyword removal
  const handleRemoveKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
    setHasChanges(true);
  };

  // Handle exclude keyword addition
  const handleAddExcludeKeyword = () => {
    if (
      newExcludeKeyword.trim() &&
      !preferences.excludeKeywords.includes(newExcludeKeyword.trim())
    ) {
      setPreferences(prev => ({
        ...prev,
        excludeKeywords: [...prev.excludeKeywords, newExcludeKeyword.trim()],
      }));
      setNewExcludeKeyword('');
      setHasChanges(true);
    }
  };

  // Handle exclude keyword removal
  const handleRemoveExcludeKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      excludeKeywords: prev.excludeKeywords.filter(k => k !== keyword),
    }));
    setHasChanges(true);
  };

  // Handle relevance score change
  const handleRelevanceScoreChange = (score: number) => {
    setPreferences(prev => ({
      ...prev,
      minRelevanceScore: score,
    }));
    setHasChanges(true);
  };

  // Handle language change
  const handleLanguageChange = (language: 'en' | 'es') => {
    setPreferences(prev => ({
      ...prev,
      preferredLanguage: language,
    }));
    setHasChanges(true);
  };

  // Handle notification settings change
  const handleNotificationChange = (
    setting: keyof NewsPreferencesType['notificationSettings'],
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [setting]: value,
      },
    }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  // Handle reset
  const handleReset = () => {
    if (data) {
      setPreferences(data);
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-stakeados-gray-900 rounded-gaming border border-stakeados-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stakeados-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-stakeados-primary" />
            <h2 className="text-2xl font-bold text-white">
              {t('news.preferences.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stakeados-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-stakeados-orange/20 text-stakeados-orange rounded-gaming mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>{t('news.preferences.error')}</span>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-8">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-stakeados-blue" />
                  {t('news.preferences.categories')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AVAILABLE_CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 rounded-gaming text-sm font-medium transition-colors ${
                        preferences.categories.includes(category)
                          ? 'bg-stakeados-primary text-black'
                          : 'bg-stakeados-gray-800 text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-stakeados-blue" />
                  {t('news.preferences.keywords')}
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={e => setNewKeyword(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                      placeholder={t('news.preferences.addKeyword')}
                      className="flex-1 px-3 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
                    />
                    <button
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim()}
                      className="px-4 py-2 bg-stakeados-primary text-black rounded-gaming hover:bg-stakeados-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {preferences.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="flex items-center gap-1 px-3 py-1 bg-stakeados-blue/20 text-stakeados-blue rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="ml-1 hover:text-stakeados-orange transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Exclude Keywords */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Minus className="w-5 h-5 text-stakeados-orange" />
                  {t('news.preferences.excludeKeywords')}
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExcludeKeyword}
                      onChange={e => setNewExcludeKeyword(e.target.value)}
                      onKeyPress={e =>
                        e.key === 'Enter' && handleAddExcludeKeyword()
                      }
                      placeholder={t('news.preferences.addExcludeKeyword')}
                      className="flex-1 px-3 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
                    />
                    <button
                      onClick={handleAddExcludeKeyword}
                      disabled={!newExcludeKeyword.trim()}
                      className="px-4 py-2 bg-stakeados-orange text-black rounded-gaming hover:bg-stakeados-orange/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {preferences.excludeKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.excludeKeywords.map(keyword => (
                        <span
                          key={keyword}
                          className="flex items-center gap-1 px-3 py-1 bg-stakeados-orange/20 text-stakeados-orange rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => handleRemoveExcludeKeyword(keyword)}
                            className="ml-1 hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relevance Score */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {t('news.preferences.minRelevanceScore')}
                  </h3>
                  <div className="flex gap-2">
                    {[5, 6, 7, 8, 9].map(score => (
                      <button
                        key={score}
                        onClick={() => handleRelevanceScoreChange(score)}
                        className={`px-4 py-2 rounded-gaming text-sm font-medium transition-colors ${
                          preferences.minRelevanceScore === score
                            ? 'bg-stakeados-primary text-black'
                            : 'bg-stakeados-gray-800 text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                        }`}
                      >
                        {score}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-stakeados-blue" />
                    {t('news.preferences.language')}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-4 py-2 rounded-gaming text-sm font-medium transition-colors ${
                        preferences.preferredLanguage === 'en'
                          ? 'bg-stakeados-primary text-black'
                          : 'bg-stakeados-gray-800 text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('es')}
                      className={`px-4 py-2 rounded-gaming text-sm font-medium transition-colors ${
                        preferences.preferredLanguage === 'es'
                          ? 'bg-stakeados-primary text-black'
                          : 'bg-stakeados-gray-800 text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      Español
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-stakeados-blue" />
                  {t('news.preferences.notifications')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(preferences.notificationSettings).map(
                    ([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e =>
                            handleNotificationChange(
                              key as keyof NewsPreferencesType['notificationSettings'],
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary focus:ring-2"
                        />
                        <span className="text-stakeados-gray-300">
                          {t(`news.preferences.${key}`)}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-stakeados-gray-700">
          <div className="flex items-center gap-2 text-sm text-stakeados-gray-400">
            {hasChanges && (
              <>
                <AlertCircle className="w-4 h-4" />
                {t('news.preferences.unsavedChanges')}
              </>
            )}
            {updateMutation.isSuccess && (
              <>
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                {t('news.preferences.saved')}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={!hasChanges || updateMutation.isPending}
              className="px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-stakeados-primary text-black rounded-gaming hover:bg-stakeados-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
