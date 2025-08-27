import { supabase } from './client';
import { withCache, apiCache } from '@/lib/cache';
import type { Database } from './types';
import type { Locale } from '@/types';
import { getCurrentUser } from './auth';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

// Course content structure
export interface CourseContent {
  id: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'video';
  title: Record<Locale, string>;
  content: Record<Locale, string>;
  order: number;
  duration?: number; // in minutes
  isRequired: boolean;
  prerequisites?: string[];
}

export interface CourseStructure {
  modules: Array<{
    id: string;
    title: Record<Locale, string>;
    description: Record<Locale, string>;
    order: number;
    content: CourseContent[];
  }>;
  totalDuration: number;
  totalContent: number;
}

export interface CourseWithProgress extends Course {
  progress?: {
    completedContent: number;
    totalContent: number;
    percentage: number;
    lastAccessed?: Date;
  };
}
// Get all published courses
const _getPublishedCourses = async (
  userId?: string
): Promise<CourseWithProgress[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published courses:', error);
    throw error;
  }

  // Add progress information if user is provided
  if (userId && data) {
    const coursesWithProgress = await Promise.all(
      (data as any[]).map(async (course: any) => {
        const progress = await getCourseProgress(userId, course.id);
        return {
          ...(course as any),
          progress,
        };
      })
    );
    return coursesWithProgress as any;
  }

  return data || [];
};

// Cached version of getPublishedCourses
export const getPublishedCourses = withCache(
  _getPublishedCourses,
  apiCache,
  userId => `published_courses_${userId || 'anonymous'}`
);
// Get all courses (including unpublished) for admin
export const getAllCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all courses:', error);
    throw error;
  }

  return data;
};

// Get course by ID
export const getCourseById = async (
  id: string,
  userId?: string
): Promise<CourseWithProgress | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    throw error;
  }

  if (!data) return null;

  // Add progress information if user is provided
  if (userId) {
    const progress = await getCourseProgress(userId, data.id);
    return {
      ...(data as any),
      progress: progress as any,
    };
  }

  return data;
};

// Get course progress for a user
export const getCourseProgress = async (userId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error fetching course progress:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return {
      completedContent: 0,
      totalContent: 10, // This should come from course structure
      percentage: 0,
    };
  }

  const completedContent = data.filter((p: any) => p.completed_at).length;
  const totalContent = 10; // This should come from course structure
  const percentage = Math.round((completedContent / totalContent) * 100);
  const lastAccessed = data.reduce((latest, current) => {
    const currentDate = new Date((current as any).created_at || 0);
    return currentDate > latest ? currentDate : latest;
  }, new Date(0));

  return {
    completedContent,
    totalContent,
    percentage,
    lastAccessed,
  };
};

// Get courses by difficulty
export const getCoursesByDifficulty = async (
  difficulty: 'basic' | 'intermediate' | 'advanced'
) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('difficulty', difficulty)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses by difficulty:', error);
    throw error;
  }

  return data;
};

// Get courses by category/tag
export const getCoursesByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses by category:', error);
    throw error;
  }

  // Filter by category in title or description (simple implementation)
  const filtered = data?.filter((course: any) => {
    const titleEn =
      (course.title as Record<string, string>).en?.toLowerCase() || '';
    const titleEs =
      (course.title as Record<string, string>).es?.toLowerCase() || '';
    const descEn =
      (course.description as Record<string, string>).en?.toLowerCase() || '';
    const descEs =
      (course.description as Record<string, string>).es?.toLowerCase() || '';

    const searchTerm = category.toLowerCase();
    return (
      titleEn.includes(searchTerm) ||
      titleEs.includes(searchTerm) ||
      descEn.includes(searchTerm) ||
      descEs.includes(searchTerm)
    );
  });

  return filtered || [];
};

// Search courses
export const searchCourses = async (
  query: string,
  filters?: {
    difficulty?: string;
    published?: boolean;
  }
) => {
  let queryBuilder = supabase.from('courses').select('*');

  if (filters?.published !== undefined) {
    queryBuilder = queryBuilder.eq('is_published', filters.published);
  }

  if (filters?.difficulty) {
    queryBuilder = queryBuilder.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await queryBuilder.order('created_at', {
    ascending: false,
  });

  if (error) {
    console.error('Error searching courses:', error);
    throw error;
  }

  if (!query.trim()) {
    return data || [];
  }

  // Filter by search query
  const filtered = data?.filter((course: any) => {
    const titleEn =
      (course.title as Record<string, string>).en?.toLowerCase() || '';
    const titleEs =
      (course.title as Record<string, string>).es?.toLowerCase() || '';
    const descEn =
      (course.description as Record<string, string>).en?.toLowerCase() || '';
    const descEs =
      (course.description as Record<string, string>).es?.toLowerCase() || '';

    const searchTerm = query.toLowerCase();
    return (
      titleEn.includes(searchTerm) ||
      titleEs.includes(searchTerm) ||
      descEn.includes(searchTerm) ||
      descEs.includes(searchTerm)
    );
  });

  return filtered || [];
};

// Create a new course (admin only)
export const createCourse = async (course: CourseInsert) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to create courses');
  }

  const { data, error } = await supabase
    .from('courses')
    .insert(course as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    throw error;
  }

  return data;
};

// Update course (admin only)
export const updateCourse = async (id: string, updates: CourseUpdate) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to update courses');
  }

  const { data, error } = await supabase
    .from('courses')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }

  return data;
};

// Delete course (admin only)
export const deleteCourse = async (id: string) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to delete courses');
  }

  const { error } = await supabase.from('courses').delete().eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Publish/unpublish course
export const toggleCoursePublication = async (
  id: string,
  isPublished: boolean
) => {
  return updateCourse(id, { published: isPublished } as any);
};

// Get course statistics
export const getCourseStatistics = async (courseId: string) => {
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('user_progress')
    .select('user_id')
    .eq('course_id', courseId);

  if (enrollmentError) {
    console.error('Error fetching course statistics:', enrollmentError);
    return {
      totalEnrollments: 0,
      completions: 0,
      averageProgress: 0,
    };
  }

  const uniqueUsers = new Set((enrollments as any[])?.map((e: any) => e.user_id) || []);
  const totalEnrollments = uniqueUsers.size;

  // Get completions (users who completed all content)
  const { data: completions } = await supabase
    .from('user_progress')
    .select('user_id')
    .eq('course_id', courseId)
    .not('completed_at', 'is', null);

  const completionCount = new Set((completions as any[])?.map((c: any) => c.user_id) || []).size;

  return {
    totalEnrollments,
    completions: completionCount,
    averageProgress:
      totalEnrollments > 0
        ? Math.round((completionCount / totalEnrollments) * 100)
        : 0,
  };
};

// Helper function to get localized course title
export const getCourseTitle = (
  course: Course,
  locale: Locale = 'en'
): string => {
  const title = course.title as Record<Locale, string>;
  return title[locale] || title.en || 'Untitled Course';
};

// Helper function to get localized course description
export const getCourseDescription = (
  course: Course,
  locale: Locale = 'en'
): string => {
  const description = course.description as Record<Locale, string>;
  return description[locale] || description.en || 'No description available';
};

// Helper function to format course duration
export const formatCourseDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

// Helper function to get difficulty color
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'basic':
      return 'text-stakeados-primary';
    case 'intermediate':
      return 'text-stakeados-blue';
    case 'advanced':
      return 'text-stakeados-purple';
    default:
      return 'text-stakeados-gray-300';
  }
};

// Helper function to get difficulty badge class
export const getDifficultyBadgeClass = (difficulty: string): string => {
  switch (difficulty) {
    case 'basic':
      return 'bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30';
    case 'intermediate':
      return 'bg-stakeados-blue/20 text-stakeados-blue border-stakeados-blue/30';
    case 'advanced':
      return 'bg-stakeados-purple/20 text-stakeados-purple border-stakeados-purple/30';
    default:
      return 'bg-stakeados-gray-700 text-stakeados-gray-300 border-stakeados-gray-600';
  }
};
// Get user's enrolled courses
export const getUserEnrolledCourses = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      `
      course_id,
      courses (*)
    `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user enrolled courses:', error);
    throw error;
  }

  // Extract unique courses
  const uniqueCourses = data
    .map((item: any) => item.courses)
    .filter(
      (course, index, self) =>
        course && self.findIndex(c => c?.id === course.id) === index
    );

  return uniqueCourses;
};

// Enroll user in course
export const enrollUserInCourse = async (userId: string, courseId: string) => {
  // Check if already enrolled
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { alreadyEnrolled: true };
  }

  // Create initial progress entry
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      content_id: 'enrollment',
      created_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error enrolling user in course:', error);
    throw error;
  }

  return { data, alreadyEnrolled: false };
};

// Get course completion percentage for user
export const getCourseCompletionPercentage = async (
  userId: string,
  courseId: string
) => {
  // This is a simplified version - in a real implementation, you'd need to know
  // the total number of content items in a course
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .not('completed_at', 'is', null);

  if (error) {
    console.error('Error fetching course completion:', error);
    return 0;
  }

  // For now, return a simple count - this should be enhanced with actual course structure
  return data.length;
};
