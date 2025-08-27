'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Bookmark,
  Share2,
  Eye,
  Clock,
  User,
  Tag,
  TrendingUp,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { ContentService } from '@/lib/services/contentService';
import type { ArticleWithMetrics, Locale } from '@/types/content';

interface ArticleCardProps {
  article: ArticleWithMetrics;
  locale: Locale;
  showInteractions?: boolean;
  compact?: boolean;
  showProgress?: boolean;
  priority?: boolean;
  className?: string;
}

export default function ArticleCard({
  article,
  locale,
  showInteractions = true,
  compact = false,
  showProgress = false,
  className = '',
}: ArticleCardProps) {
  // Support both legacy and current image field names
  const featuredImage =
    (article as any).featured_image_url || (article as any).featured_image;
  // State for interactions
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.like_count || 0);
  const [isInteracting, setIsInteracting] = useState(false);

  // Generate article URL
  const articleUrl = `/${locale}/${locale === 'es' ? 'articulos' : 'articles'}/${ContentService.generateSlug(article.title[locale])}`;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-400/10';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-stakeados-gray-400 bg-stakeados-gray-400/10';
    }
  };

  // Handle like interaction
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInteracting) return;

    try {
      setIsInteracting(true);

      await ContentService.recordInteraction(article.id, 'article', 'like');

      setIsLiked(!isLiked);
      setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Error recording like:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  // Handle bookmark interaction
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInteracting) return;

    try {
      setIsInteracting(true);

      await ContentService.recordInteraction(article.id, 'article', 'bookmark');

      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error recording bookmark:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  // Handle share interaction
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInteracting) return;

    try {
      setIsInteracting(true);

      const shareData = {
        title: article.title[locale],
        text: article.meta_description[locale],
        url: window.location.origin + articleUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // You could show a toast notification here
      }

      await ContentService.recordInteraction(article.id, 'article', 'share');
    } catch (error) {
      console.error('Error sharing article:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  // Handle view tracking
  const handleView = async () => {
    try {
      await ContentService.recordInteraction(article.id, 'article', 'view');

      // Also increment the view count in the database
      await ContentService.incrementViewCount(article.id);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  if (compact) {
    return (
      <Link
        href={articleUrl}
        onClick={handleView}
        className={`block group ${className}`}
      >
        <div className="card-gaming p-4 hover:border-stakeados-primary/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            {/* Featured Image */}
            {featuredImage && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src={featuredImage}
                  alt={article.title[locale]}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-stakeados-primary transition-colors">
                {article.title[locale]}
              </h3>

              <div className="flex items-center gap-2 text-xs text-stakeados-gray-400">
                <span>{article.author_name}</span>
                <span>•</span>
                <span>{article.reading_time} min</span>
                {article.view_count > 0 && (
                  <>
                    <span>•</span>
                    <span>{article.view_count} views</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={`group ${className}`}>
      <div className="card-gaming overflow-hidden hover:border-stakeados-primary/50 transition-all duration-300 h-full flex flex-col">
        {/* Featured Image */}
        {featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <Link href={articleUrl} onClick={handleView}>
              <Image
                src={featuredImage}
                alt={article.title[locale]}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Category Badge */}
            {article.category_name && (
              <div className="absolute top-3 left-3">
                <span
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: article.category_color }}
                >
                  {article.category_name[locale]}
                </span>
              </div>
            )}

            {/* Difficulty Badge */}
            {article.difficulty_level && (
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(article.difficulty_level)}`}
                >
                  {article.difficulty_level.charAt(0).toUpperCase() +
                    article.difficulty_level.slice(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title */}
          <Link href={articleUrl} onClick={handleView}>
            <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-stakeados-primary transition-colors cursor-pointer">
              {article.title[locale]}
            </h3>
          </Link>

          {/* Meta Description */}
          {article.meta_description && (
            <p className="text-stakeados-gray-300 text-sm mb-4 line-clamp-3 flex-1">
              {article.meta_description[locale]}
            </p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tag className="w-3 h-3 text-stakeados-gray-400" />
              {article.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs text-stakeados-gray-400 bg-stakeados-gray-700 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-stakeados-gray-400">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Author and Metadata */}
          <div className="flex items-center gap-4 mb-4 text-sm text-stakeados-gray-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(article.published_at || article.created_at)}
              </span>
            </div>

            {article.reading_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.reading_time} min read</span>
              </div>
            )}
          </div>

          {/* Reading Progress Indicator */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-stakeados-gray-400 mb-1">
                <span>Reading Progress</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-stakeados-gray-700 rounded-full h-1">
                <div
                  className="bg-stakeados-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          )}

          {/* Stats and Interactions */}
          <div className="flex items-center justify-between pt-4 border-t border-stakeados-gray-700">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-stakeados-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{article.view_count || 0}</span>
              </div>

              <div className="flex items-center gap-1">
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`}
                />
                <span>{likeCount}</span>
              </div>

              {article.engagement_rate > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{Math.round(article.engagement_rate * 100)}%</span>
                </div>
              )}
            </div>

            {/* Interaction Buttons */}
            {showInteractions && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={isInteracting}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked
                      ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                      : 'text-stakeados-gray-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                  title="Like article"
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                  />
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={isInteracting}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'text-stakeados-primary bg-stakeados-primary/10 hover:bg-stakeados-primary/20'
                      : 'text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10'
                  }`}
                  title="Bookmark article"
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`}
                  />
                </button>

                <button
                  onClick={handleShare}
                  disabled={isInteracting}
                  className="p-2 rounded-lg text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10 transition-colors"
                  title="Share article"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <Link
                  href={articleUrl}
                  onClick={handleView}
                  className="p-2 rounded-lg text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10 transition-colors"
                  title="Read article"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
