import { createClient } from '@/lib/supabase/client';
import type {
  ContentContribution,
  ContributorStats,
  ContributorAchievement,
  PointsAwardRequest,
  LeaderboardEntry,
  PointsBreakdown,
  CitizenshipProgress,
} from '@/types/gamification';

export class GamificationService {
  private supabase = createClient();

  /**
   * Award points for content contribution
   */
  async awardContentPoints(
    request: PointsAwardRequest
  ): Promise<ContentContribution | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'award_content_contribution_points' as any,
        {
          p_user_id: request.userId,
          p_content_id: request.contentId,
          p_content_type: request.contentType,
          p_contribution_type: request.contributionType,
          p_base_points:
            request.basePoints ||
            this.getBasePointsForActivity(request.contributionType),
          p_quality_score: request.qualityScore || 0,
        }
      );

      if (error) throw error;

      // Fetch the created contribution record
      const { data: contribution, error: fetchError } = await this.supabase
        .from('content_contributions' as any)
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      // Check citizenship eligibility after awarding points
      this.checkCitizenshipEligibilityAsync(request.userId);

      return this.mapContribution(contribution);
    } catch (error) {
      console.error('Error awarding content points:', error);
      return null;
    }
  }

  /**
   * Asynchronously check citizenship eligibility (non-blocking)
   */
  private async checkCitizenshipEligibilityAsync(
    userId: string
  ): Promise<void> {
    try {
      // Import citizenship service dynamically to avoid circular dependencies
      const { citizenshipService } = await import('./citizenshipService');
      await citizenshipService.checkAndUpdateCitizenshipStatus(userId);
    } catch (error) {
      console.error('Error checking citizenship eligibility:', error);
    }
  }

  /**
   * Get base points for different activity types
   */
  private getBasePointsForActivity(contributionType: string): number {
    const pointsMap: Record<string, number> = {
      author: 15,
      reviewer: 5,
      editor: 3,
      translator: 8,
    };
    return pointsMap[contributionType] || 0;
  }

  /**
   * Calculate quality-based bonus points
   */
  async calculateQualityBonus(
    contentId: string,
    contentType: string
  ): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc(
        'calculate_content_quality_score' as any,
        {
          p_content_id: contentId,
          p_content_type: contentType,
        }
      );

      if (error) throw error;

      const qualityScore = data as number;

      // Calculate bonus based on quality score
      if (qualityScore >= 4.5) return 10; // Excellent quality
      if (qualityScore >= 4.0) return 7; // High quality
      if (qualityScore >= 3.5) return 3; // Good quality
      return 0;
    } catch (error) {
      console.error('Error calculating quality bonus:', error);
      return 0;
    }
  }

  /**
   * Award points for article publication
   */
  async awardArticlePublicationPoints(
    articleId: string,
    authorId: string
  ): Promise<void> {
    try {
      // Base points for article publication
      await this.awardContentPoints({
        userId: authorId,
        contentId: articleId,
        contentType: 'article',
        contributionType: 'author',
        basePoints: 15,
      });

      // Check for quality bonus after some engagement time
      setTimeout(
        async () => {
          const qualityScore = await this.calculateQualityBonus(
            articleId,
            'article'
          );
          if (qualityScore >= 3.5) {
            await this.awardContentPoints({
              userId: authorId,
              contentId: articleId,
              contentType: 'article',
              contributionType: 'author',
              basePoints: Math.floor(qualityScore * 2), // Quality-based bonus
              qualityScore,
            });
          }
        },
        24 * 60 * 60 * 1000
      ); // Check after 24 hours
    } catch (error) {
      console.error('Error awarding article publication points:', error);
    }
  }

  /**
   * Award points for popular content (engagement milestones)
   */
  async awardPopularityBonus(
    contentId: string,
    contentType: string,
    authorId: string
  ): Promise<void> {
    try {
      const { data: interactions, error } = await this.supabase
        .from('content_interactions' as any)
        .select('interaction_type')
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;

      const viewCount =
        interactions?.filter((i: any) => i.interaction_type === 'view')
          .length || 0;
      const likeCount =
        interactions?.filter((i: any) => i.interaction_type === 'like')
          .length || 0;
      const shareCount =
        interactions?.filter((i: any) => i.interaction_type === 'share')
          .length || 0;

      let bonusPoints = 0;

      // Milestone-based bonuses
      if (viewCount >= 1000) bonusPoints += 10;
      if (viewCount >= 5000) bonusPoints += 20;
      if (likeCount >= 50) bonusPoints += 5;
      if (likeCount >= 100) bonusPoints += 10;
      if (shareCount >= 25) bonusPoints += 15;

      if (bonusPoints > 0) {
        await this.awardContentPoints({
          userId: authorId,
          contentId,
          contentType: contentType as 'article' | 'news',
          contributionType: 'author',
          basePoints: bonusPoints,
        });
      }
    } catch (error) {
      console.error('Error awarding popularity bonus:', error);
    }
  }

  /**
   * Award points for editorial contributions (reviews, editing)
   */
  async awardEditorialPoints(
    userId: string,
    contentId: string,
    contributionType: 'reviewer' | 'editor'
  ): Promise<void> {
    try {
      const basePoints = contributionType === 'reviewer' ? 5 : 3;

      await this.awardContentPoints({
        userId,
        contentId,
        contentType: 'proposal',
        contributionType,
        basePoints,
      });
    } catch (error) {
      console.error('Error awarding editorial points:', error);
    }
  }

  /**
   * Get contributor statistics
   */
  async getContributorStats(userId: string): Promise<ContributorStats | null> {
    try {
      const { data, error } = await this.supabase
        .from('contributor_stats' as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return this.mapContributorStats(data);
    } catch (error) {
      console.error('Error fetching contributor stats:', error);
      return null;
    }
  }

  /**
   * Get user's content contributions
   */
  async getUserContributions(
    userId: string,
    limit = 20
  ): Promise<ContentContribution[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_contributions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapContribution) || [];
    } catch (error) {
      console.error('Error fetching user contributions:', error);
      return [];
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('contributor_stats' as any)
        .select(
          `
          *,
          profiles!inner(id, name, avatar_url),
          contributor_achievements(*)
        `
        )
        .order('total_content_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapLeaderboardEntry) || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Check and award achievements
   */
  async checkAndAwardAchievements(
    userId: string
  ): Promise<ContributorAchievement[]> {
    try {
      const stats = await this.getContributorStats(userId);
      if (!stats) return [];

      const newAchievements: ContributorAchievement[] = [];
      const achievementDefinitions = this.getAchievementDefinitions();

      for (const definition of achievementDefinitions) {
        const hasAchievement = await this.hasAchievement(
          userId,
          definition.type
        );
        if (hasAchievement) continue;

        const meetsRequirements = this.checkAchievementRequirements(
          stats,
          definition.requirements
        );
        if (meetsRequirements) {
          const achievement = await this.awardAchievement(userId, definition);
          if (achievement) newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get citizenship progress
   */
  async getCitizenshipProgress(
    userId: string
  ): Promise<CitizenshipProgress | null> {
    try {
      const stats = await this.getContributorStats(userId);
      if (!stats) return null;

      // Citizenship requirements (these should be configurable)
      const requirements = {
        contentPoints: 100,
        articles: 5,
        qualityScore: 3.5,
        reviews: 3,
      };

      const progress: CitizenshipProgress = {
        userId,
        totalContentPoints: stats.totalContentPoints,
        requiredContentPoints: requirements.contentPoints,
        articlesPublished: stats.totalArticles,
        requiredArticles: requirements.articles,
        averageQualityScore: stats.averageQualityScore,
        requiredQualityScore: requirements.qualityScore,
        reviewsCompleted: stats.totalReviews,
        requiredReviews: requirements.reviews,
        isEligible: false,
        progressPercentage: 0,
        nextMilestone: {
          requirement: '',
          current: 0,
          target: 0,
          pointsValue: 0,
        },
      };

      // Check eligibility
      progress.isEligible =
        progress.totalContentPoints >= progress.requiredContentPoints &&
        progress.articlesPublished >= progress.requiredArticles &&
        progress.averageQualityScore >= progress.requiredQualityScore &&
        progress.reviewsCompleted >= progress.requiredReviews;

      // Calculate progress percentage
      const progressFactors = [
        progress.totalContentPoints / progress.requiredContentPoints,
        progress.articlesPublished / progress.requiredArticles,
        progress.averageQualityScore / progress.requiredQualityScore,
        progress.reviewsCompleted / progress.requiredReviews,
      ];
      progress.progressPercentage = Math.min(
        100,
        Math.round(
          (progressFactors.reduce(
            (sum, factor) => sum + Math.min(1, factor),
            0
          ) /
            progressFactors.length) *
            100
        )
      );

      // Find next milestone
      if (!progress.isEligible) {
        const milestones = [
          {
            requirement: 'Content Points',
            current: progress.totalContentPoints,
            target: progress.requiredContentPoints,
            pointsValue:
              progress.requiredContentPoints - progress.totalContentPoints,
          },
          {
            requirement: 'Articles Published',
            current: progress.articlesPublished,
            target: progress.requiredArticles,
            pointsValue:
              (progress.requiredArticles - progress.articlesPublished) * 15,
          },
          {
            requirement: 'Reviews Completed',
            current: progress.reviewsCompleted,
            target: progress.requiredReviews,
            pointsValue:
              (progress.requiredReviews - progress.reviewsCompleted) * 5,
          },
        ].filter(m => m.current < m.target);

        if (milestones.length > 0) {
          progress.nextMilestone = milestones[0];
        }
      }

      return progress;
    } catch (error) {
      console.error('Error getting citizenship progress:', error);
      return null;
    }
  }

  /**
   * Get points breakdown for a user
   */
  async getPointsBreakdown(userId: string): Promise<PointsBreakdown | null> {
    try {
      const contributions = await this.getUserContributions(userId, 100);

      const breakdown = contributions.reduce(
        (acc, contrib) => {
          acc.basePoints += contrib.basePoints;
          acc.qualityBonus += contrib.bonusPoints;
          acc.breakdown.push({
            source: `${contrib.contributionType} - ${contrib.contentType}`,
            points: contrib.totalPoints,
            description: `${contrib.contributionType} contribution`,
          });
          return acc;
        },
        {
          basePoints: 0,
          qualityBonus: 0,
          popularityBonus: 0,
          streakBonus: 0,
          totalPoints: 0,
          breakdown: [] as Array<{
            source: string;
            points: number;
            description: string;
          }>,
        }
      );

      breakdown.totalPoints =
        breakdown.basePoints +
        breakdown.qualityBonus +
        breakdown.popularityBonus +
        breakdown.streakBonus;

      return breakdown;
    } catch (error) {
      console.error('Error getting points breakdown:', error);
      return null;
    }
  }

  // Private helper methods
  private mapContribution(data: any): ContentContribution {
    return {
      id: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      contentType: data.content_type,
      contributionType: data.contribution_type,
      basePoints: data.base_points,
      bonusPoints: data.bonus_points,
      totalPoints: data.total_points,
      qualityScore: data.quality_score,
      engagementMetrics: data.engagement_metrics || {},
      awardedAt: new Date(data.awarded_at),
      metadata: data.metadata || {},
    };
  }

  private mapContributorStats(data: any): ContributorStats {
    return {
      userId: data.user_id,
      totalArticles: data.total_articles,
      totalReviews: data.total_reviews,
      totalTranslations: data.total_translations,
      totalContentPoints: data.total_content_points,
      averageQualityScore: data.average_quality_score,
      totalViews: data.total_views,
      totalLikes: data.total_likes,
      totalShares: data.total_shares,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastContributionAt: data.last_contribution_at
        ? new Date(data.last_contribution_at)
        : undefined,
      rankPosition: data.rank_position,
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapLeaderboardEntry(data: any): LeaderboardEntry {
    return {
      userId: data.user_id,
      userName: data.profiles.name,
      userAvatar: data.profiles.avatar_url,
      totalPoints: data.total_content_points,
      totalArticles: data.total_articles,
      averageQualityScore: data.average_quality_score,
      rankPosition: data.rank_position || 0,
      achievements:
        data.contributor_achievements?.map(this.mapAchievement) || [],
    };
  }

  private mapAchievement(data: any): ContributorAchievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementType: data.achievement_type,
      achievementName: data.achievement_name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      pointsThreshold: data.points_threshold,
      contentCountThreshold: data.content_count_threshold,
      qualityThreshold: data.quality_threshold,
      earnedAt: new Date(data.earned_at),
      metadata: data.metadata || {},
    };
  }

  private async hasAchievement(
    userId: string,
    achievementType: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('contributor_achievements' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', achievementType)
      .single();

    return !error && !!data;
  }

  private checkAchievementRequirements(
    stats: ContributorStats,
    requirements: any
  ): boolean {
    if (
      requirements.pointsThreshold &&
      stats.totalContentPoints < requirements.pointsThreshold
    )
      return false;
    if (
      requirements.contentCountThreshold &&
      stats.totalArticles < requirements.contentCountThreshold
    )
      return false;
    if (
      requirements.qualityThreshold &&
      stats.averageQualityScore < requirements.qualityThreshold
    )
      return false;
    return true;
  }

  private async awardAchievement(
    userId: string,
    definition: any
  ): Promise<ContributorAchievement | null> {
    try {
      const { data, error } = await this.supabase
        .from('contributor_achievements' as any)
        .insert({
          user_id: userId,
          achievement_type: definition.type,
          achievement_name: definition.name,
          description: definition.description,
          icon: definition.icon,
          color: definition.color,
          points_threshold: definition.requirements.pointsThreshold,
          content_count_threshold:
            definition.requirements.contentCountThreshold,
          quality_threshold: definition.requirements.qualityThreshold,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapAchievement(data);
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  private getAchievementDefinitions() {
    return [
      {
        type: 'first_article',
        name: 'First Contribution',
        description: 'Published your first article',
        icon: 'edit',
        color: '#00FF88',
        requirements: { contentCountThreshold: 1 },
      },
      {
        type: 'prolific_writer',
        name: 'Prolific Writer',
        description: 'Published 10 articles',
        icon: 'book',
        color: '#FFD93D',
        requirements: { contentCountThreshold: 10 },
      },
      {
        type: 'quality_contributor',
        name: 'Quality Contributor',
        description: 'Maintain 4.0+ average quality score',
        icon: 'star',
        color: '#FF6B6B',
        requirements: { qualityThreshold: 4.0, contentCountThreshold: 5 },
      },
      {
        type: 'content_master',
        name: 'Content Master',
        description: 'Earned 500+ content points',
        icon: 'trophy',
        color: '#6BCF7F',
        requirements: { pointsThreshold: 500 },
      },
      {
        type: 'helpful_reviewer',
        name: 'Helpful Reviewer',
        description: 'Completed 25 content reviews',
        icon: 'check-circle',
        color: '#4ECDC4',
        requirements: { contentCountThreshold: 25 },
      },
    ];
  }
}

export const gamificationService = new GamificationService();
