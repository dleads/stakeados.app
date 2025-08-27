'use client';

import React, { useState, useEffect } from 'react';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { Save, Eye, EyeOff, Trash2, X, Loader2 } from 'lucide-react';
import type { Locale } from '@/types';

interface CourseEditorProps {
  courseId?: string;
  onSave?: (courseId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export default function CourseEditor({
  courseId,
  onSave,
  onCancel,
  className = '',
}: CourseEditorProps) {
  const {
    currentCourse,
    loadCourse,
    createNewCourse,
    updateExistingCourse,
    deleteCourseById,
    togglePublication,
    isSaving,
    error,
    success,
    clearMessages,
    hasPermission,
  } = useCourseManagement(true);

  const [formData, setFormData] = useState({
    title: { en: '', es: '' },
    description: { en: '', es: '' },
    difficulty: 'basic' as 'basic' | 'intermediate' | 'advanced',
    estimated_time: 60,
    is_published: false,
    nft_contract_address: '',
  });

  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load course data if editing
  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId, loadCourse]);

  // Update form data when course loads
  useEffect(() => {
    if (currentCourse && courseId) {
      setFormData({
        title: (currentCourse.title as Record<Locale, string>) || {
          en: '',
          es: '',
        },
        description: (currentCourse.description as Record<Locale, string>) || {
          en: '',
          es: '',
        },
        difficulty: (currentCourse.level || 'basic') as
          | 'basic'
          | 'intermediate'
          | 'advanced',
        estimated_time: currentCourse.duration_minutes || 0,
        is_published: currentCourse.published || false,
        nft_contract_address: currentCourse.nft_contract_address || '',
      });
    }
  }, [currentCourse, courseId]);

  if (!hasPermission) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Admin access required to edit courses</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Validation
    if (!formData.title.en.trim() || !formData.description.en.trim()) {
      return;
    }

    // Generate slug from English title
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    const courseData = {
      title: formData.title,
      description: formData.description,
      level: formData.difficulty,
      duration_minutes: formData.estimated_time,
      published: formData.is_published,
      nft_contract_address: formData.nft_contract_address || null,
      slug: generateSlug(formData.title.en),
    };

    let result;
    if (courseId) {
      result = await updateExistingCourse(courseId, courseData);
    } else {
      result = await createNewCourse(courseData);
    }

    if (result && onSave) {
      onSave(result.id);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;

    const success = await deleteCourseById(courseId);
    if (success && onCancel) {
      onCancel();
    }
    setShowDeleteConfirm(false);
  };

  const handleTogglePublication = async () => {
    if (!courseId) return;

    await togglePublication(courseId, !formData.is_published);
    setFormData(prev => ({ ...prev, is_published: !prev.is_published }));
  };

  const handleInputChange = (field: string, value: any, locale?: Locale) => {
    if (locale) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...((prev[field as keyof typeof prev] as Record<string, string>) ||
            {}),
          [locale]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon mb-2">
            {courseId ? 'Edit Course' : 'Create New Course'}
          </h2>
          <p className="text-stakeados-gray-300">
            {courseId
              ? 'Update course information and content'
              : 'Create a new educational course'}
          </p>
        </div>

        {courseId && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePublication}
              disabled={isSaving}
              className={`btn-ghost ${formData.is_published ? 'text-stakeados-yellow' : 'text-stakeados-gray-400'}`}
            >
              {formData.is_published ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Draft
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="btn-ghost text-stakeados-red hover:bg-stakeados-red/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="notification-error">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-red hover:text-stakeados-red/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="notification-success">
              <div className="flex items-center justify-between">
                <span>{success}</span>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Tabs */}
        <div className="card-gaming">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveLocale('en')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors ${
                activeLocale === 'en'
                  ? 'bg-stakeados-primary text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale('es')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors ${
                activeLocale === 'es'
                  ? 'bg-stakeados-primary text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              Español
            </button>
          </div>

          {/* Title */}
          <div className="form-gaming mb-4">
            <label htmlFor={`title-${activeLocale}`}>
              Course Title ({activeLocale.toUpperCase()})
            </label>
            <input
              type="text"
              id={`title-${activeLocale}`}
              value={formData.title[activeLocale]}
              onChange={e =>
                handleInputChange('title', e.target.value, activeLocale)
              }
              placeholder="Enter course title..."
              required={activeLocale === 'en'}
            />
          </div>

          {/* Description */}
          <div className="form-gaming">
            <label htmlFor={`description-${activeLocale}`}>
              Course Description ({activeLocale.toUpperCase()})
            </label>
            <textarea
              id={`description-${activeLocale}`}
              value={formData.description[activeLocale]}
              onChange={e =>
                handleInputChange('description', e.target.value, activeLocale)
              }
              placeholder="Enter course description..."
              rows={4}
              required={activeLocale === 'en'}
              className="resize-none"
            />
          </div>
        </div>

        {/* Course Settings */}
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-4">Course Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="form-gaming">
              <label htmlFor="difficulty">Difficulty Level</label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={e => handleInputChange('difficulty', e.target.value)}
                required
              >
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Estimated Time */}
            <div className="form-gaming">
              <label htmlFor="estimated_time">Estimated Time (minutes)</label>
              <input
                type="number"
                id="estimated_time"
                value={formData.estimated_time}
                onChange={e =>
                  handleInputChange('estimated_time', parseInt(e.target.value))
                }
                min="1"
                required
              />
            </div>
          </div>

          {/* NFT Contract Address */}
          <div className="form-gaming">
            <label htmlFor="nft_contract_address">
              NFT Contract Address (Optional)
            </label>
            <input
              type="text"
              id="nft_contract_address"
              value={formData.nft_contract_address}
              onChange={e =>
                handleInputChange('nft_contract_address', e.target.value)
              }
              placeholder="0x..."
              className="font-mono"
            />
            <p className="text-xs text-stakeados-gray-400 mt-1">
              Contract address for course completion certificates
            </p>
          </div>

          {/* Publication Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={e =>
                handleInputChange('is_published', e.target.checked)
              }
              className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary focus:ring-2"
            />
            <label htmlFor="is_published" className="text-stakeados-gray-300">
              Publish course (make visible to students)
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {courseId ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {courseId ? 'Update Course' : 'Create Course'}
              </div>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="card-gaming max-w-md mx-4">
            <h3 className="text-xl font-bold text-stakeados-red mb-4">
              Delete Course
            </h3>
            <p className="text-stakeados-gray-300 mb-6">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="btn-primary bg-stakeados-red hover:bg-stakeados-red/80"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  'Delete Course'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSaving}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
