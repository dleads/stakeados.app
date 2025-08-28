import { createAnonClient } from './anon';
import { createClient as createServerClient } from './server';
import type { Database } from './types';
import { mintCertificate } from '@/lib/web3/nft';
import type { Address } from 'viem';

type UserProgress = Database['public']['Tables']['user_progress']['Row'];
type UserProgressInsert =
  Database['public']['Tables']['user_progress']['Insert'];
// type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update'];

// Get points for a specific activity from the gamification_rules table
const getPointsForActivity = async (activityType: string): Promise<number> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('gamification_rules' as any)
    .select('points')
    .eq('activity_type', activityType)
    .single();

  if (error || !data) {
    console.error(`Error fetching points for ${activityType}:`, error);
    return 0;
  }

  return (data as any)?.points || 0;
};

// Get user's progress for a specific course
export const getUserCourseProgress = async (
  userId: string,
  courseId: string
) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user course progress:', error);
    throw error;
  }

  return data;
};

// Get all user progress
export const getUserProgress = async (userId: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      `
      *,
      courses (
        id,
        title,
        difficulty,
        estimated_time
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }

  return data;
};

// Create or update progress entry
export const upsertProgress = async (progress: UserProgressInsert) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(progress as any, {
      onConflict: 'user_id,course_id,content_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting progress:', error);
    throw error;
  }

  return data;
};

// Mark content as completed
export const markContentCompleted = async (
  userId: string,
  courseId: string,
  contentId: string,
  score?: number
) => {
  const progressData: UserProgressInsert = {
    user_id: userId,
    course_id: courseId,
    content_id: contentId,
    completed_at: new Date().toISOString(),
    score,
  };

  return upsertProgress(progressData);
};

// Mark lesson/content as completed with automatic certificate minting
export const markContentCompletedWithRewards = async (
  userId: string,
  courseId: string,
  contentId: string,
  score?: number
) => {
  const progressData: UserProgressInsert = {
    user_id: userId,
    course_id: courseId,
    content_id: contentId,
    completed_at: new Date().toISOString(),
    score,
  };

  const result = await upsertProgress(progressData);

  // Check if course is now complete and mint certificate if needed
  const courseProgress = await getUserCourseProgress(userId, courseId);
  const isComplete = await checkCourseCompletion(
    userId,
    courseId,
    courseProgress as any
  );

  if (isComplete) {
    await handleCourseCompletion(userId, courseId, courseProgress as any);
  }

  return result;
};

// Check if course is complete based on progress
export const checkCourseCompletion = async (
  userId: string,
  courseId: string,
  progressData?: UserProgress[]
): Promise<boolean> => {
  const progress =
    progressData || (await getUserCourseProgress(userId, courseId));

  // Get course structure (simplified - in production this would come from course content)
  const requiredContent = await getCourseRequiredContent(courseId);
  const completedContent = (progress as any[])
    .filter((p: any) => p.completed_at)
    .map((p: any) => p.content_id);

  // Check if all required content is completed
  return requiredContent.every(contentId =>
    completedContent.includes(contentId)
  );
};

// Get required content for course completion
export const getCourseRequiredContent = async (
  _courseId: string
): Promise<string[]> => {
  // This is a simplified implementation
  // In production, this would fetch from a course_content table
  const defaultContent = [
    'lesson-1',
    'lesson-2',
    'lesson-3',
    'lesson-4',
    'lesson-5',
    'quiz-1',
    'quiz-2',
    'assignment-1',
    'final-exam',
  ];

  return defaultContent;
};

// Handle course completion with certificate minting
export const handleCourseCompletion = async (
  userId: string,
  courseId: string,
  progressData: UserProgress[]
) => {
  try {
    // Get user profile with wallet address
    const supabase = createAnonClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (!(profile as any)?.wallet_address) {
      console.warn('User has no wallet address, cannot mint certificate');
      return;
    }

    // Get course information
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (!course) {
      console.error('Course not found for certificate minting');
      return;
    }

    // Calculate average score
    const scores = progressData
      .filter(p => p.score !== null)
      .map(p => p.score!);
    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          )
        : 85; // Default score

    // Get course title for certificate
    const courseTitle =
      typeof (course as any).title === 'object'
        ? ((course as any).title as any).en || 'Course'
        : 'Course';

    // Mint certificate NFT
    const mintResult = await mintCertificate(
      (profile as any).wallet_address as Address,
      courseId,
      courseTitle,
      averageScore,
      (course as any).difficulty as 'basic' | 'intermediate' | 'advanced'
    );

    if (mintResult.success) {
      console.log('Certificate minted successfully for course completion');
    } else {
      console.error('Failed to mint certificate:', mintResult.error);
    }
  } catch (error) {
    console.error('Error handling course completion:', error);
  }
};

// Get detailed progress analytics for a user
export const getUserProgressAnalytics = async (userId: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      `
      *,
      courses (
        id,
        title,
        difficulty,
        estimated_time
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user progress analytics:', error);
    throw error;
  }

  // Calculate analytics
  const analytics = {
    totalActivities: data.length,
    completedActivities: (data as any[]).filter((p: any) => p.completed_at)
      .length,
    averageScore: 0,
    timeSpent: 0, // This would be calculated from actual time tracking
    coursesStarted: new Set((data as any[]).map((p: any) => p.course_id)).size,
    coursesCompleted: 0,
    difficultyBreakdown: {
      basic: 0,
      intermediate: 0,
      advanced: 0,
    },
    recentActivity: data.slice(0, 10),
    streakDays: 0, // This would be calculated from daily activity
  };

  // Calculate average score
  const scores = (data as any[])
    .filter((p: any) => p.score !== null)
    .map((p: any) => p.score!);
  if (scores.length > 0) {
    analytics.averageScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  }

  // Calculate difficulty breakdown
  (data as any[]).forEach((progress: any) => {
    if (progress.courses && progress.completed_at) {
      const difficulty = (progress.courses as any)
        .difficulty as keyof typeof analytics.difficultyBreakdown;
      if (analytics.difficultyBreakdown[difficulty] !== undefined) {
        analytics.difficultyBreakdown[difficulty]++;
      }
    }
  });

  return analytics;
};

// Get learning streak for user
export const getUserLearningStreak = async (
  userId: string
): Promise<number> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('created_at, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error || !data) {
    return 0;
  }

  // Calculate consecutive days with activity
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDates = (data as any[]).map((item: any) => {
    const date = new Date(item.completed_at!);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);

  for (const dateTime of uniqueDates) {
    const activityDate = new Date(dateTime);
    const daysDiff = Math.floor(
      (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff === streak + 1) {
      // Allow for today not having activity yet
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Get weekly progress summary
export const getWeeklyProgressSummary = async (userId: string) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching weekly progress:', error);
    return {
      activitiesThisWeek: 0,
      completionsThisWeek: 0,
      pointsEarned: 0,
      dailyActivity: [],
    };
  }

  const completions = (data as any[]).filter((p: any) => p.completed_at);

  // Group by day
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayActivities = (data as any[]).filter((p: any) => {
      const activityDate = new Date(p.created_at || 0);
      return activityDate >= date && activityDate < nextDay;
    });

    dailyActivity.push({
      date: date.toISOString().split('T')[0],
      activities: dayActivities.length,
      completions: dayActivities.filter((p: any) => p.completed_at).length,
    });
  }

  return {
    activitiesThisWeek: data.length,
    completionsThisWeek: completions.length,
    pointsEarned: completions.length * 5, // Simplified points calculation
    dailyActivity,
  };
};

// Get completion statistics for a user
export const getUserCompletionStats = async (userId: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      `
      course_id,
      completed_at,
      courses (
        difficulty
      )
    `
    )
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  if (error) {
    console.error('Error fetching completion stats:', error);
    throw error;
  }

  // Calculate statistics
  const stats = {
    totalCompleted: data.length,
    basicCompleted: 0,
    intermediateCompleted: 0,
    advancedCompleted: 0,
    uniqueCoursesCompleted: new Set<string>(),
  };

  (data as any[]).forEach((progress: any) => {
    if (progress.courses) {
      stats.uniqueCoursesCompleted.add(progress.course_id);

      switch ((progress.courses as any).difficulty) {
        case 'basic':
          stats.basicCompleted++;
          break;
        case 'intermediate':
          stats.intermediateCompleted++;
          break;
        case 'advanced':
          stats.advancedCompleted++;
          break;
      }
    }
  });

  return {
    ...stats,
    uniqueCoursesCount: stats.uniqueCoursesCompleted.size,
  };
};

// Check if user has completed a specific course
export const hasCourseCompleted = async (userId: string, courseId: string) => {
  // This is a simplified check - in a real implementation, you'd need to know
  // the total number of content items in a course and check if all are completed
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('content_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .not('completed_at', 'is', null);

  if (error) {
    console.error('Error checking course completion:', error);
    return false;
  }

  // For now, consider a course completed if user has any completed content
  // This should be enhanced with actual course structure validation
  return data.length > 0;
};

// Get leaderboard data
export const getLeaderboard = async (limit: number = 10) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, total_points, is_genesis')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return data;
};

// Get user's rank in leaderboard
export const getUserRank = async (userId: string) => {
  const supabase = createAnonClient();
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Error fetching user profile for rank:', userError);
    return null;
  }

  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_points', (userProfile as any).total_points);

  if (countError) {
    console.error('Error fetching user rank:', countError);
    return null;
  }

  return (count || 0) + 1;
};

// Award points for various activities
export const awardActivityPoints = async (
  userId: string,
  activityType: string,
  _metadata?: any
) => {
  const pointsToAdd = await getPointsForActivity(activityType);

  if (pointsToAdd === 0) {
    console.warn(`No points configured for activity: ${activityType}`);
    return 0;
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      total_points: (supabase as any).raw(`total_points + ${pointsToAdd}`),
    } as any)
    .eq('id', userId);

  if (error) {
    console.error('Error awarding activity points:', error);
    throw error;
  }

  return pointsToAdd;
};

// Get user achievements
export const getUserAchievements = async (userId: string) => {
  const supabase = createAnonClient();
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: articles } = await supabase
    .from('articles')
    .select('status')
    .eq('author_id', userId);

  if (!progress || !profile) return [];

  const achievements = [];
  const completedCourses = new Set(
    (progress as any[])
      .filter((p: any) => p.completed_at)
      .map((p: any) => p.course_id)
  ).size;
  const totalPoints = (profile as any).total_points || 0;
  const publishedArticles =
    (articles as any[])?.filter((a: any) => a.status === 'published').length || 0;

  // Course achievements
  if (completedCourses >= 1)
    achievements.push({
      id: 'first_course',
      name: 'First Course',
      description: 'Complete your first course',
      earned: true,
    });
  if (completedCourses >= 5)
    achievements.push({
      id: 'course_enthusiast',
      name: 'Course Enthusiast',
      description: 'Complete 5 courses',
      earned: true,
    });
  if (completedCourses >= 10)
    achievements.push({
      id: 'learning_master',
      name: 'Learning Master',
      description: 'Complete 10 courses',
      earned: true,
    });

  // Points achievements
  if (totalPoints >= 100)
    achievements.push({
      id: 'point_collector',
      name: 'Point Collector',
      description: 'Earn 100 points',
      earned: true,
    });
  if (totalPoints >= 500)
    achievements.push({
      id: 'point_master',
      name: 'Point Master',
      description: 'Earn 500 points',
      earned: true,
    });
  if (totalPoints >= 1000)
    achievements.push({
      id: 'point_legend',
      name: 'Point Legend',
      description: 'Earn 1000 points',
      earned: true,
    });

  // Article achievements
  if (publishedArticles >= 1)
    achievements.push({
      id: 'first_article',
      name: 'First Article',
      description: 'Publish your first article',
      earned: true,
    });
  if (publishedArticles >= 5)
    achievements.push({
      id: 'content_creator',
      name: 'Content Creator',
      description: 'Publish 5 articles',
      earned: true,
    });

  // Genesis achievement
  if ((profile as any).is_genesis)
    achievements.push({
      id: 'genesis_founder',
      name: 'Genesis Founder',
      description: 'Original founding member',
      earned: true,
    });

  return achievements;
};

// Check for new achievements
export const checkNewAchievements = async (
  userId: string,
  _activity: string
) => {
  const achievements = await getUserAchievements(userId);
  // This would typically compare against previously earned achievements
  // For now, return the current achievements
  return achievements;
};
// Get contributor statistics
export const getContributorStats = async (userId: string) => {
  const supabase = createAnonClient();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('status, created_at, published_at')
    .eq('author_id', userId);

  if (error) {
    console.error('Error fetching contributor stats:', error);
    return {
      totalArticles: 0,
      publishedArticles: 0,
      pendingArticles: 0,
      draftArticles: 0,
      contributorLevel: 'Newcomer',
    };
  }

  const stats = {
    totalArticles: articles.length,
    publishedArticles: (articles as any[]).filter((a: any) => a.status === 'published').length,
    pendingArticles: (articles as any[]).filter((a: any) => a.status === 'review').length,
    draftArticles: (articles as any[]).filter((a: any) => a.status === 'draft').length,
    contributorLevel: 'Newcomer' as string,
  };

  // Determine contributor level
  if (stats.publishedArticles >= 10) {
    stats.contributorLevel = 'Expert';
  } else if (stats.publishedArticles >= 5) {
    stats.contributorLevel = 'Advanced';
  } else if (stats.publishedArticles >= 1) {
    stats.contributorLevel = 'Contributor';
  }

  return stats;
};
