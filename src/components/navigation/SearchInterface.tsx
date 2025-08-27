'use client';

import React, { useState, useEffect, useRef } from 'react';

import {
  Search,
  X,
  BookOpen,
  FileText,
  Newspaper,
  Users,
  Loader2,
} from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'article' | 'news' | 'user';
  href: string;
  metadata?: {
    difficulty?: string;
    category?: string;
    author?: string;
    date?: string;
  };
}

interface SearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInterface({
  isOpen,
  onClose,
  placeholder = 'Search courses, articles, news...',
  className,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock search function - in production this would call actual search APIs
  const performSearch = async (
    searchQuery: string
  ): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Blockchain Fundamentals',
        description:
          'Learn the basics of blockchain technology and cryptocurrency',
        type: 'course' as const,
        href: '/courses/blockchain-fundamentals',
        metadata: { difficulty: 'Basic', category: 'Blockchain' },
      },
      {
        id: '2',
        title: 'DeFi Protocol Analysis',
        description:
          'Deep dive into decentralized finance protocols and mechanisms',
        type: 'course' as const,
        href: '/courses/defi-analysis',
        metadata: { difficulty: 'Advanced', category: 'DeFi' },
      },
      {
        id: '3',
        title: 'Getting Started with Web3',
        description: 'A comprehensive guide to entering the Web3 ecosystem',
        type: 'article' as const,
        href: '/articles/web3-guide',
        metadata: { author: 'Alex Chen', date: '2 days ago' },
      },
      {
        id: '4',
        title: 'Bitcoin Reaches New All-Time High',
        description:
          'Bitcoin surpasses previous records amid institutional adoption',
        type: 'news' as const,
        href: '/news/bitcoin-ath',
        metadata: { category: 'Bitcoin', date: '1 hour ago' },
      },
    ].filter(
      item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setIsLoading(false);
    return mockResults;
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query).then(setResults);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            window.location.href = results[selectedIndex].href;
          } else if (query.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'news':
        return <Newspaper className="w-4 h-4" />;
      case 'user':
        return <Users className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'text-stakeados-primary';
      case 'article':
        return 'text-stakeados-blue';
      case 'news':
        return 'text-stakeados-orange';
      case 'user':
        return 'text-stakeados-purple';
      default:
        return 'text-stakeados-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Interface */}
      <div
        className={cn(
          'relative w-full max-w-2xl mx-4 bg-gaming-card border border-stakeados-gray-600 rounded-gaming-lg shadow-glow-xl',
          className
        )}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-stakeados-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-12 pr-12 py-3 bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all text-lg"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-stakeados-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-stakeados-primary animate-spin" />
              <span className="ml-2 text-stakeados-gray-300">Searching...</span>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
              <p className="text-stakeados-gray-300">
                No results found for "{query}"
              </p>
              <p className="text-stakeados-gray-500 text-sm mt-1">
                Try different keywords or browse our categories
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={result.id}
                  href={result.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-stakeados-gray-700 transition-colors',
                    selectedIndex === index && 'bg-stakeados-gray-700'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 mt-1',
                      getTypeColor(result.type)
                    )}
                  >
                    {getTypeIcon(result.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1 truncate">
                      {result.title}
                    </h3>
                    <p className="text-stakeados-gray-300 text-sm line-clamp-2">
                      {result.description}
                    </p>

                    {result.metadata && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-stakeados-gray-500">
                        {result.metadata.difficulty && (
                          <span className="px-2 py-1 bg-stakeados-gray-800 rounded">
                            {result.metadata.difficulty}
                          </span>
                        )}
                        {result.metadata.category && (
                          <span>{result.metadata.category}</span>
                        )}
                        {result.metadata.author && (
                          <span>by {result.metadata.author}</span>
                        )}
                        {result.metadata.date && (
                          <span>{result.metadata.date}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-xs text-stakeados-gray-500 capitalize">
                    {result.type}
                  </div>
                </Link>
              ))}

              {/* View all results */}
              {query && (
                <div className="border-t border-stakeados-gray-700 p-4">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    View all results for "{query}"
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Quick suggestions when no query */}
          {!query && !isLoading && (
            <div className="py-4">
              <div className="px-4 mb-3">
                <h3 className="text-sm font-semibold text-stakeados-gray-400 uppercase tracking-wider">
                  Quick Access
                </h3>
              </div>
              <div className="space-y-1">
                {[
                  {
                    label: 'Browse Courses',
                    href: '/courses',
                    icon: <BookOpen className="w-4 h-4" />,
                  },
                  {
                    label: 'Community Articles',
                    href: '/community',
                    icon: <FileText className="w-4 h-4" />,
                  },
                  {
                    label: 'Latest News',
                    href: '/news',
                    icon: <Newspaper className="w-4 h-4" />,
                  },
                  {
                    label: 'Genesis Community',
                    href: '/genesis',
                    icon: <Users className="w-4 h-4" />,
                  },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
                  >
                    <div className="text-stakeados-gray-400">{item.icon}</div>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stakeados-gray-700 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-stakeados-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
