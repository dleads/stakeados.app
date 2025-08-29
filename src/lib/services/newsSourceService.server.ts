import { createClient } from '@/lib/supabase/server';
import type { NewsSource } from '@/types/news';

export class NewsSourceServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  async getSourcesReadyForFetch(): Promise<NewsSource[]> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('active', true)
      .order('last_fetch', { ascending: true });
    
    if (error) {
      console.error('Error fetching news sources:', error);
      return [];
    }
    
    return data || [];
  }

  async updateSourceHealth(sourceId: string, status: 'healthy' | 'error', errorMessage?: string) {
    const supabase = await this.getSupabase();
    
    const updateData: any = {
      last_health_check: new Date().toISOString(),
      health_status: status
    };
    
    if (status === 'error' && errorMessage) {
      updateData.last_error = errorMessage;
    }
    
    const { error } = await supabase
      .from('news_sources')
      .update(updateData)
      .eq('id', sourceId);
    
    if (error) {
      console.error('Error updating source health:', error);
    }
  }

  async updateLastFetch(sourceId: string) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('news_sources')
      .update({
        last_fetch: new Date().toISOString()
      })
      .eq('id', sourceId);
    
    if (error) {
      console.error('Error updating last fetch:', error);
    }
  }
}

export const newsSourceServiceServer = new NewsSourceServiceServer();
