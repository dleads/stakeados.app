'use client';

import React, { useState } from 'react';

import { useCourseManagement } from '@/hooks/useCourseManagement';
import CourseEditor from '@/components/courses/CourseEditor';
import CourseCard from '@/components/courses/CourseCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Plus, BookOpen, Eye, EyeOff, Edit, BarChart3 } from 'lucide-react';

export default function AdminCoursesPage() {
  const {
    courses,
    statistics,
    isLoading,
    error,
    getPublishedCoursesList,
    getDraftCoursesList,
    hasPermission,
  } = useCourseManagement(true);

  const [showEditor, setShowEditor] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'all'>(
    'all'
  );

  const publishedCourses = getPublishedCoursesList();
  const draftCourses = getDraftCoursesList();

  const getDisplayCourses = () => {
    switch (activeTab) {
      case 'published':
        return publishedCourses;
      case 'drafts':
        return draftCourses;
      default:
        return courses;
    }
  };

  const handleCreateNew = () => {
    setEditingCourseId(undefined);
    setShowEditor(true);
  };

  const handleEdit = (courseId: string) => {
    setEditingCourseId(courseId);
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    setShowEditor(false);
    setEditingCourseId(undefined);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingCourseId(undefined);
  };

  if (!hasPermission) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-gaming py-12">
          <div className="container mx-auto px-4">
            <div className="card-gaming text-center py-12">
              <h1 className="text-2xl font-bold text-stakeados-red mb-4">
                Access Denied
              </h1>
              <p className="text-stakeados-gray-300">
                Admin privileges required to access course management.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-neon mb-2">
                  Course Management
                </h1>
                <p className="text-xl text-stakeados-gray-300">
                  Create and manage educational courses
                </p>
              </div>

              {!showEditor && (
                <button onClick={handleCreateNew} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </button>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <BookOpen className="w-8 h-8 text-stakeados-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {statistics.totalCourses}
                </div>
                <div className="text-sm text-stakeados-gray-300">
                  Total Courses
                </div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <Eye className="w-8 h-8 text-stakeados-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {statistics.publishedCourses}
                </div>
                <div className="text-sm text-stakeados-gray-300">Published</div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <EyeOff className="w-8 h-8 text-stakeados-gray-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {statistics.draftCourses}
                </div>
                <div className="text-sm text-stakeados-gray-300">Drafts</div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <BarChart3 className="w-8 h-8 text-stakeados-blue" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {statistics.totalEnrollments}
                </div>
                <div className="text-sm text-stakeados-gray-300">
                  Enrollments
                </div>
              </div>
            </div>

            {/* Course Editor */}
            {showEditor && (
              <div className="mb-8">
                <CourseEditor
                  courseId={editingCourseId}
                  onSave={handleEditorSave}
                  onCancel={handleEditorCancel}
                />
              </div>
            )}

            {/* Course List */}
            {!showEditor && (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-gaming font-medium transition-colors ${
                      activeTab === 'all'
                        ? 'bg-stakeados-primary text-stakeados-dark'
                        : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                    }`}
                  >
                    All Courses ({statistics.totalCourses})
                  </button>
                  <button
                    onClick={() => setActiveTab('published')}
                    className={`px-4 py-2 rounded-gaming font-medium transition-colors ${
                      activeTab === 'published'
                        ? 'bg-stakeados-primary text-stakeados-dark'
                        : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                    }`}
                  >
                    Published ({statistics.publishedCourses})
                  </button>
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className={`px-4 py-2 rounded-gaming font-medium transition-colors ${
                      activeTab === 'drafts'
                        ? 'bg-stakeados-primary text-stakeados-dark'
                        : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                    }`}
                  >
                    Drafts ({statistics.draftCourses})
                  </button>
                </div>

                {/* Error State */}
                {error && (
                  <div className="notification-error">
                    <p>Error loading courses: {error}</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-stakeados-gray-300">
                      Loading courses...
                    </p>
                  </div>
                )}

                {/* Courses Grid */}
                {!isLoading && getDisplayCourses().length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getDisplayCourses().map(course => (
                      <div key={course.id} className="relative">
                        <CourseCard
                          course={course}
                          showProgress={false}
                          showEnrollButton={false}
                        />
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => handleEdit(course.id)}
                            className="p-2 bg-stakeados-gray-800/90 hover:bg-stakeados-primary/20 rounded-gaming transition-colors"
                          >
                            <Edit className="w-4 h-4 text-stakeados-primary" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && getDisplayCourses().length === 0 && (
                  <div className="card-gaming text-center py-12">
                    <BookOpen className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
                      No Courses Found
                    </h3>
                    <p className="text-stakeados-gray-400 mb-6">
                      {activeTab === 'all'
                        ? 'Create your first course to get started'
                        : `No ${activeTab} courses available`}
                    </p>
                    {activeTab === 'all' && (
                      <button onClick={handleCreateNew} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Course
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
