'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import CourseProgressBar from '@/components/progress/CourseProgressBar';
import {
  getCourseTitle,
  getCourseDescription,
  formatCourseDuration,
  getDifficultyBadgeClass,
  type CourseWithProgress,
} from '@/lib/supabase/courses';
import {
  Clock,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import type { Locale } from '@/types';

interface CourseCardProps {
  course: CourseWithProgress;
  locale?: Locale;
  showProgress?: boolean;
  showEnrollButton?: boolean;
  onEnroll?: (courseId: string) => void;
  isEnrolling?: boolean;
  className?: string;
}

export default function CourseCard({
  course,
  locale = 'en',
  showProgress = true,
  showEnrollButton = true,
  onEnroll,
  isEnrolling = false,
  className = '',
}: CourseCardProps) {
  const t = useTranslations();

  const title = getCourseTitle(course, locale);
  const description = getCourseDescription(course, locale);
  const isEnrolled = !!course.progress;
  const progress = course.progress;

  const handleEnroll = () => {
    if (onEnroll && !isEnrolled) {
      onEnroll(course.id);
    }
  };

  return (
    <div
      className={`card-primary hover:card-highlight transition-all group ${className}`}
    >
      {/* Course Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold border ${getDifficultyBadgeClass(course.level || 'basic')}`}
            >
              {course.level?.toUpperCase() || 'BASIC'}
            </span>
            {!course.published && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-stakeados-gray-700 text-stakeados-gray-300 border border-stakeados-gray-600">
                DRAFT
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-stakeados-primary transition-colors">
            {title}
          </h3>

          <p className="text-stakeados-gray-300 text-sm line-clamp-2 mb-3">
            {description}
          </p>
        </div>
      </div>

      {/* Course Metadata */}
      <div className="flex items-center gap-4 text-sm text-stakeados-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatCourseDuration(course.duration_minutes || 0)}</span>
        </div>

        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>10 lessons</span> {/* This should come from course structure */}
        </div>

        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>0 enrolled</span> {/* This should come from statistics */}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && isEnrolled && progress && (
        <div className="mb-4">
          <CourseProgressBar courseId={course.id} showDetails={true} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {isEnrolled ? (
          <Link
            href={`/courses/${course.id}`}
            className="btn-primary flex-1 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              {progress?.percentage === 100 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t('courses.completed')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t('courses.continueCourse')}
                </>
              )}
            </div>
          </Link>
        ) : (
          <>
            {showEnrollButton && (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="btn-primary flex-1"
              >
                {isEnrolling ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
                    Enrolling...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Enroll Now
                  </div>
                )}
              </button>
            )}

            <Link href={`/courses/${course.id}`} className="btn-ghost">
              <BarChart3 className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>

      {/* Course Stats (for completed courses) */}
      {isEnrolled && progress?.percentage === 100 && (
        <div className="mt-4 pt-4 border-t border-stakeados-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stakeados-gray-300">Completed on:</span>
            <span className="text-stakeados-primary font-semibold">
              {progress.lastAccessed
                ? new Date(progress.lastAccessed).toLocaleDateString()
                : 'Recently'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
