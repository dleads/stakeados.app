import { createClient } from '@/lib/supabase/client';
import type { NotificationPreferences } from '@/types/notifications';
import type { SupabaseClient } from '@supabase/supabase-js';

// Acepta distintas variantes de generics del cliente de Supabase
type AnySupabaseClient = SupabaseClient<any, any, any, any>;

export class NotificationPreferencesService {
  private supabase: AnySupabaseClient;

  constructor(supabase?: AnySupabaseClient) {
    this.supabase = (supabase as AnySupabaseClient) ?? (createClient() as unknown as AnySupabaseClient);
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_user_notification_preferences',
        { p_user_id: userId }
      );

      if (error) throw error;

      const preferences = data?.[0];

      if (!preferences) {
        // Return default preferences if none exist
        return this.getDefaultPreferences(userId);
      }

      return {
        userId,
        inAppEnabled: preferences.in_app_enabled,
        emailEnabled: preferences.email_enabled,
        pushEnabled: preferences.push_enabled,
        digestFrequency: preferences.digest_frequency,
        quietHoursStart: preferences.quiet_hours_start,
        quietHoursEnd: preferences.quiet_hours_end,
        timezone: preferences.timezone,
        categories: preferences.categories || {},
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw new Error('Failed to fetch notification preferences');
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);

      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        userId, // Ensure userId is preserved
      };

      const { error } = await this.supabase.rpc('update_notification_preferences', {
        p_user_id: userId,
        p_preferences: {
          in_app_enabled: updatedPreferences.inAppEnabled,
          email_enabled: updatedPreferences.emailEnabled,
          push_enabled: updatedPreferences.pushEnabled,
          digest_frequency: updatedPreferences.digestFrequency,
          quiet_hours_start: updatedPreferences.quietHoursStart,
          quiet_hours_end: updatedPreferences.quietHoursEnd,
          timezone: updatedPreferences.timezone,
          categories: updatedPreferences.categories,
        },
      });

      if (error) throw error;

      return updatedPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  async updateCategoryPreferences(
    userId: string,
    categoryId: string,
    preferences: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    }
  ): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);

      const updatedCategories = {
        ...currentPreferences.categories,
        [categoryId]: preferences,
      };

      await this.updateUserPreferences(userId, {
        categories: updatedCategories,
      });
    } catch (error) {
      console.error('Error updating category preferences:', error);
      throw new Error('Failed to update category preferences');
    }
  }

  async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    try {
      const defaultPreferences = this.getDefaultPreferences(userId);

      const { error } = await this.supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return defaultPreferences;
    } catch (error) {
      console.error('Error resetting preferences to defaults:', error);
      throw new Error('Failed to reset preferences');
    }
  }

  async getQuietHoursStatus(userId: string): Promise<{
    inQuietHours: boolean;
    nextActiveTime?: Date;
  }> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const now = new Date();

      // Convert user timezone to current time
      const userTime = new Date(
        now.toLocaleString('en-US', { timeZone: preferences.timezone })
      );
      const currentTime = userTime.getHours() * 60 + userTime.getMinutes();

      // Parse quiet hours
      const [startHour, startMin] = preferences.quietHoursStart
        .split(':')
        .map(Number);
      const [endHour, endMin] = preferences.quietHoursEnd
        .split(':')
        .map(Number);

      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;

      let inQuietHours = false;
      let nextActiveTime: Date | undefined;

      if (quietStart < quietEnd) {
        // Same-day quiet hours (e.g., 13:00 to 18:00)
        inQuietHours = currentTime >= quietStart && currentTime < quietEnd;

        if (inQuietHours) {
          // Next active is today at end time
          nextActiveTime = new Date(userTime);
          nextActiveTime.setHours(endHour, endMin, 0, 0);
        }
      } else {
        // Cross-day quiet hours (e.g., 22:00 to 08:00)
        inQuietHours = currentTime >= quietStart || currentTime < quietEnd;

        if (inQuietHours) {
          if (currentTime >= quietStart) {
            // After start time, next active is tomorrow at end time
            nextActiveTime = new Date(userTime);
            nextActiveTime.setDate(nextActiveTime.getDate() + 1);
            nextActiveTime.setHours(endHour, endMin, 0, 0);
          } else {
            // Before end time, next active is today at end time
            nextActiveTime = new Date(userTime);
            nextActiveTime.setHours(endHour, endMin, 0, 0);
          }
        }
      }

      return {
        inQuietHours,
        nextActiveTime,
      };
    } catch (error) {
      console.error('Error checking quiet hours status:', error);
      return { inQuietHours: false };
    }
  }

  async getAvailableTimezones(): Promise<string[]> {
    // Return common timezones
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Argentina/Buenos_Aires',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Madrid',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Australia/Sydney',
    ];
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      digestFrequency: 'daily',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC',
      categories: {},
    };
  }

  async exportPreferences(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Error exporting preferences:', error);
      throw new Error('Failed to export preferences');
    }
  }

  async importPreferences(
    userId: string,
    preferencesJson: string
  ): Promise<NotificationPreferences> {
    try {
      const preferences = JSON.parse(
        preferencesJson
      ) as Partial<NotificationPreferences>;

      // Validate the imported preferences
      if (typeof preferences !== 'object') {
        throw new Error('Invalid preferences format');
      }

      // Remove userId from imported data to prevent conflicts
      delete preferences.userId;
      delete preferences.id;
      delete preferences.createdAt;
      delete preferences.updatedAt;

      return await this.updateUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw new Error('Failed to import preferences');
    }
  }
}

export const notificationPreferencesService =
  new NotificationPreferencesService();
