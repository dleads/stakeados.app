import { createClient } from '@/lib/supabase/server';

export class MetricsServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  async recordPageView(page: string, userId?: string) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('page_views')
      .insert({
        page,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error recording page view:', error);
    }
  }

  async recordUserAction(action: string, userId: string, data?: any) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('user_actions')
      .insert({
        action,
        user_id: userId,
        data: data || {},
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error recording user action:', error);
    }
  }

  async getPageViewStats(days: number = 30) {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('page_views')
      .select('page, count')
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('count', { ascending: false });
    
    if (error) {
      console.error('Error fetching page view stats:', error);
      return [];
    }
    
    return data || [];
  }

  async getUserActionStats(userId: string, days: number = 30) {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('user_actions')
      .select('action, count')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('count', { ascending: false });
    
    if (error) {
      console.error('Error fetching user action stats:', error);
      return [];
    }
    
    return data || [];
  }
}

export const metricsServiceServer = new MetricsServiceServer();
