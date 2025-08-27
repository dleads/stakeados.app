import { createClient } from '@/lib/supabase/client';
import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilters,
  NotificationStats,
  MarkNotificationReadRequest,
} from '@/types/notifications';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Acepta distintas variantes de generics del cliente de Supabase
type AnySupabaseClient = SupabaseClient<any, any, any, any>;

export class NotificationService {
  private supabase: AnySupabaseClient;

  constructor(supabase?: AnySupabaseClient) {
    // Usa el cliente inyectado (con contexto de sesión en rutas) o fallback al client-side
    this.supabase = (supabase as AnySupabaseClient) ?? (createClient() as unknown as AnySupabaseClient);
  }

  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters) {
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.isRead !== undefined) {
          query = query.eq('is_read', filters.isRead);
        }
        if (filters.dateRange) {
          query = query
            .gte('created_at', filters.dateRange.from.toISOString())
            .lte('created_at', filters.dateRange.to.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapDatabaseNotification);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async createNotification(
    request: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: request.userId,
          type: request.type,
          title: request.title,
          message: request.message,
          data: request.data || {},
          scheduled_for:
            request.scheduledFor?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async markNotificationsAsRead(
    userId: string,
    request: MarkNotificationReadRequest
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('id', request.notificationIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      // Get total and unread counts
      const { data: notifications, error: totalError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (totalError) throw totalError;

      const rows = notifications ?? [];
      const total = rows.length;
      const unread = rows.filter(n => !n.is_read).length;

      // Count by type
      const byType = rows.reduce(
        (acc: Record<string, number>, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const count = rows.filter(n =>
          (n.created_at ?? '').startsWith(dateStr)
        ).length;

        recentActivity.push({
          date: dateStr,
          count,
        });
      }

      return {
        total,
        unread,
        byType,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification stats');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async bulkCreateNotifications(
    requests: CreateNotificationRequest[]
  ): Promise<Notification[]> {
    try {
      const notifications = requests.map(request => ({
        user_id: request.userId,
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data || {},
        scheduled_for:
          request.scheduledFor?.toISOString() || new Date().toISOString(),
      }));

      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      return (data || []).map(this.mapDatabaseNotification);
    } catch (error) {
      console.error('Error bulk creating notifications:', error);
      throw new Error('Failed to create notifications');
    }
  }

  async updateDeliveryStatus(
    notificationId: string,
    deliveryType: 'in_app' | 'email' | 'push',
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      // Get current delivery status
      const { data: notification, error: fetchError } = await this.supabase
        .from('notifications')
        .select('delivery_status')
        .eq('id', notificationId)
        .single();

      if (fetchError) throw fetchError;

      const currentStatus: Record<string, string> =
        (notification?.delivery_status as Record<string, string>) || {};
      const updatedStatus = {
        ...currentStatus,
        [deliveryType]: status,
      };

      const { error } = await this.supabase
        .from('notifications')
        .update({ delivery_status: updatedStatus })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw new Error('Failed to update delivery status');
    }
  }

  async getPendingNotifications(
    deliveryType: 'in_app' | 'email' | 'push',
    limit: number = 100
  ): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .lte('scheduled_for', new Date().toISOString())
        .or(
          `delivery_status->${deliveryType}.eq.pending,delivery_status->${deliveryType}.is.null`
        )
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapDatabaseNotification);
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      throw new Error('Failed to fetch pending notifications');
    }
  }

  private mapDatabaseNotification(
    dbNotification: Database['public']['Tables']['notifications']['Row']
  ): Notification {
    // Normalize type to allowed literals
    const allowedTypes: Notification['type'][] = [
      'new_article',
      'new_news',
      'article_approved',
      'proposal_reviewed',
      'breaking_news',
    ];
    const rawType = (dbNotification.type || '').toString();
    const safeType: Notification['type'] = (allowedTypes as string[]).includes(rawType)
      ? (rawType as Notification['type'])
      : 'new_news';

    // Ensure title/message are objects with string values
    const safeTitle: Record<string, string> =
      dbNotification.title && typeof dbNotification.title === 'object' && !Array.isArray(dbNotification.title)
        ? (dbNotification.title as Record<string, string>)
        : {};

    const safeMessage: Record<string, string> =
      dbNotification.message && typeof dbNotification.message === 'object' && !Array.isArray(dbNotification.message)
        ? (dbNotification.message as Record<string, string>)
        : {};

    // Ensure data is an object
    const safeData: Record<string, any> =
      dbNotification.data && typeof dbNotification.data === 'object' && !Array.isArray(dbNotification.data)
        ? (dbNotification.data as Record<string, any>)
        : {};

    // Normalize delivery status
    const rawDelivery =
      dbNotification.delivery_status && typeof dbNotification.delivery_status === 'object' && !Array.isArray(dbNotification.delivery_status)
        ? (dbNotification.delivery_status as Record<string, any>)
        : {};
    const normalizeStatus = (s: any): 'pending' | 'sent' | 'failed' =>
      s === 'sent' || s === 'failed' ? s : 'pending';
    const safeDelivery = {
      in_app: normalizeStatus(rawDelivery.in_app),
      email: normalizeStatus(rawDelivery.email),
      push: normalizeStatus(rawDelivery.push),
    } as Notification['deliveryStatus'];

    return {
      id: dbNotification.id,
      userId: dbNotification.user_id || '',
      type: safeType,
      title: safeTitle,
      message: safeMessage,
      data: safeData,
      isRead: !!dbNotification.is_read,
      deliveryStatus: safeDelivery,
      scheduledFor: new Date(
        dbNotification.scheduled_for || dbNotification.created_at || new Date().toISOString()
      ),
      createdAt: new Date(
        dbNotification.created_at || dbNotification.scheduled_for || new Date().toISOString()
      ),
      readAt: dbNotification.read_at ? new Date(dbNotification.read_at) : undefined,
    };
  }
}

export const notificationService = new NotificationService();
