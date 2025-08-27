'use client';

import React from 'react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { CheckCircle, Clock, Target } from 'lucide-react';

interface CourseProgressBarProps {
  courseId: string;
  showDetails?: boolean;
  className?: string;
}

export default function CourseProgressBar({
  courseId,
  showDetails = false,
  className = '',
}: CourseProgressBarProps) {
  const { getCourseProgressPercentage, getCourseProgress, isLoading } =
    useProgressTracking();

  const [courseProgress, setCourseProgress] = React.useState<any[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = React.useState(false);

  React.useEffect(() => {
    const loadCourseProgress = async () => {
      setIsLoadingCourse(true);
      try {
        const progress = await getCourseProgress(courseId);
        setCourseProgress(progress);
      } catch (error) {
        console.error('Error loading course progress:', error);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    loadCourseProgress();
  }, [courseId, getCourseProgress]);

  const percentage = getCourseProgressPercentage(courseId);
  const completedItems = courseProgress.filter(p => p.completed_at).length;
  const totalItems = 9; // This should come from course structure
  const isCompleted = percentage >= 100;

  if (isLoading || isLoadingCourse) {
    return (
      <div className={`${className}`}>
        <div className="progress-bar">
          <div className="h-full bg-stakeados-gray-600 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="progress-bar">
            <div
              className={`progress-fill transition-all duration-500 ${
                isCompleted
                  ? 'bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light'
                  : ''
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted && (
            <CheckCircle className="w-4 h-4 text-stakeados-primary" />
          )}
          <span
            className={`text-sm font-semibold ${
              isCompleted ? 'text-stakeados-primary' : 'text-white'
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-sm text-stakeados-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>
                {completedItems}/{totalItems} completed
              </span>
            </div>

            {courseProgress.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  Last activity:{' '}
                  {new Date(
                    Math.max(
                      ...courseProgress.map(p =>
                        new Date(p.created_at).getTime()
                      )
                    )
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1 text-stakeados-primary">
              <CheckCircle className="w-3 h-3" />
              <span className="font-semibold">Completed</span>
            </div>
          )}
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && showDetails && (
        <div className="p-3 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
          <div className="flex items-center gap-2 text-stakeados-primary">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Course Completed!</span>
          </div>
          <p className="text-sm text-stakeados-gray-300 mt-1">
            Congratulations! Your certificate NFT should be minted
            automatically.
          </p>
        </div>
      )}
    </div>
  );
}
