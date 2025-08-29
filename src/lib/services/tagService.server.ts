import { createClient } from '@/lib/supabase/server';

export class TagServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  async cleanupUnusedTags(): Promise<number> {
    const supabase = await this.getSupabase();
    
    // Get all tags that are not used in any article
    const { data: unusedTags, error } = await supabase
      .from('tags')
      .select('id')
      .not('id', 'in', (
        supabase
          .from('article_tags')
          .select('tag_id')
      ));
    
    if (error) {
      console.error('Error finding unused tags:', error);
      return 0;
    }
    
    if (!unusedTags || unusedTags.length === 0) {
      return 0;
    }
    
    // Delete unused tags
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .in('id', unusedTags.map(tag => tag.id));
    
    if (deleteError) {
      console.error('Error deleting unused tags:', deleteError);
      return 0;
    }
    
    return unusedTags.length;
  }
}

export const tagServiceServer = new TagServiceServer();
