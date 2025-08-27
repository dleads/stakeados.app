'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { XCircle, AlertCircle, Star, Save, Send, Eye } from 'lucide-react';
import { EditorialService } from '@/lib/services/editorialService';
import type { ContentReview } from '@/types/editorial';

interface ReviewInterfaceProps {
  contentId: string;
  contentType: 'article' | 'news' | 'proposal';
  reviewType: 'editorial' | 'technical' | 'moderation' | 'final';
  onReviewSubmitted?: (review: ContentReview) => void;
  className?: string;
}

interface ReviewFormData {
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  overall_score?: number;
  feedback: {
    general?: string;
    sections?: Array<{
      section: string;
      comment: string;
      suggestion?: string;
    }>;
  };
  checklist: {
    grammar?: boolean;
    factual?: boolean;
    seo?: boolean;
    readability?: boolean;
    accuracy?: boolean;
    style?: boolean;
  };
  changes_requested?: string[];
  internal_notes?: string;
}

export function ReviewInterface({
  contentId,
  contentType,
  reviewType,
  onReviewSubmitted,
  className = '',
}: ReviewInterfaceProps) {
  const t = useTranslations('editorial');
  const [formData, setFormData] = useState<ReviewFormData>({
    status: 'pending',
    feedback: {},
    checklist: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingReviews, setExistingReviews] = useState<ContentReview[]>([]);

  useEffect(() => {
    loadExistingReviews();
  }, [contentId, contentType]);

  const loadExistingReviews = async () => {
    try {
      const reviews = await EditorialService.getContentReviews(
        contentId,
        contentType
      );
      setExistingReviews(reviews);
    } catch (err) {
      console.error('Error loading existing reviews:', err);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true);
      setError(null);

      const reviewData = {
        content_id: contentId,
        content_type: contentType,
        reviewer_id: '', // Will be set by the service
        review_type: reviewType,
        status: isDraft ? 'pending' : formData.status,
        overall_score: formData.overall_score,
        feedback: formData.feedback,
        checklist: formData.checklist,
        changes_requested: formData.changes_requested,
        internal_notes: formData.internal_notes,
      };

      const review = await EditorialService.createReview(reviewData);
      onReviewSubmitted?.(review);

      // Reset form
      setFormData({
        status: 'pending',
        feedback: {},
        checklist: {},
      });

      await loadExistingReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const addSectionFeedback = () => {
    const sections = formData.feedback.sections || [];
    setFormData({
      ...formData,
      feedback: {
        ...formData.feedback,
        sections: [...sections, { section: '', comment: '', suggestion: '' }],
      },
    });
  };

  const updateSectionFeedback = (
    index: number,
    field: string,
    value: string
  ) => {
    const sections = [...(formData.feedback.sections || [])];
    sections[index] = { ...sections[index], [field]: value };
    setFormData({
      ...formData,
      feedback: {
        ...formData.feedback,
        sections,
      },
    });
  };

  const removeSectionFeedback = (index: number) => {
    const sections = [...(formData.feedback.sections || [])];
    sections.splice(index, 1);
    setFormData({
      ...formData,
      feedback: {
        ...formData.feedback,
        sections,
      },
    });
  };

  const addChangeRequest = () => {
    const changes = formData.changes_requested || [];
    setFormData({
      ...formData,
      changes_requested: [...changes, ''],
    });
  };

  const updateChangeRequest = (index: number, value: string) => {
    const changes = [...(formData.changes_requested || [])];
    changes[index] = value;
    setFormData({
      ...formData,
      changes_requested: changes,
    });
  };

  const removeChangeRequest = (index: number) => {
    const changes = [...(formData.changes_requested || [])];
    changes.splice(index, 1);
    setFormData({
      ...formData,
      changes_requested: changes,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 dark:text-green-400';
      case 'rejected':
        return 'text-red-600 dark:text-red-400';
      case 'changes_requested':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('review.title', { type: reviewType })}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('review.subtitle', { contentType })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Eye className="h-4 w-4 mr-2" />
            {t('review.preview_content')}
          </button>
        </div>
      </div>

      {/* Existing Reviews */}
      {existingReviews.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('review.existing_reviews')}
          </h3>
          <div className="space-y-4">
            {existingReviews.map(review => (
              <div
                key={review.id}
                className="border-l-4 border-gray-200 dark:border-gray-600 pl-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {review.reviewer?.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {review.review_type}
                    </span>
                    <span
                      className={`text-sm font-medium ${getStatusColor(review.status)}`}
                    >
                      {t(`review.status.${review.status}`)}
                    </span>
                  </div>
                  {review.overall_score && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">
                        {review.overall_score}/5
                      </span>
                    </div>
                  )}
                </div>
                {review.feedback.general && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {review.feedback.general}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Review Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('review.status')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['approved', 'rejected', 'changes_requested'].map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t(`review.status.${status}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Overall Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('review.overall_score')}
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, overall_score: score })
                  }
                  className={`p-1 ${
                    (formData.overall_score || 0) >= score
                      ? 'text-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {formData.overall_score || 0}/5
              </span>
            </div>
          </div>

          {/* General Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('review.general_feedback')}
            </label>
            <textarea
              value={formData.feedback.general || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  feedback: { ...formData.feedback, general: e.target.value },
                })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('review.general_feedback_placeholder')}
            />
          </div>

          {/* Quality Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('review.quality_checklist')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'grammar',
                'factual',
                'seo',
                'readability',
                'accuracy',
                'style',
              ].map(item => (
                <label key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.checklist[
                        item as keyof typeof formData.checklist
                      ] || false
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        checklist: {
                          ...formData.checklist,
                          [item]: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t(`review.checklist.${item}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section-specific Feedback */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('review.section_feedback')}
              </label>
              <button
                type="button"
                onClick={addSectionFeedback}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                {t('review.add_section')}
              </button>
            </div>
            <div className="space-y-4">
              {(formData.feedback.sections || []).map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={section.section}
                      onChange={e =>
                        updateSectionFeedback(index, 'section', e.target.value)
                      }
                      placeholder={t('review.section_name')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={section.comment}
                      onChange={e =>
                        updateSectionFeedback(index, 'comment', e.target.value)
                      }
                      placeholder={t('review.comment')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={section.suggestion || ''}
                        onChange={e =>
                          updateSectionFeedback(
                            index,
                            'suggestion',
                            e.target.value
                          )
                        }
                        placeholder={t('review.suggestion')}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeSectionFeedback(index)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Changes Requested */}
          {formData.status === 'changes_requested' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('review.changes_requested')}
                </label>
                <button
                  type="button"
                  onClick={addChangeRequest}
                  className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {t('review.add_change')}
                </button>
              </div>
              <div className="space-y-2">
                {(formData.changes_requested || []).map((change, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={change}
                      onChange={e => updateChangeRequest(index, e.target.value)}
                      placeholder={t('review.change_description')}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeChangeRequest(index)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('review.internal_notes')}
            </label>
            <textarea
              value={formData.internal_notes || ''}
              onChange={e =>
                setFormData({ ...formData, internal_notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('review.internal_notes_placeholder')}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('review.save_draft')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.status}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? t('review.submitting') : t('review.submit_review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
