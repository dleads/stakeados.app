'use client';

import React, { useState, useEffect } from 'react';

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
  Calendar,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { ContentService } from '@/lib/services/contentService';

import type {
  ArticleWithMetrics,
  RelatedArticleResult,
  Locale,
} from '@/types/content';

interface ArticleDetailViewProps {
  article: ArticleWithMetrics;
  locale: Locale;
}

export default function ArticleDetailView({
  article,
  locale,
}: ArticleDetailViewProps) {
  // Support both legacy and current image field names
  const featuredImage =
    (article as any).featured_image_url || (article as any).featured_image;

  // State
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.like_count || 0);
  const [viewCount, setViewCount] = useState(article.view_count || 0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<
    RelatedArticleResult[]
  >([]);
  const [readingProgress, setReadingProgress] = useState(0);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const article = document.getElementById('article-content');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      const articleBottom = articleTop + articleHeight;
      const windowBottom = scrollTop + windowHeight;

      if (scrollTop > articleTop && windowBottom < articleBottom) {
        const progress =
          ((scrollTop - articleTop) / (articleHeight - windowHeight)) * 100;
        setReadingProgress(Math.min(Math.max(progress, 0), 100));
      } else if (windowBottom >= articleBottom) {
        setReadingProgress(100);
      } else if (scrollTop <= articleTop) {
        setReadingProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load related articles
  useEffect(() => {
    const loadRelatedArticles = async () => {
      try {
        const related = await ContentService.getRelatedArticles(article.id, 3);
        setRelatedArticles(related);
      } catch (error) {
        console.error('Error loading related articles:', error);
      }
    };

    loadRelatedArticles();
  }, [article.id]);

  // Record view on mount
  useEffect(() => {
    const recordView = async () => {
      try {
        await ContentService.recordInteraction(article.id, 'article', 'view');
        await ContentService.incrementViewCount(article.id);
        setViewCount(prev => prev + 1);
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    recordView();
  }, [article.id]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'advanced':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-stakeados-gray-400 bg-stakeados-gray-400/10 border-stakeados-gray-400/20';
    }
  };

  // Handle interactions
  const handleLike = async () => {
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

  const handleBookmark = async () => {
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

  const handleShare = async () => {
    if (isInteracting) return;

    try {
      setIsInteracting(true);

      const shareData = {
        title: article.title[locale],
        text: article.meta_description[locale],
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }

      await ContentService.recordInteraction(article.id, 'article', 'share');
    } catch (error) {
      console.error('Error sharing article:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stakeados-dark">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-stakeados-gray-800 z-50">
        <div
          className="h-full bg-stakeados-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href={`/${locale}/${locale === 'es' ? 'articulos' : 'articles'}`}
            className="inline-flex items-center gap-2 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category and Difficulty */}
          <div className="flex items-center gap-3 mb-4">
            {article.category_name && (
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: article.category_color }}
              >
                {article.category_name[locale]}
              </span>
            )}

            {article.difficulty_level && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(article.difficulty_level)}`}
              >
                {article.difficulty_level.charAt(0).toUpperCase() +
                  article.difficulty_level.slice(1)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {article.title[locale]}
          </h1>

          {/* Meta Description */}
          {article.meta_description && (
            <p className="text-xl text-stakeados-gray-300 mb-6 leading-relaxed">
              {article.meta_description[locale]}
            </p>
          )}

          {/* Author and Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-stakeados-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-medium">{article.author_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>
                {formatDate(article.published_at || article.created_at)}
              </span>
            </div>

            {article.reading_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{article.reading_time} min read</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>{viewCount} views</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <Tag className="w-4 h-4 text-stakeados-gray-400" />
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm text-stakeados-gray-300 bg-stakeados-gray-700 px-3 py-1 rounded-full hover:bg-stakeados-gray-600 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isInteracting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                  : 'text-stakeados-gray-400 hover:text-red-500 hover:bg-red-500/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              disabled={isInteracting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-stakeados-primary bg-stakeados-primary/10 hover:bg-stakeados-primary/20'
                  : 'text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
              />
              <span>Save</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isInteracting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <Image
              src={featuredImage}
              alt={article.title[locale]}
              width={800}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <article
          id="article-content"
          className="prose prose-lg prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content[locale] }}
        />

        {/* Article Footer */}
        <footer className="border-t border-stakeados-gray-700 pt-8">
          {/* Author Info */}
          <div className="card-gaming p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-stakeados-gray-700 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-stakeados-gray-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {article.author_name}
                </h3>
                <p className="text-stakeados-gray-300 mb-4">
                  Content creator and blockchain educator sharing knowledge
                  about Web3 and DeFi.
                </p>
                <div className="flex items-center gap-4 text-sm text-stakeados-gray-400">
                  <span>Articles: 12</span>
                  <span>•</span>
                  <span>Followers: 1.2k</span>
                </div>
              </div>

              <button className="btn-primary">Follow</button>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Related Articles
                </h2>
                <Link
                  href={`/${locale}/${locale === 'es' ? 'articulos' : 'articles'}`}
                  className="text-stakeados-primary hover:text-stakeados-primary/80 transition-colors flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map(relatedArticle => (
                  <div key={relatedArticle.id} className="card-gaming p-4">
                    <Link
                      href={`/${locale}/${locale === 'es' ? 'articulos' : 'articles'}/${ContentService.generateSlug(relatedArticle.title[locale])}`}
                      className="block group"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-stakeados-primary transition-colors line-clamp-2">
                        {relatedArticle.title[locale]}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-stakeados-gray-400 mb-3">
                        <span>{relatedArticle.author_name}</span>
                        <span>•</span>
                        <span>{relatedArticle.reading_time} min read</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stakeados-gray-500">
                        <span>
                          Similarity:{' '}
                          {Math.round(relatedArticle.similarity_score * 100)}%
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="card-gaming p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Article Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-stakeados-primary mb-1">
                  {viewCount}
                </div>
                <div className="text-sm text-stakeados-gray-400">Views</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-stakeados-primary mb-1">
                  {likeCount}
                </div>
                <div className="text-sm text-stakeados-gray-400">Likes</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-stakeados-primary mb-1">
                  {article.total_interactions_shares || 0}
                </div>
                <div className="text-sm text-stakeados-gray-400">Shares</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-stakeados-primary mb-1">
                  {Math.round((article.engagement_rate || 0) * 100)}%
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  Engagement
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
