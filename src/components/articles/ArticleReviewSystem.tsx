'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  User,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ContentService } from '@/lib/services/contentService';

import type { Article, Locale } from '@/types/content';

interface ReviewComment {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  content: string;
  section: string;
  line_number?: number;
  comment_type: 'suggestion' | 'issue' | 'approval' | 'question';
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

interface SEOAnalysis {
  title_length: { en: number; es: number };
  meta_description_length: { en: number; es: number };
  keyword_density: Record<string, number>;
  readability_score: number;
  internal_links: number;
  external_links: number;
  image_alt_texts: number;
  heading_structure: string[];
  suggestions: string[];
}

interface PublicationSchedule {
  scheduled_at: Date;
  timezone: string;
  auto_publish: boolean;
  social_media_posts: {
    twitter: boolean;
    linkedin: boolean;
    facebook: boolean;
  };
  email_notification: boolean;
}

interface ArticleReviewSystemProps {
  article: Article;
  locale: Locale;
  onApprove?: (article: Article) => void;
  onReject?: (article: Article, feedback: string) => void;
  onRequestChanges?: (article: Article, comments: ReviewComment[]) => void;
  onSchedulePublication?: (
    article: Article,
    schedule: PublicationSchedule
  ) => void;
  className?: string;
}

export const ArticleReviewSystem: React.FC<ArticleReviewSystemProps> = ({
  article,
  locale,
  onApprove,
  onReject,
  onRequestChanges,
  onSchedulePublication,
  className = '',
}) => {
  const t = useTranslations('review');
  const tCommon = useTranslations('common');

  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [commentType, setCommentType] =
    useState<ReviewComment['comment_type']>('suggestion');
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [publicationSchedule, setPublicationSchedule] =
    useState<PublicationSchedule>({
      scheduled_at: new Date(),
      timezone: 'UTC',
      auto_publish: true,
      social_media_posts: {
        twitter: false,
        linkedin: false,
        facebook: false,
      },
      email_notification: true,
    });
  const [loading, setLoading] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Load review comments
  useEffect(() => {
    const loadReviewComments = async () => {
      try {
        // In a real implementation, this would fetch from API
        const mockComments: ReviewComment[] = [
          {
            id: '1',
            reviewer_id: 'reviewer-1',
            reviewer_name: 'Senior Editor',
            content:
              'This introduction could be more engaging. Consider starting with a compelling statistic or question.',
            section: 'introduction',
            line_number: 5,
            comment_type: 'suggestion',
            status: 'open',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            reviewer_id: 'reviewer-2',
            reviewer_name: 'Technical Reviewer',
            content:
              'The technical explanation here is excellent and accurate.',
            section: 'main_content',
            line_number: 15,
            comment_type: 'approval',
            status: 'open',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString(),
          },
        ];
        setReviewComments(mockComments);
      } catch (error) {
        console.error('Failed to load review comments:', error);
      }
    };

    loadReviewComments();
  }, [article.id]);

  // Perform SEO analysis
  const performSEOAnalysis = useCallback(async () => {
    try {
      setLoading(true);

      // Analyze content for SEO
      const titleEn = article.title.en;
      const titleEs = article.title.es;
      const contentEn = article.content.en;

      const metaEn = article.meta_description.en;
      const metaEs = article.meta_description.es;

      // Basic SEO analysis
      const analysis: SEOAnalysis = {
        title_length: {
          en: titleEn.length,
          es: titleEs.length,
        },
        meta_description_length: {
          en: metaEn.length,
          es: metaEs.length,
        },
        keyword_density: {},
        readability_score: 75, // Mock score
        internal_links: (contentEn.match(/\[.*?\]\(\/.*?\)/g) || []).length,
        external_links: (contentEn.match(/\[.*?\]\(https?:\/\/.*?\)/g) || [])
          .length,
        image_alt_texts: (contentEn.match(/!\[.*?\]/g) || []).length,
        heading_structure: contentEn.match(/^#{1,6}\s/gm) || [],
        suggestions: [],
      };

      // Generate suggestions
      if (analysis.title_length.en < 30 || analysis.title_length.en > 60) {
        analysis.suggestions.push(
          'Title length should be between 30-60 characters for optimal SEO'
        );
      }

      if (
        analysis.meta_description_length.en < 120 ||
        analysis.meta_description_length.en > 160
      ) {
        analysis.suggestions.push(
          'Meta description should be between 120-160 characters'
        );
      }

      if (analysis.internal_links < 2) {
        analysis.suggestions.push(
          'Consider adding more internal links to related content'
        );
      }

      if (analysis.heading_structure.length < 3) {
        analysis.suggestions.push(
          'Use more headings to improve content structure'
        );
      }

      setSeoAnalysis(analysis);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setLoading(false);
    }
  }, [article]);

  // Add review comment
  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !selectedSection) return;

    const comment: ReviewComment = {
      id: Date.now().toString(),
      reviewer_id: 'current-reviewer',
      reviewer_name: 'Current Reviewer',
      content: newComment.trim(),
      section: selectedSection,
      comment_type: commentType,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReviewComments(prev => [...prev, comment]);
    setNewComment('');
    setSelectedSection('');
  }, [newComment, selectedSection, commentType]);

  // Resolve comment
  const handleResolveComment = useCallback((commentId: string) => {
    setReviewComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              status: 'resolved' as const,
              updated_at: new Date().toISOString(),
            }
          : comment
      )
    );
  }, []);

  // Delete comment
  const handleDeleteComment = useCallback((commentId: string) => {
    setReviewComments(prev => prev.filter(comment => comment.id !== commentId));
  }, []);

  // Approve article
  const handleApprove = useCallback(async () => {
    try {
      setLoading(true);

      // Update article status to published
      await ContentService.publishArticle(article.id);

      if (onApprove) {
        onApprove({ ...article, status: 'published' });
      }
    } catch (error) {
      console.error('Failed to approve article:', error);
    } finally {
      setLoading(false);
    }
  }, [article, onApprove]);

  // Reject article
  const handleReject = useCallback(async () => {
    if (!rejectionFeedback.trim()) return;

    try {
      setLoading(true);

      if (onReject) {
        onReject(article, rejectionFeedback);
      }

      setShowRejectionModal(false);
      setRejectionFeedback('');
    } catch (error) {
      console.error('Failed to reject article:', error);
    } finally {
      setLoading(false);
    }
  }, [article, rejectionFeedback, onReject]);

  // Request changes
  const handleRequestChanges = useCallback(async () => {
    const openComments = reviewComments.filter(c => c.status === 'open');

    if (openComments.length === 0) {
      alert(t('no_open_comments'));
      return;
    }

    try {
      setLoading(true);

      if (onRequestChanges) {
        onRequestChanges(article, openComments);
      }
    } catch (error) {
      console.error('Failed to request changes:', error);
    } finally {
      setLoading(false);
    }
  }, [article, reviewComments, onRequestChanges, t]);

  // Schedule publication
  const handleSchedulePublication = useCallback(async () => {
    try {
      setLoading(true);

      if (onSchedulePublication) {
        onSchedulePublication(article, publicationSchedule);
      }

      setShowSchedulePanel(false);
    } catch (error) {
      console.error('Failed to schedule publication:', error);
    } finally {
      setLoading(false);
    }
  }, [article, publicationSchedule, onSchedulePublication]);

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t('just_now');
    if (diffInMinutes < 60) return t('minutes_ago', { count: diffInMinutes });
    if (diffInMinutes < 1440)
      return t('hours_ago', { count: Math.floor(diffInMinutes / 60) });
    return t('days_ago', { count: Math.floor(diffInMinutes / 1440) });
  };

  const openComments = reviewComments.filter(c => c.status === 'open');
  const resolvedComments = reviewComments.filter(c => c.status === 'resolved');

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('article_review')}
            </h2>
            <p className="text-gray-600 mt-1">
              {t('review_article_description')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setCurrentLocale('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setCurrentLocale('es')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'es'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>

        {/* Article info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('author')}:</span>
            <span className="ml-2 font-medium">{article.author_id}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('submitted')}:</span>
            <span className="ml-2">{formatTimeAgo(article.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('word_count')}:</span>
            <span className="ml-2">
              {article.content[currentLocale].split(/\s+/).length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Article content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {article.title[currentLocale]}
            </h3>
            <p className="text-gray-600">
              {article.meta_description[currentLocale]}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: article.content[currentLocale].replace(/\n/g, '<br>'),
              }}
            />
          </div>

          {/* Inline comments */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              {t('review_comments')}
            </h4>

            {reviewComments.map(comment => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border-l-4 ${
                  comment.comment_type === 'approval'
                    ? 'border-green-500 bg-green-50'
                    : comment.comment_type === 'issue'
                      ? 'border-red-500 bg-red-50'
                      : comment.comment_type === 'question'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {comment.reviewer_avatar ? (
                          <img
                            src={comment.reviewer_avatar}
                            alt={comment.reviewer_name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <User size={12} className="text-gray-600" />
                          </div>
                        )}
                        <span className="font-medium text-sm">
                          {comment.reviewer_name}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          comment.comment_type === 'approval'
                            ? 'bg-green-100 text-green-800'
                            : comment.comment_type === 'issue'
                              ? 'bg-red-100 text-red-800'
                              : comment.comment_type === 'question'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {t(comment.comment_type)}
                      </span>

                      <span className="text-xs text-gray-500">
                        {comment.section} • {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">{comment.content}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {comment.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleResolveComment(comment.id)}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        title={t('resolve_comment')}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title={t('delete_comment')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review panel */}
        <div className="space-y-6">
          {/* Review actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">
              {t('review_actions')}
            </h4>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading || openComments.length > 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle size={16} />
                {loading ? t('approving') : t('approve_article')}
              </button>

              <button
                type="button"
                onClick={handleRequestChanges}
                disabled={loading || openComments.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Edit3 size={16} />
                {t('request_changes')} ({openComments.length})
              </button>

              <button
                type="button"
                onClick={() => setShowRejectionModal(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle size={16} />
                {t('reject_article')}
              </button>
            </div>
          </div>

          {/* Add comment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">
              {t('add_comment')}
            </h4>

            <div className="space-y-3">
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('select_section')}</option>
                <option value="title">{t('title')}</option>
                <option value="introduction">{t('introduction')}</option>
                <option value="main_content">{t('main_content')}</option>
                <option value="conclusion">{t('conclusion')}</option>
                <option value="overall">{t('overall')}</option>
              </select>

              <select
                value={commentType}
                onChange={e =>
                  setCommentType(
                    e.target.value as ReviewComment['comment_type']
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="suggestion">{t('suggestion')}</option>
                <option value="issue">{t('issue')}</option>
                <option value="approval">{t('approval')}</option>
                <option value="question">{t('question')}</option>
              </select>

              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={t('comment_placeholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim() || !selectedSection}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('add_comment')}
              </button>
            </div>
          </div>

          {/* SEO Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">{t('seo_analysis')}</h4>
              <button
                type="button"
                onClick={() => setShowSEOPanel(!showSEOPanel)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Search size={16} />
              </button>
            </div>

            {!seoAnalysis ? (
              <button
                type="button"
                onClick={performSEOAnalysis}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('analyzing') : t('analyze_seo')}
              </button>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('title_length')}:</span>
                  <span
                    className={
                      seoAnalysis.title_length[currentLocale] >= 30 &&
                      seoAnalysis.title_length[currentLocale] <= 60
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {seoAnalysis.title_length[currentLocale]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('meta_length')}:</span>
                  <span
                    className={
                      seoAnalysis.meta_description_length[currentLocale] >=
                        120 &&
                      seoAnalysis.meta_description_length[currentLocale] <= 160
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {seoAnalysis.meta_description_length[currentLocale]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('readability')}:</span>
                  <span className="text-green-600">
                    {seoAnalysis.readability_score}/100
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Publication scheduling */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {t('publication_schedule')}
              </h4>
              <button
                type="button"
                onClick={() => setShowSchedulePanel(!showSchedulePanel)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Calendar size={16} />
              </button>
            </div>

            {showSchedulePanel && (
              <div className="space-y-3">
                <input
                  type="datetime-local"
                  value={publicationSchedule.scheduled_at
                    .toISOString()
                    .slice(0, 16)}
                  onChange={e =>
                    setPublicationSchedule(prev => ({
                      ...prev,
                      scheduled_at: new Date(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-publish"
                    checked={publicationSchedule.auto_publish}
                    onChange={e =>
                      setPublicationSchedule(prev => ({
                        ...prev,
                        auto_publish: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="auto-publish"
                    className="text-sm text-gray-700"
                  >
                    {t('auto_publish')}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSchedulePublication}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('schedule_publication')}
                </button>
              </div>
            )}
          </div>

          {/* Comment summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">
              {t('comment_summary')}
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('open_comments')}:</span>
                <span className="font-medium text-red-600">
                  {openComments.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('resolved_comments')}:</span>
                <span className="font-medium text-green-600">
                  {resolvedComments.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('total_comments')}:</span>
                <span className="font-medium">{reviewComments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('reject_article')}
              </h3>

              <p className="text-gray-600 mb-4">{t('rejection_explanation')}</p>

              <textarea
                value={rejectionFeedback}
                onChange={e => setRejectionFeedback(e.target.value)}
                placeholder={t('rejection_feedback_placeholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectionFeedback.trim() || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t('rejecting') : t('reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleReviewSystem;
