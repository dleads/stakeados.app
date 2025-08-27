export interface ContentContribution {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'article' | 'news' | 'proposal' | 'review';
  contributionType: 'author' | 'reviewer' | 'editor' | 'translator';
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  qualityScore: number;
  engagementMetrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    readingTime?: number;
  };
  awardedAt: Date;
  metadata: Record<string, any>;
}

export interface ContributorAchievement {
  id: string;
  userId: string;
  achievementType: string;
  achievementName: string;
  description: string;
  icon: string;
  color: string;
  pointsThreshold?: number;
  contentCountThreshold?: number;
  qualityThreshold?: number;
  earnedAt: Date;
  metadata: Record<string, any>;
}

export interface ContributorStats {
  userId: string;
  totalArticles: number;
  totalReviews: number;
  totalTranslations: number;
  totalContentPoints: number;
  averageQualityScore: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  currentStreak: number;
  longestStreak: number;
  lastContributionAt?: Date;
  rankPosition?: number;
  updatedAt: Date;
}

export interface ContentQualityMetrics {
  id: string;
  contentId: string;
  contentType: 'article' | 'news';
  qualityScore: number;
  readabilityScore: number;
  engagementRate: number;
  completionRate: number;
  socialShares: number;
  commentsCount: number;
  timeOnPage: number;
  bounceRate: number;
  calculatedAt: Date;
  updatedAt: Date;
}

export interface GamificationRule {
  activityType: string;
  points: number;
  description: string;
}

export interface PointsAwardRequest {
  userId: string;
  contentId: string;
  contentType: 'article' | 'news' | 'proposal' | 'review';
  contributionType: 'author' | 'reviewer' | 'editor' | 'translator';
  basePoints?: number;
  qualityScore?: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalPoints: number;
  totalArticles: number;
  averageQualityScore: number;
  rankPosition: number;
  achievements: ContributorAchievement[];
}

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: {
    pointsThreshold?: number;
    contentCountThreshold?: number;
    qualityThreshold?: number;
    streakThreshold?: number;
    engagementThreshold?: number;
  };
}

export interface PointsBreakdown {
  basePoints: number;
  qualityBonus: number;
  popularityBonus: number;
  streakBonus: number;
  totalPoints: number;
  breakdown: Array<{
    source: string;
    points: number;
    description: string;
  }>;
}

export interface ContributorProfile {
  user: {
    id: string;
    name: string;
    avatar?: string;
    joinedAt: Date;
  };
  stats: ContributorStats;
  achievements: ContributorAchievement[];
  recentContributions: ContentContribution[];
  qualityTrend: Array<{
    date: Date;
    qualityScore: number;
  }>;
}

export interface CitizenshipProgress {
  userId: string;
  totalContentPoints: number;
  requiredContentPoints: number;
  articlesPublished: number;
  requiredArticles: number;
  averageQualityScore: number;
  requiredQualityScore: number;
  reviewsCompleted: number;
  requiredReviews: number;
  isEligible: boolean;
  progressPercentage: number;
  nextMilestone: {
    requirement: string;
    current: number;
    target: number;
    pointsValue: number;
  };
}
