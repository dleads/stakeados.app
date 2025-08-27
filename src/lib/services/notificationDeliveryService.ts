import { notificationService } from '@/lib/services/notificationService';
import { emailNotificationService } from '@/lib/services/emailNotificationService';
import { pushNotificationService } from '@/lib/services/pushNotificationService';
import { notificationPreferencesService } from '@/lib/services/notificationPreferencesService';
import { createClient } from '@/lib/supabase/client';
import type {
  CreateNotificationRequest,
  EmailNotificationData,
  DigestEmailData,
  NotificationDigest,
} from '@/types/notifications';

export class NotificationDeliveryService {
  private supabase = createClient();

  async deliverNotification(request: CreateNotificationRequest): Promise<void> {
    try {
      // Create the notification record
      const notification =
        await notificationService.createNotification(request);

      // Get user information
      const { data: user, error: userError } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, preferred_locale')
        .eq('id', request.userId)
        .single();

      if (userError || !user) {
        throw new Error(`User not found: ${request.userId}`);
      }

      const userData = user as any;

      // Get user preferences
      const preferences =
        await notificationPreferencesService.getUserPreferences(request.userId);

      // Deliver via different channels based on preferences
      const deliveryPromises: Promise<void>[] = [];

      // In-app notification (always delivered, marked as sent immediately)
      if (preferences.inAppEnabled) {
        deliveryPromises.push(
          notificationService.updateDeliveryStatus(
            notification.id,
            'in_app',
            'sent'
          )
        );
      }

      // Email notification
      if (preferences.emailEnabled) {
        const emailData: EmailNotificationData = {
          user: {
            id: userData.id,
            email: userData.email,
            fullName: userData.full_name,
            preferredLocale: userData.preferred_locale || 'en',
          },
          notification,
          unsubscribeUrl: this.generateUnsubscribeUrl(
            userData.id,
            notification.type
          ),
        };

        deliveryPromises.push(
          emailNotificationService.sendNotificationEmail(emailData)
        );
      }

      // Push notification
      if (preferences.pushEnabled) {
        deliveryPromises.push(
          pushNotificationService.sendPushNotification(
            request.userId,
            notification
          )
        );
      }

      // Execute all deliveries in parallel
      await Promise.allSettled(deliveryPromises);

      console.log(
        `Notification delivered to user ${request.userId} via enabled channels`
      );
    } catch (error) {
      console.error('Error delivering notification:', error);
      throw error;
    }
  }

  async deliverBulkNotifications(
    requests: CreateNotificationRequest[]
  ): Promise<void> {
    try {
      // Group notifications by user to optimize delivery
      const userNotifications = new Map<string, CreateNotificationRequest[]>();

      requests.forEach(request => {
        const userRequests = userNotifications.get(request.userId) || [];
        userRequests.push(request);
        userNotifications.set(request.userId, userRequests);
      });

      // Process each user's notifications
      const deliveryPromises = Array.from(userNotifications.entries()).map(
        ([userId, userRequests]) =>
          this.deliverUserNotifications(userId, userRequests)
      );

      await Promise.allSettled(deliveryPromises);

      console.log(
        `Bulk delivered ${requests.length} notifications to ${userNotifications.size} users`
      );
    } catch (error) {
      console.error('Error delivering bulk notifications:', error);
      throw error;
    }
  }

  async processPendingNotifications(): Promise<void> {
    try {
      // Process pending email notifications
      const pendingEmails = await notificationService.getPendingNotifications(
        'email',
        100
      );
      for (const notification of pendingEmails) {
        try {
          const { data: user } = await this.supabase
            .from('profiles')
            .select('id, email, full_name, preferred_locale')
            .eq('id', notification.userId)
            .single();

          if (user) {
            const userData = user as any;
            const emailData: EmailNotificationData = {
              user: {
                id: userData.id,
                email: userData.email,
                fullName: userData.full_name,
                preferredLocale: userData.preferred_locale || 'en',
              },
              notification,
              unsubscribeUrl: this.generateUnsubscribeUrl(
                userData.id,
                notification.type
              ),
            };

            await emailNotificationService.sendNotificationEmail(emailData);
          }
        } catch (error) {
          console.error(
            `Error processing email notification ${notification.id}:`,
            error
          );
        }
      }

      // Process pending push notifications
      const pendingPush = await notificationService.getPendingNotifications(
        'push',
        100
      );
      for (const notification of pendingPush) {
        try {
          await pushNotificationService.sendPushNotification(
            notification.userId,
            notification
          );
        } catch (error) {
          console.error(
            `Error processing push notification ${notification.id}:`,
            error
          );
        }
      }

      console.log(
        `Processed ${pendingEmails.length} email and ${pendingPush.length} push notifications`
      );
    } catch (error) {
      console.error('Error processing pending notifications:', error);
      throw error;
    }
  }

  async generateDailyDigests(): Promise<void> {
    try {
      // Get users who have daily digest enabled
      const { data: users, error } = await this.supabase
        .from('notification_preferences' as any)
        .select(
          `
          user_id,
          profiles!inner(id, email, full_name, preferred_locale)
        `
        )
        .eq('digest_frequency', 'daily');

      if (error) throw error;

      const digestPromises = (users || []).map(async (userPref: any) => {
        try {
          const user = userPref.profiles as any;
          const digest = await this.createDailyDigest(user.id);

          if (digest && digest.content.totalCount > 0) {
            const emailData: DigestEmailData = {
              user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                preferredLocale: user.preferred_locale || 'en',
              },
              digest,
              unsubscribeUrl: this.generateUnsubscribeUrl(user.id, 'digest'),
              managePreferencesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${user.preferred_locale || 'en'}/settings/notifications`,
            };

            await emailNotificationService.sendDigestEmail(emailData);

            // Mark digest as sent
            await this.supabase
              .from('notification_digests' as any)
              .update({
                sent_at: new Date().toISOString(),
                status: 'sent',
              })
              .eq('id', digest.id);
          }
        } catch (error) {
          console.error(
            `Error generating digest for user ${userPref.user_id}:`,
            error
          );
        }
      });

      await Promise.allSettled(digestPromises);

      console.log(`Generated daily digests for ${users?.length || 0} users`);
    } catch (error) {
      console.error('Error generating daily digests:', error);
      throw error;
    }
  }

  private async deliverUserNotifications(
    userId: string,
    requests: CreateNotificationRequest[]
  ): Promise<void> {
    try {
      // Create all notifications for the user
      const notifications =
        await notificationService.bulkCreateNotifications(requests);

      // Get user information once
      const { data: user, error: userError } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, preferred_locale')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get user preferences once
      const preferences =
        await notificationPreferencesService.getUserPreferences(userId);

      // Deliver each notification
      for (const notification of notifications) {
        const deliveryPromises: Promise<void>[] = [];

        // In-app notification
        if (preferences.inAppEnabled) {
          deliveryPromises.push(
            notificationService.updateDeliveryStatus(
              notification.id,
              'in_app',
              'sent'
            )
          );
        }

        // Email notification
        if (preferences.emailEnabled) {
          const userData = user as any;
          const emailData: EmailNotificationData = {
            user: {
              id: userData.id,
              email: userData.email,
              fullName: userData.full_name,
              preferredLocale: userData.preferred_locale || 'en',
            },
            notification,
            unsubscribeUrl: this.generateUnsubscribeUrl(
              userData.id,
              notification.type
            ),
          };

          deliveryPromises.push(
            emailNotificationService.sendNotificationEmail(emailData)
          );
        }

        // Push notification
        if (preferences.pushEnabled) {
          deliveryPromises.push(
            pushNotificationService.sendPushNotification(userId, notification)
          );
        }

        await Promise.allSettled(deliveryPromises);
      }
    } catch (error) {
      console.error(`Error delivering notifications to user ${userId}:`, error);
      throw error;
    }
  }

  private async createDailyDigest(
    userId: string
  ): Promise<NotificationDigest | null> {
    try {
      // Get content from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Get new articles
      const { data: articles, error: articlesError } = await this.supabase
        .from('articles' as any)
        .select('id, title, meta_description, category, published_at')
        .eq('status', 'published')
        .gte('published_at', yesterday.toISOString())
        .order('published_at', { ascending: false })
        .limit(5);

      if (articlesError) throw articlesError;

      // Get new news
      const { data: news, error: newsError } = await this.supabase
        .from('news_articles' as any)
        .select('id, title, summary, source_name, published_at')
        .gte('published_at', yesterday.toISOString())
        .order('trending_score', { ascending: false })
        .limit(5);

      if (newsError) throw newsError;

      const totalCount = (articles?.length || 0) + (news?.length || 0);

      if (totalCount === 0) {
        return null; // No content for digest
      }

      // Create digest record
      const { data: digest, error: digestError } = await this.supabase
        .from('notification_digests' as any)
        .insert({
          user_id: userId,
          digest_type: 'daily',
          content: {
            articles: articles || [],
            news: news || [],
            totalCount,
          },
          scheduled_for: new Date().toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (digestError) throw digestError;

      const digestData = digest as any;
      return {
        id: digestData.id,
        userId: digestData.user_id,
        digestType: digestData.digest_type,
        content: digestData.content,
        scheduledFor: new Date(digestData.scheduled_for),
        sentAt: digestData.sent_at ? new Date(digestData.sent_at) : undefined,
        status: digestData.status,
        createdAt: new Date(digestData.created_at),
      };
    } catch (error) {
      console.error(`Error creating daily digest for user ${userId}:`, error);
      return null;
    }
  }

  private generateUnsubscribeUrl(
    userId: string,
    notificationType: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stakeados.com';
    const token = Buffer.from(
      `${userId}:${notificationType}:${Date.now()}`
    ).toString('base64');
    return `${baseUrl}/api/notifications/unsubscribe?token=${token}`;
  }
}

export const notificationDeliveryService = new NotificationDeliveryService();
