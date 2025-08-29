import { createClient } from '@/lib/supabase/server';

export class NotificationServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  async createNotification(userId: string, type: string, title: string, message: string, data?: any) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false
      });
    
    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit = 50) {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
    
    return data || [];
  }

  async markAsRead(notificationId: string) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export const notificationServiceServer = new NotificationServiceServer();
