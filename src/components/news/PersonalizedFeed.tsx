import React, { useEffect } from 'react';

import { useNewsManagement } from '@/hooks/useNewsManagement';
import { useAuthContext } from '@/components/auth/AuthProvider';
import NewsCard from './NewsCard';
import { User, TrendingUp, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import type { Locale } from '@/types';

interface PersonalizedFeedProps {
  locale?: Locale;
  maxArticles?: number;
  showHeader?: boolean;
  className?: string;
}

export default function PersonalizedFeed({
  locale = 'en',
  maxArticles = 10,
  showHeader = true,
  className = '',
}: PersonalizedFeedProps) {
  const { isAuthenticated } = useAuthContext();
  const {
    personalizedFeed,
    userStats,
    isLoading,
    error,
    loadPersonalizedFeed,
    // loadUserNewsStats: loadUserStats, // Temporarily commented out
  } = useNewsManagement();

  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalizedFeed();
      // loadUserStats(); // Temporarily commented out
    }
  }, [isAuthenticated, loadPersonalizedFeed, maxArticles]);

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <User className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Sign In for Personalized News
          </h3>
          <p className="text-stakeados-gray-400 mb-6">
            Get news curated based on your learning progress and interests
          </p>
          <button className="btn-primary">Sign In</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">
            Curating your personalized feed...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading personalized feed: {error}</p>
          <button
            onClick={() => loadPersonalizedFeed()}
            className="btn-ghost mt-3"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-stakeados-blue" />
            <div>
              <h2 className="text-2xl font-bold text-neon">
                Personalized Feed
              </h2>
              <p className="text-stakeados-gray-300">
                News curated for your interests
              </p>
            </div>
          </div>

          <button onClick={() => loadPersonalizedFeed()} className="btn-ghost">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-blue mb-1">
            {userStats.articlesRead}
          </div>
          <div className="text-sm text-stakeados-gray-300">Articles Read</div>
        </div>

        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-primary mb-1">
            {userStats.readingStreak}
          </div>
          <div className="text-sm text-stakeados-gray-300">Reading Streak</div>
        </div>

        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-purple mb-1">
            {userStats.favoriteCategories.length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Interests</div>
        </div>

        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-yellow mb-1">
            {Math.round(userStats.totalReadingTime / 60)}
          </div>
          <div className="text-sm text-stakeados-gray-300">Hours Read</div>
        </div>
      </div>

      {/* Favorite Categories */}
      {userStats.favoriteCategories.length > 0 && (
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-4">Your Interests</h3>
          <div className="flex flex-wrap gap-2">
            {userStats.favoriteCategories.map(category => (
              <span
                key={category}
                className="px-3 py-1 bg-stakeados-primary/20 text-stakeados-primary rounded-gaming text-sm font-semibold border border-stakeados-primary/30"
              >
                {category}
              </span>
            ))}
          </div>
          <p className="text-stakeados-gray-400 text-sm mt-3">
            Based on your course progress and reading history
          </p>
        </div>
      )}

      {/* Personalized Articles */}
      {personalizedFeed.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalizedFeed.slice(0, maxArticles).map(article => (
              <NewsCard
                key={article.id}
                article={article}
                locale={locale}
                showSource={true}
                showRelevanceScore={true}
                showCategories={true}
              />
            ))}
          </div>

          {personalizedFeed.length > maxArticles && (
            <div className="text-center">
              <button
                onClick={() => loadPersonalizedFeed()}
                className="btn-secondary"
              >
                Load More Personalized Articles
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-gaming text-center py-12">
          <BookOpen className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Building Your Personalized Feed
          </h3>
          <p className="text-stakeados-gray-400 mb-6">
            Complete some courses and read articles to help us understand your
            interests
          </p>
          <div className="flex items-center gap-4 justify-center">
            <button className="btn-primary">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </button>
            <button className="btn-secondary">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Trending News
            </button>
          </div>
        </div>
      )}

      {/* Personalization Tips */}
      <div className="card-gaming">
        <h4 className="font-semibold text-stakeados-primary mb-3">
          💡 Improve Your Feed
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-2">
          <li>• Complete courses to indicate your learning interests</li>
          <li>• Read articles in categories you're interested in</li>
          <li>• Your feed improves as you engage with content</li>
          <li>• High-quality articles (6+ relevance score) are prioritized</li>
        </ul>
      </div>
    </div>
  );
}
