'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { Search, BookOpen, FileText, Newspaper, Users } from 'lucide-react';

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'course' | 'article' | 'news' | 'user'
  >('all');

  // Mock search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return [];

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allMockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Blockchain Fundamentals',
        description:
          'Learn the basics of blockchain technology and cryptocurrency',
        type: 'course',
        href: '/courses/blockchain-fundamentals',
        metadata: { difficulty: 'Basic', category: 'Blockchain' },
      },
      {
        id: '2',
        title: 'DeFi Protocol Analysis',
        description:
          'Deep dive into decentralized finance protocols and mechanisms',
        type: 'course',
        href: '/courses/defi-analysis',
        metadata: { difficulty: 'Advanced', category: 'DeFi' },
      },
      {
        id: '3',
        title: 'Getting Started with Web3',
        description: 'A comprehensive guide to entering the Web3 ecosystem',
        type: 'article',
        href: '/articles/web3-guide',
        metadata: { author: 'Alex Chen', date: '2 days ago' },
      },
      {
        id: '4',
        title: 'Bitcoin Reaches New All-Time High',
        description:
          'Bitcoin surpasses previous records amid institutional adoption',
        type: 'news',
        href: '/news/bitcoin-ath',
        metadata: { category: 'Bitcoin', date: '1 hour ago' },
      },
      {
        id: '5',
        title: 'Smart Contract Security Best Practices',
        description:
          'Essential security practices for smart contract development',
        type: 'article',
        href: '/articles/smart-contract-security',
        metadata: { author: 'Maria Rodriguez', date: '1 week ago' },
      },
    ];

    const mockResults = allMockResults.filter(
      item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setIsLoading(false);
    return mockResults;
  };

  useEffect(() => {
    if (query) {
      performSearch(query).then(setResults);
    }
  }, [query]);

  const filteredResults =
    filter === 'all'
      ? results
      : results.filter(result => result.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5 text-stakeados-primary" />;
      case 'article':
        return <FileText className="w-5 h-5 text-stakeados-blue" />;
      case 'news':
        return <Newspaper className="w-5 h-5 text-stakeados-orange" />;
      case 'user':
        return <Users className="w-5 h-5 text-stakeados-purple" />;
      default:
        return <Search className="w-5 h-5 text-stakeados-gray-400" />;
    }
  };

  const breadcrumbItems = [{ label: 'Search', current: true }];

  return (
    <div className="min-h-screen bg-gradient-gaming py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Search className="w-12 h-12 text-stakeados-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-neon">
                Search Results
              </h1>
            </div>
            {query && (
              <p className="text-xl text-stakeados-gray-300">
                Results for "{query}"
              </p>
            )}
          </div>

          {/* Search Stats */}
          {query && (
            <div className="flex items-center justify-between mb-8">
              <div className="text-stakeados-gray-400">
                {isLoading
                  ? 'Searching...'
                  : `${filteredResults.length} results found`}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                {['all', 'course', 'article', 'news', 'user'].map(
                  filterType => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType as any)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        filter === filterType
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                      }`}
                    >
                      {filterType === 'all'
                        ? 'All'
                        : filterType.charAt(0).toUpperCase() +
                          filterType.slice(1)}
                      {filterType !== 'all' && (
                        <span className="ml-1 text-xs">
                          ({results.filter(r => r.type === filterType).length})
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-stakeados-gray-300">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && query && (
            <div className="space-y-4">
              {filteredResults.length > 0 ? (
                filteredResults.map(result => (
                  <div
                    key={result.id}
                    className="card-primary hover:card-highlight transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(result.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white hover:text-stakeados-primary transition-colors">
                            <a href={result.href}>{result.title}</a>
                          </h3>
                          <span className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-xs capitalize">
                            {result.type}
                          </span>
                        </div>

                        <p className="text-stakeados-gray-300 mb-3">
                          {result.description}
                        </p>

                        {result.metadata && (
                          <div className="flex items-center gap-4 text-sm text-stakeados-gray-400">
                            {result.metadata.difficulty && (
                              <span className="flex items-center gap-1">
                                <span>Difficulty:</span>
                                <span className="text-stakeados-primary">
                                  {result.metadata.difficulty}
                                </span>
                              </span>
                            )}
                            {result.metadata.category && (
                              <span className="flex items-center gap-1">
                                <span>Category:</span>
                                <span className="text-stakeados-blue">
                                  {result.metadata.category}
                                </span>
                              </span>
                            )}
                            {result.metadata.author && (
                              <span className="flex items-center gap-1">
                                <span>Author:</span>
                                <span className="text-stakeados-purple">
                                  {result.metadata.author}
                                </span>
                              </span>
                            )}
                            {result.metadata.date && (
                              <span className="text-stakeados-gray-500">
                                {result.metadata.date}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card-gaming text-center py-12">
                  <Search className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
                    No results found
                  </h3>
                  <p className="text-stakeados-gray-400 mb-6">
                    We couldn't find anything matching "{query}". Try different
                    keywords or browse our categories.
                  </p>
                  <div className="flex items-center gap-4 justify-center">
                    <a href="/courses" className="btn-primary">
                      Browse Courses
                    </a>
                    <a href="/community" className="btn-secondary">
                      Community Articles
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Query State */}
          {!query && !isLoading && (
            <div className="card-gaming text-center py-12">
              <Search className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
                Start Your Search
              </h3>
              <p className="text-stakeados-gray-400 mb-6">
                Search for courses, articles, news, and community content
              </p>

              {/* Popular Searches */}
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-stakeados-primary mb-3">
                  Popular Searches:
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'Blockchain',
                    'DeFi',
                    'NFTs',
                    'Web3',
                    'Bitcoin',
                    'Ethereum',
                  ].map(term => (
                    <a
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-primary hover:text-stakeados-dark rounded-gaming transition-colors text-sm"
                    >
                      {term}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
