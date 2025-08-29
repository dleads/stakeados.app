import { createClient } from '@/lib/supabase/server';
import type { CitizenshipProgress } from '@/types/gamification';

export class GamificationServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  async getCitizenshipProgress(userId: string): Promise<CitizenshipProgress> {
    const supabase = await this.getSupabase();
    
    // Get user's total contributions
    const { data: contributions, error: contributionsError } = await supabase
      .from('user_contributions')
      .select('*')
      .eq('user_id', userId);
    
    if (contributionsError) {
      console.error('Error fetching user contributions:', contributionsError);
      return {
        level: 1,
        points: 0,
        nextLevelPoints: 100,
        progress: 0
      };
    }
    
    const totalPoints = contributions?.reduce((sum, contribution) => sum + (contribution.points || 0), 0) || 0;
    
    // Calculate level based on points
    const level = Math.floor(totalPoints / 100) + 1;
    const nextLevelPoints = level * 100;
    const progress = ((totalPoints % 100) / 100) * 100;
    
    return {
      level,
      points: totalPoints,
      nextLevelPoints,
      progress
    };
  }

  async getUserContributions(userId: string) {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('user_contributions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user contributions:', error);
      return [];
    }
    
    return data || [];
  }

  async checkAndAwardAchievements(userId: string) {
    const supabase = await this.getSupabase();
    
    // Get user's current achievements
    const { data: currentAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    
    if (achievementsError) {
      console.error('Error fetching user achievements:', achievementsError);
      return;
    }
    
    const earnedAchievementIds = currentAchievements?.map(a => a.achievement_id) || [];
    
    // Check for new achievements based on user activity
    // This is a simplified implementation
    const { data: contributions } = await supabase
      .from('user_contributions')
      .select('*')
      .eq('user_id', userId);
    
    const totalContributions = contributions?.length || 0;
    
    // Award "First Contribution" achievement
    if (totalContributions >= 1 && !earnedAchievementIds.includes('first_contribution')) {
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: 'first_contribution',
          earned_at: new Date().toISOString()
        });
    }
    
    // Award "Contributor" achievement
    if (totalContributions >= 10 && !earnedAchievementIds.includes('contributor')) {
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: 'contributor',
          earned_at: new Date().toISOString()
        });
    }
  }
}

export const gamificationServiceServer = new GamificationServiceServer();
