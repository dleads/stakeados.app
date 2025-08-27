'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import CourseCard from './CourseCard';
import { Search, Filter, BookOpen, Loader2 } from 'lucide-react';
import type { Locale } from '@/types';

interface CourseGridProps {
  locale?: Locale;
  showFilters?: boolean;
  showSearch?: boolean;
  maxCourses?: number;
  enrolledOnly?: boolean;
  className?: string;
  emptyStateComponent?: React.ReactNode;
}

export default function CourseGrid({
  locale = 'en',
  showFilters = true,
  showSearch = true,
  maxCourses,
  enrolledOnly = false,
  className = '',
  emptyStateComponent,
}: CourseGridProps) {
  const t = useTranslations();
  const {
    courses,
    isLoading,
    error,
    enrollInCourse,
    isSaving,
    searchCoursesWithFilters,
    filterByDifficulty,
    loadCourses,
    getEnrolledCourses,
    clearMessages,
  } = useCourseManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showPublishedOnly, setShowPublishedOnly] = useState(true);

  // Get courses to display
  const displayCourses = React.useMemo(() => {
    let filteredCourses = enrolledOnly ? getEnrolledCourses() : courses;

    if (maxCourses) {
      filteredCourses = filteredCourses.slice(0, maxCourses);
    }

    return filteredCourses;
  }, [courses, enrolledOnly, maxCourses, getEnrolledCourses]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const filters: any = {};
    if (selectedDifficulty !== 'all') {
      filters.difficulty = selectedDifficulty;
    }
    if (showPublishedOnly) {
      filters.published = true;
    }

    await searchCoursesWithFilters(searchQuery, filters);
  };

  const handleDifficultyFilter = async (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    clearMessages();

    if (difficulty === 'all') {
      await loadCourses();
    } else {
      await filterByDifficulty(
        difficulty as 'basic' | 'intermediate' | 'advanced'
      );
    }
  };

  const handleEnroll = async (courseId: string) => {
    await enrollInCourse(courseId);
  };

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading courses: {error}</p>
          <button onClick={() => loadCourses()} className="btn-ghost mt-3">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon mb-2">
            {enrolledOnly ? 'My Courses' : t('courses.title')}
          </h2>
          <p className="text-stakeados-gray-300">
            {enrolledOnly
              ? 'Continue your learning journey'
              : t('courses.subtitle')}
          </p>
        </div>

        {displayCourses.length > 0 && (
          <div className="text-sm text-stakeados-gray-400">
            {displayCourses.length} course
            {displayCourses.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && !enrolledOnly && (
        <div className="card-gaming">
          <div className="space-y-4">
            {/* Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full pl-12 pr-4 py-3 bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-stakeados-gray-400" />
                  <span className="text-sm text-stakeados-gray-300">
                    Difficulty:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {['all', 'basic', 'intermediate', 'advanced'].map(
                    difficulty => (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyFilter(difficulty)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          selectedDifficulty === difficulty
                            ? 'bg-stakeados-primary text-stakeados-dark'
                            : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                        }`}
                      >
                        {difficulty === 'all'
                          ? 'All'
                          : difficulty.charAt(0).toUpperCase() +
                            difficulty.slice(1)}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published-only"
                    checked={showPublishedOnly}
                    onChange={e => setShowPublishedOnly(e.target.checked)}
                    className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-700 border-stakeados-gray-600 rounded focus:ring-stakeados-primary focus:ring-2"
                  />
                  <label
                    htmlFor="published-only"
                    className="text-sm text-stakeados-gray-300"
                  >
                    Published only
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Loading courses...</p>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && displayCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              showProgress={true}
              showEnrollButton={!enrolledOnly}
              onEnroll={handleEnroll}
              isEnrolling={isSaving}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading &&
        displayCourses.length === 0 &&
        (emptyStateComponent || (
          <div className="card-gaming text-center py-12">
            <BookOpen className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
              {enrolledOnly ? 'No Enrolled Courses' : 'No Courses Found'}
            </h3>
            <p className="text-stakeados-gray-400 mb-6">
              {enrolledOnly
                ? 'Start learning by enrolling in your first course'
                : searchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back soon for new courses'}
            </p>
            {enrolledOnly && (
              <button
                onClick={() => (window.location.href = '/courses')}
                className="btn-primary"
              >
                Browse All Courses
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
