import webpush from 'web-push';
import { createClient } from '@/lib/supabase/client';
import { NotificationService } from '@/lib/services/notificationService';
import { NotificationPreferencesService } from '@/lib/services/notificationPreferencesService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Notification,
  PushNotificationPayload,
  UserPushSubscription,
} from '@/types/notifications';

// Acepta distintas variantes de generics del cliente de Supabase
type AnySupabaseClient = SupabaseClient<any, any, any, any>;

export class PushNotificationService {
  private supabase: AnySupabaseClient;
  private notificationService: NotificationService;
  private notificationPreferencesService: NotificationPreferencesService;

  constructor(supabase?: AnySupabaseClient) {
    this.supabase = (supabase as AnySupabaseClient) ?? (createClient() as unknown as AnySupabaseClient);
    this.notificationService = new NotificationService(this.supabase);
    this.notificationPreferencesService = new NotificationPreferencesService(this.supabase);

    // Configure web-push con VAPID keys
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:notifications@stakeados.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async sendPushNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      // Check if user has push notifications enabled
      const preferences =
        await this.notificationPreferencesService.getUserPreferences(userId);
      if (!preferences.pushEnabled) {
        console.log(`Push notifications disabled for user ${userId}`);
        return;
      }

      // Check quiet hours
      const quietHoursStatus =
        await this.notificationPreferencesService.getQuietHoursStatus(userId);
      if (
        quietHoursStatus.inQuietHours &&
        notification.type !== 'breaking_news'
      ) {
        console.log(
          `User ${userId} is in quiet hours, skipping push notification`
        );
        return;
      }

      // Get user's push subscriptions
      const subscriptions = await this.getUserPushSubscriptions(userId);
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Create push payload
      const payload = this.createPushPayload(notification);

      // Send to all user's devices
      const sendPromises = subscriptions.map(subscription =>
        this.sendToSubscription(subscription, payload)
      );

      const results = await Promise.allSettled(sendPromises);

      // Check if any notifications were sent successfully
      const successCount = results.filter(
        result => result.status === 'fulfilled'
      ).length;

      if (successCount > 0) {
        await this.notificationService.updateDeliveryStatus(
          notification.id,
          'push',
          'sent'
        );
        console.log(
          `Push notification sent to ${successCount} devices for user ${userId}`
        );
      } else {
        await this.notificationService.updateDeliveryStatus(
          notification.id,
          'push',
          'failed'
        );
        console.log(
          `Failed to send push notification to any device for user ${userId}`
        );
      }

      // Clean up invalid subscriptions
      const failedResults = results
        .map((result, index) => ({
          result,
          subscription: subscriptions[index],
        }))
        .filter(({ result }) => result.status === 'rejected');

      for (const { subscription } of failedResults) {
        await this.removeInvalidSubscription(subscription.id);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);

      await this.notificationService.updateDeliveryStatus(
        notification.id,
        'push',
        'failed'
      );

      throw error;
    }
  }

  async subscribeToPush(
    userId: string,
    subscription: any,
    userAgent?: string
  ): Promise<UserPushSubscription> {
    try {
      const { data, error } = await this.supabase
        .from('user_push_subscriptions' as any)
        .upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh_key: subscription.keys.p256dh,
            auth_key: subscription.keys.auth,
            user_agent: userAgent,
            last_used: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,endpoint',
          }
        )
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabasePushSubscription(data);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw new Error('Failed to subscribe to push notifications');
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_push_subscriptions' as any)
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('Failed to unsubscribe from push notifications');
    }
  }

  async getUserPushSubscriptions(
    userId: string
  ): Promise<UserPushSubscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_push_subscriptions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('last_used', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDatabasePushSubscription);
    } catch (error) {
      console.error('Error fetching user push subscriptions:', error);
      return [];
    }
  }

  private async sendToSubscription(
    userSubscription: UserPushSubscription,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        userSubscription.subscription,
        JSON.stringify(payload),
        {
          TTL: 24 * 60 * 60, // 24 hours
          urgency: 'normal',
        }
      );

      // Update last used timestamp
      await this.supabase
        .from('user_push_subscriptions' as any)
        .update({ last_used: new Date().toISOString() })
        .eq('id', userSubscription.id);
    } catch (error) {
      console.error('Error sending to push subscription:', error);
      throw error;
    }
  }

  private createPushPayload(
    notification: Notification
  ): PushNotificationPayload {
    // Use English as default, but could be enhanced to use user's preferred language
    const title = notification.title.en || Object.values(notification.title)[0];
    const body =
      notification.message.en || Object.values(notification.message)[0];

    const payload: PushNotificationPayload = {
      title,
      body,
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      data: {
        notificationId: notification.id,
        type: notification.type,
        url: this.getNotificationUrl(notification),
        ...notification.data,
      },
    };

    // Add action buttons based on notification type
    if (notification.type === 'new_article') {
      payload.actions = [
        {
          action: 'read',
          title: 'Read Article',
          icon: '/icons/read-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ];
    } else if (notification.type === 'new_news') {
      payload.actions = [
        {
          action: 'read',
          title: 'Read News',
          icon: '/icons/news-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ];
    }

    return payload;
  }

  private getNotificationUrl(notification: Notification): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stakeados.com';

    switch (notification.type) {
      case 'new_article':
        return `${baseUrl}/en/articles/${notification.data.articleId}`;
      case 'new_news':
        return `${baseUrl}/en/news/${notification.data.newsId}`;
      case 'article_approved':
        return `${baseUrl}/en/profile/articles`;
      case 'proposal_reviewed':
        return `${baseUrl}/en/profile/proposals`;
      default:
        return `${baseUrl}/en/notifications`;
    }
  }

  private async removeInvalidSubscription(
    subscriptionId: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('user_push_subscriptions' as any)
        .delete()
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('Error removing invalid push subscription:', error);
    }
  }

  private mapDatabasePushSubscription(dbSub: any): UserPushSubscription {
    return {
      id: dbSub.id,
      userId: dbSub.user_id,
      subscription: {
        endpoint: dbSub.endpoint,
        keys: {
          p256dh: dbSub.p256dh_key,
          auth: dbSub.auth_key,
        },
      },
      userAgent: dbSub.user_agent,
      createdAt: new Date(dbSub.created_at),
      lastUsed: dbSub.last_used ? new Date(dbSub.last_used) : undefined,
    };
  }

  async getVapidPublicKey(): Promise<string> {
    return process.env.VAPID_PUBLIC_KEY || '';
  }

  async testPushNotification(userId: string): Promise<void> {
    const testNotification: Notification = {
      id: 'test-' + Date.now(),
      userId,
      type: 'new_article',
      title: { en: 'Test Notification', es: 'Notificación de Prueba' },
      message: {
        en: 'This is a test push notification from Stakeados!',
        es: '¡Esta es una notificación push de prueba de Stakeados!',
      },
      data: {},
      isRead: false,
      deliveryStatus: { in_app: 'pending', email: 'pending', push: 'pending' },
      scheduledFor: new Date(),
      createdAt: new Date(),
    };

    await this.sendPushNotification(userId, testNotification);
  }
}

export const pushNotificationService = new PushNotificationService();
