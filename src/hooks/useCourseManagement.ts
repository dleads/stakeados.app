'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  getPublishedCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCoursePublication,
  getCourseStatistics,
  searchCourses,
  getCoursesByDifficulty,
  enrollUserInCourse,
  type CourseWithProgress,
} from '@/lib/supabase/courses';
import type { Database } from '@/types/supabase';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

interface CourseManagementState {
  courses: CourseWithProgress[];
  currentCourse: CourseWithProgress | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  statistics: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
  };
}

export function useCourseManagement(isAdmin: boolean = false) {
  const { user } = useAuthContext();

  const [state, setState] = useState<CourseManagementState>({
    courses: [],
    currentCourse: null,
    isLoading: false,
    isSaving: false,
    error: null,
    success: null,
    statistics: {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalEnrollments: 0,
    },
  });

  // Load courses
  const loadCourses = useCallback(
    async (includeUnpublished: boolean = false) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        let courses: CourseWithProgress[];

        if (includeUnpublished && isAdmin) {
          const allCourses = await getAllCourses();
          courses = allCourses || [];
        } else {
          courses = await getPublishedCourses(user?.id);
        }

        // Calculate statistics
        const statistics = {
          totalCourses: courses.length,
          publishedCourses: courses.filter(c => c.published).length,
          draftCourses: courses.filter(c => !c.published).length,
          totalEnrollments: courses.reduce((sum, course) => {
            return sum + (course.progress ? 1 : 0);
          }, 0),
        };

        setState(prev => ({
          ...prev,
          courses,
          statistics,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to load courses',
        }));
      }
    },
    [isAdmin, user?.id]
  );

  // Load single course
  const loadCourse = useCallback(
    async (courseId: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const course = await getCourseById(courseId, user?.id);
        setState(prev => ({
          ...prev,
          currentCourse: course,
          isLoading: false,
        }));
        return course;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to load course',
        }));
        return null;
      }
    },
    [user?.id]
  );

  // Create course
  const createNewCourse = useCallback(
    async (courseData: CourseInsert) => {
      if (!isAdmin) {
        setState(prev => ({ ...prev, error: 'Admin access required' }));
        return null;
      }

      setState(prev => ({
        ...prev,
        isSaving: true,
        error: null,
        success: null,
      }));

      try {
        const newCourse = await createCourse(courseData);
        setState(prev => ({
          ...prev,
          isSaving: false,
          success: 'Course created successfully!',
        }));

        // Reload courses
        await loadCourses(true);
        return newCourse;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error ? error.message : 'Failed to create course',
        }));
        return null;
      }
    },
    [isAdmin, loadCourses]
  );

  // Update course
  const updateExistingCourse = useCallback(
    async (courseId: string, updates: CourseUpdate) => {
      if (!isAdmin) {
        setState(prev => ({ ...prev, error: 'Admin access required' }));
        return null;
      }

      setState(prev => ({
        ...prev,
        isSaving: true,
        error: null,
        success: null,
      }));

      try {
        const updatedCourse = await updateCourse(courseId, updates);
        setState(prev => ({
          ...prev,
          isSaving: false,
          success: 'Course updated successfully!',
          currentCourse:
            prev.currentCourse?.id === courseId
              ? updatedCourse
              : prev.currentCourse,
        }));

        // Reload courses
        await loadCourses(true);
        return updatedCourse;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error ? error.message : 'Failed to update course',
        }));
        return null;
      }
    },
    [isAdmin, loadCourses]
  );

  // Delete course
  const deleteCourseById = useCallback(
    async (courseId: string) => {
      if (!isAdmin) {
        setState(prev => ({ ...prev, error: 'Admin access required' }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isSaving: true,
        error: null,
        success: null,
      }));

      try {
        await deleteCourse(courseId);
        setState(prev => ({
          ...prev,
          isSaving: false,
          success: 'Course deleted successfully!',
          currentCourse:
            prev.currentCourse?.id === courseId ? null : prev.currentCourse,
        }));

        // Reload courses
        await loadCourses(true);
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error ? error.message : 'Failed to delete course',
        }));
        return false;
      }
    },
    [isAdmin, loadCourses]
  );

  // Toggle course publication
  const togglePublication = useCallback(
    async (courseId: string, isPublished: boolean) => {
      if (!isAdmin) {
        setState(prev => ({ ...prev, error: 'Admin access required' }));
        return null;
      }

      setState(prev => ({
        ...prev,
        isSaving: true,
        error: null,
        success: null,
      }));

      try {
        const updatedCourse = await toggleCoursePublication(
          courseId,
          isPublished
        );
        setState(prev => ({
          ...prev,
          isSaving: false,
          success: `Course ${isPublished ? 'published' : 'unpublished'} successfully!`,
        }));

        // Reload courses
        await loadCourses(true);
        return updatedCourse;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update course publication',
        }));
        return null;
      }
    },
    [isAdmin, loadCourses]
  );

  // Search courses
  const searchCoursesWithFilters = useCallback(
    async (
      query: string,
      filters?: { difficulty?: string; published?: boolean }
    ) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const results = await searchCourses(query, filters);
        setState(prev => ({
          ...prev,
          courses: results,
          isLoading: false,
        }));
        return results;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to search courses',
        }));
        return [];
      }
    },
    []
  );

  // Filter courses by difficulty
  const filterByDifficulty = useCallback(
    async (difficulty: 'basic' | 'intermediate' | 'advanced') => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const results = await getCoursesByDifficulty(difficulty);
        setState(prev => ({
          ...prev,
          courses: results,
          isLoading: false,
        }));
        return results;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to filter courses',
        }));
        return [];
      }
    },
    []
  );

  // Enroll in course
  const enrollInCourse = useCallback(
    async (courseId: string) => {
      if (!user) {
        setState(prev => ({ ...prev, error: 'Must be logged in to enroll' }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isSaving: true,
        error: null,
        success: null,
      }));

      try {
        const result = await enrollUserInCourse(user.id, courseId);

        if (result.alreadyEnrolled) {
          setState(prev => ({
            ...prev,
            isSaving: false,
            success: 'Already enrolled in this course!',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isSaving: false,
            success: 'Successfully enrolled in course!',
          }));
        }

        // Reload courses to update progress
        await loadCourses(isAdmin);
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to enroll in course',
        }));
        return false;
      }
    },
    [user, isAdmin, loadCourses]
  );

  // Get course statistics
  const getCourseStats = useCallback(async (courseId: string) => {
    try {
      return await getCourseStatistics(courseId);
    } catch (error) {
      console.error('Error getting course statistics:', error);
      return {
        totalEnrollments: 0,
        completions: 0,
        averageProgress: 0,
      };
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Load courses on mount
  useEffect(() => {
    loadCourses(isAdmin);
  }, [loadCourses, isAdmin]);

  // Get courses by status
  const getPublishedCoursesList = useCallback(() => {
    return state.courses.filter(course => course.published);
  }, [state.courses]);

  const getDraftCoursesList = useCallback(() => {
    return state.courses.filter(course => !course.published);
  }, [state.courses]);

  // Get user's enrolled courses
  const getEnrolledCourses = useCallback(() => {
    return state.courses.filter(course => course.progress);
  }, [state.courses]);

  // Get course by ID from current state
  const getCourseFromState = useCallback(
    (courseId: string) => {
      return state.courses.find(course => course.id === courseId);
    },
    [state.courses]
  );

  return {
    // State
    ...state,

    // Actions
    loadCourses,
    loadCourse,
    createNewCourse,
    updateExistingCourse,
    deleteCourseById,
    togglePublication,
    searchCoursesWithFilters,
    filterByDifficulty,
    enrollInCourse,
    getCourseStats,
    clearMessages,

    // Computed values
    getPublishedCoursesList,
    getDraftCoursesList,
    getEnrolledCourses,
    getCourseFromState,

    // Status
    hasPermission: isAdmin,
    isAuthenticated: !!user,
  };
}
