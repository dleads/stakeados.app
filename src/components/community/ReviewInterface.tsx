'use client';

import React, { useState } from 'react';
import { getArticleTitle, getArticleContent } from '@/lib/supabase/articles';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatDate, calculateReadingTime } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Eye, Star, Send } from 'lucide-react';
import type { Database } from '@/types/supabase';

type ArticleWithAuthor = Database['public']['Tables']['articles']['Row'] & {
  profiles: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

interface ReviewInterfaceProps {
  article: ArticleWithAuthor;
  onApprove: (articleId: string, feedback?: string) => void;
  onReject: (articleId: string, feedback: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function ReviewInterface({
  article,
  onApprove,
  onReject,
  isProcessing = false,
  className = '',
}: ReviewInterfaceProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [qualityScore, setQualityScore] = useState<number>(0);

  const title = getArticleTitle(article, 'en');
  const content = getArticleContent(article, 'en');
  const readingTime = calculateReadingTime(content);
  const authorName =
    article.profiles?.display_name || article.profiles?.username || 'Anonymous';

  const handleSubmitReview = () => {
    if (reviewAction === 'approve') {
      onApprove(article.id, feedback);
    } else if (reviewAction === 'reject') {
      onReject(article.id, feedback);
    }
    setReviewAction(null);
    setFeedback('');
  };

  const getQualityColor = (score: number) => {
    if (score >= 4) return 'text-stakeados-primary';
    if (score >= 3) return 'text-stakeados-blue';
    if (score >= 2) return 'text-stakeados-yellow';
    return 'text-stakeados-red';
  };

  return (
    <div className={`card-gaming ${className}`}>
      {/* Article Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-stakeados-yellow/20 text-stakeados-yellow rounded text-xs font-semibold border border-stakeados-yellow/30">
              PENDING REVIEW
            </span>
            {article.category_id && (
              <span className="px-2 py-1 bg-stakeados-blue/20 text-stakeados-blue rounded text-xs font-semibold">
                Category: {article.category_id}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

          <div className="flex items-center gap-4 text-sm text-stakeados-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>
                Submitted{' '}
                {article.created_at
                  ? formatDate(article.created_at)
                  : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-stakeados-gray-800 rounded-gaming">
        <UserAvatar
          profileAvatarUrl={article.profiles?.avatar_url}
          displayName={authorName}
          size="md"
        />
        <div className="flex-1">
          <div className="font-semibold text-white">{authorName}</div>
          <div className="text-sm text-stakeados-gray-400">Article Author</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-stakeados-gray-300">
            Previous Articles
          </div>
          <div className="text-lg font-bold text-stakeados-primary">0</div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stakeados-primary">
            Article Content
          </h3>
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="btn-ghost text-sm"
          >
            {showFullContent ? 'Show Less' : 'Show Full Content'}
          </button>
        </div>

        <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
          <div className={`${!showFullContent ? 'line-clamp-6' : ''}`}>
            <div
              dangerouslySetInnerHTML={{
                __html: content
                  .replace(/\n/g, '<br>')
                  .substring(0, showFullContent ? content.length : 500),
              }}
            />
            {!showFullContent && content.length > 500 && (
              <span className="text-stakeados-gray-400">...</span>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-stakeados-primary mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quality Assessment */}
      <div className="mb-6">
        <h4 className="font-semibold text-stakeados-primary mb-3">
          Quality Assessment
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-stakeados-gray-300">Overall Quality:</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setQualityScore(star)}
                  className={`w-6 h-6 ${
                    star <= qualityScore
                      ? 'text-stakeados-yellow'
                      : 'text-stakeados-gray-600'
                  } hover:text-stakeados-yellow transition-colors`}
                >
                  <Star className="w-full h-full fill-current" />
                </button>
              ))}
              <span
                className={`ml-2 font-semibold ${getQualityColor(qualityScore)}`}
              >
                {qualityScore > 0 && `${qualityScore}/5`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stakeados-gray-300">Originality:</span>
              <span className="text-stakeados-primary">✓ Good</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stakeados-gray-300">
                Technical Accuracy:
              </span>
              <span className="text-stakeados-blue">✓ Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stakeados-gray-300">Formatting:</span>
              <span className="text-stakeados-primary">✓ Good</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stakeados-gray-300">Community Value:</span>
              <span className="text-stakeados-blue">✓ High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions */}
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReviewAction('approve')}
            className={`btn-primary flex-1 ${
              reviewAction === 'approve' ? 'ring-2 ring-stakeados-primary' : ''
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Article
          </button>
          <button
            onClick={() => setReviewAction('reject')}
            className={`btn-secondary flex-1 ${
              reviewAction === 'reject' ? 'ring-2 ring-stakeados-red' : ''
            }`}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Request Changes
          </button>
        </div>

        {/* Feedback Section */}
        {reviewAction && (
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-stakeados-gray-300 mb-2"
            >
              {reviewAction === 'approve'
                ? 'Approval Comments (Optional)'
                : 'Required Changes'}
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder={
                reviewAction === 'approve'
                  ? 'Great article! Any additional comments...'
                  : 'Please specify what changes are needed...'
              }
              rows={4}
              className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2 focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all resize-none"
              required={reviewAction === 'reject'}
            />

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setReviewAction(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={
                  isProcessing ||
                  (reviewAction === 'reject' && !feedback.trim())
                }
                className={`btn-primary ${
                  reviewAction === 'approve'
                    ? 'bg-stakeados-primary'
                    : 'bg-stakeados-red hover:bg-stakeados-red/80'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {reviewAction === 'approve'
                      ? 'Approve & Publish'
                      : 'Request Changes'}
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Guidelines */}
      <div className="mt-6 p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
        <h4 className="font-semibold text-stakeados-blue mb-2">
          Review Guidelines
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Check for originality and plagiarism</li>
          <li>• Verify technical accuracy and best practices</li>
          <li>• Ensure proper formatting and readability</li>
          <li>• Assess community value and educational content</li>
          <li>• Provide constructive feedback for improvements</li>
        </ul>
      </div>
    </div>
  );
}
