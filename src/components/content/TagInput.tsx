'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Sparkles, Hash, TrendingUp } from 'lucide-react';
import { tagService } from '@/lib/services/tagService';
import type { ContentTag } from '@/types/content';

interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  isExisting?: boolean;
  usageCount?: number;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  showSuggestions?: boolean;
  content?: string;
  title?: string;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  disabled = false,
  showSuggestions = true,
  content,
  title,
  className = '',
}: TagInputProps) {
  const t = useTranslations('content.tags');
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ContentTag[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<TagSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load existing tag suggestions based on input
  useEffect(() => {
    if (inputValue.length >= 2) {
      loadSuggestions(inputValue);
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  // Load AI suggestions when content is provided
  useEffect(() => {
    if (showSuggestions && content && content.length > 100) {
      loadAISuggestions();
    }
  }, [content, title, showSuggestions]);

  const loadSuggestions = async (query: string) => {
    try {
      const results = await tagService.suggestTagsFromExisting(query);
      setSuggestions(results.filter(tag => !value.includes(tag.name)));
    } catch (error) {
      console.error('Error loading tag suggestions:', error);
      setSuggestions([]);
    }
  };

  const loadAISuggestions = async () => {
    if (!content) return;

    setLoadingAI(true);
    try {
      const suggestions = await tagService.suggestTagsFromContent(
        content,
        title
      );
      setAiSuggestions(
        suggestions.filter(suggestion => !value.includes(suggestion.tag))
      );
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setLoadingAI(false);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (
      normalizedTag &&
      !value.includes(normalizedTag) &&
      value.length < maxTags
    ) {
      onChange([...value, normalizedTag]);
      setInputValue('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowDropdown(newValue.length > 0 || aiSuggestions.length > 0);
    setSelectedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allSuggestions = [
      ...suggestions,
      ...aiSuggestions.map(s => ({ name: s.tag, id: s.tag })),
    ];

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          addTag(allSuggestions[selectedIndex].name);
        } else if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;

      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value[value.length - 1]);
        }
        break;

      case ',':
      case 'Tab':
        e.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(inputValue.length > 0 || aiSuggestions.length > 0);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicking on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const allSuggestions = [
    ...suggestions.map(tag => ({
      type: 'existing' as const,
      name: tag.name,
      usageCount: tag.usage_count,
      id: tag.id,
    })),
    ...aiSuggestions.map(suggestion => ({
      type: 'ai' as const,
      name: suggestion.tag,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
      isExisting: suggestion.isExisting,
      usageCount: suggestion.usageCount,
      id: suggestion.tag,
    })),
  ];

  const filteredSuggestions = allSuggestions.filter(
    suggestion =>
      suggestion.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion.name)
  );

  return (
    <div className={`relative ${className}`}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
          >
            <Hash className="w-3 h-3" />
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-primary/60 hover:text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={
            value.length >= maxTags ? t('maxTagsReached') : placeholder
          }
          disabled={disabled || value.length >= maxTags}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />

        {/* AI Loading Indicator */}
        {loadingAI && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto"
        >
          {/* Existing Tags Section */}
          {filteredSuggestions.some(s => s.type === 'existing') && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <TrendingUp className="w-3 h-3" />
                {t('existingTags')}
              </div>
              {filteredSuggestions
                .filter(s => s.type === 'existing')
                .slice(0, 5)
                .map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => addTag(suggestion.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded ${
                      selectedIndex === index ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{suggestion.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {suggestion.usageCount} {t('uses')}
                    </span>
                  </button>
                ))}
            </div>
          )}

          {/* AI Suggestions Section */}
          {filteredSuggestions.some(s => s.type === 'ai') && (
            <div className="p-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <Sparkles className="w-3 h-3" />
                {t('aiSuggestions')}
              </div>
              {filteredSuggestions
                .filter(s => s.type === 'ai')
                .slice(0, 5)
                .map((suggestion, index) => {
                  const adjustedIndex =
                    index +
                    filteredSuggestions.filter(s => s.type === 'existing')
                      .length;
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => addTag(suggestion.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded ${
                        selectedIndex === adjustedIndex ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{suggestion.name}</span>
                        {suggestion.isExisting && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                            {t('popular')}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {Math.round((suggestion.confidence || 0) * 100)}%{' '}
                          {t('confidence')}
                        </div>
                        {suggestion.usageCount && (
                          <div className="text-xs text-gray-400">
                            {suggestion.usageCount} {t('uses')}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Add Custom Tag Option */}
          {inputValue.trim() &&
            !filteredSuggestions.some(s => s.name === inputValue.trim()) && (
              <div className="p-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => addTag(inputValue.trim())}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded ${
                    selectedIndex === filteredSuggestions.length
                      ? 'bg-primary/10'
                      : ''
                  }`}
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                  <span className="text-sm">
                    {t('addCustomTag', { tag: inputValue.trim() })}
                  </span>
                </button>
              </div>
            )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        {t('tagInputHelp', { current: value.length, max: maxTags })}
      </div>
    </div>
  );
}
