import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';
import type {
  UserSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionFilters,
  SubscriptionStats,
} from '@/types/notifications';

export class SubscriptionService {
  private supabase: SupabaseClient<DatabaseExtended, any, any>;

  constructor(supabase: SupabaseClient<DatabaseExtended, any, any>) {
    this.supabase = supabase;
  }

  async getUserSubscriptions(
    userId: string,
    filters?: SubscriptionFilters
  ): Promise<UserSubscription[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_subscriptions', {
        p_user_id: userId,
      });

      if (error) throw error;

      let subscriptions = data || [];

      // Apply filters
      if (filters) {
        if (filters.type) {
          subscriptions = subscriptions.filter(
            (sub: any) => sub.subscription_type === filters.type
          );
        }
        if (filters.isActive !== undefined) {
          subscriptions = subscriptions.filter(
            (sub: any) => sub.is_active === filters.isActive
          );
        }
        if (filters.frequency) {
          subscriptions = subscriptions.filter(
            (sub: any) => sub.frequency === filters.frequency
          );
        }
      }

      return subscriptions.map(this.mapDatabaseSubscription);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  async createSubscription(
    userId: string,
    request: CreateSubscriptionRequest
  ): Promise<UserSubscription> {
    try {
      const { error } = await this.supabase.rpc('upsert_user_subscription', {
        p_user_id: userId,
        p_subscription_type: request.subscriptionType,
        p_subscription_target: request.subscriptionTarget,
        p_frequency: request.frequency || 'immediate',
        p_is_active: request.isActive !== false,
      });

      if (error) throw error;

      // Fetch the created/updated subscription
      const subscriptions = await this.getUserSubscriptions(userId, {
        type: request.subscriptionType,
      });

      const subscription = subscriptions.find(
        sub => sub.subscriptionTarget === request.subscriptionTarget
      );

      if (!subscription) {
        throw new Error('Failed to create subscription');
      }

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    updates: UpdateSubscriptionRequest
  ): Promise<UserSubscription> {
    try {
      const { error } = await this.supabase
        .from('user_subscriptions')
        .update({
          frequency: updates.frequency,
          is_active: updates.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) throw error;

      // Fetch updated subscription
      const subscriptions = await this.getUserSubscriptions(userId);
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found after update');
      }

      return subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async deleteSubscription(
    userId: string,
    subscriptionId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
    }
  }

  async getSubscriptionStats(userId: string): Promise<SubscriptionStats> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      const stats: SubscriptionStats = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(sub => sub.isActive).length,
        byType: {
          category: subscriptions.filter(
            sub => sub.subscriptionType === 'category'
          ).length,
          tag: subscriptions.filter(sub => sub.subscriptionType === 'tag')
            .length,
          author: subscriptions.filter(sub => sub.subscriptionType === 'author')
            .length,
        },
        byFrequency: {
          immediate: subscriptions.filter(sub => sub.frequency === 'immediate')
            .length,
          daily: subscriptions.filter(sub => sub.frequency === 'daily').length,
          weekly: subscriptions.filter(sub => sub.frequency === 'weekly')
            .length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw new Error('Failed to get subscription stats');
    }
  }

  async getAvailableSubscriptionTargets() {
    try {
      // Get categories
      const { data: categories, error: categoriesError } = await this.supabase
        .from('content_categories')
        .select('id, name, slug, color, icon')
        .order('name->en');

      if (categoriesError) throw categoriesError;

      // Get popular tags
      const { data: tags, error: tagsError } = await this.supabase
        .from('content_tags')
        .select('name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(50);

      if (tagsError) throw tagsError;

      // Get active authors (users who have published articles)
      const { data: authors, error: authorsError } = await this.supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in(
          'id',
          await this.supabase
            .from('articles')
            .select('author_id')
            .eq('status', 'published')
            .then(({ data }) => (data as any)?.map((a: any) => a.author_id) || [])
        )
        .order('full_name');

      if (authorsError) throw authorsError;

      return {
        categories: categories || [],
        tags: tags || [],
        authors: authors || [],
      };
    } catch (error) {
      console.error('Error fetching subscription targets:', error);
      throw new Error('Failed to fetch subscription targets');
    }
  }

  async checkUserSubscription(
    userId: string,
    subscriptionType: 'category' | 'tag' | 'author',
    subscriptionTarget: string
  ): Promise<UserSubscription | null> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId, {
        type: subscriptionType,
      });

      return (
        subscriptions.find(
          sub => sub.subscriptionTarget === subscriptionTarget && sub.isActive
        ) || null
      );
    } catch (error) {
      console.error('Error checking user subscription:', error);
      return null;
    }
  }

  async bulkUpdateSubscriptions(
    userId: string,
    updates: Array<{
      subscriptionId: string;
      frequency?: 'immediate' | 'daily' | 'weekly';
      isActive?: boolean;
    }>
  ): Promise<void> {
    try {
      const promises = updates.map(update =>
        this.updateSubscription(userId, update.subscriptionId, {
          frequency: update.frequency,
          isActive: update.isActive,
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk updating subscriptions:', error);
      throw new Error('Failed to update subscriptions');
    }
  }

  private mapDatabaseSubscription(dbSub: any): UserSubscription {
    return {
      id: dbSub.id,
      userId: dbSub.user_id,
      subscriptionType: dbSub.subscription_type,
      subscriptionTarget: dbSub.subscription_target,
      frequency: dbSub.frequency,
      isActive: dbSub.is_active,
      createdAt: new Date(dbSub.created_at),
      updatedAt: new Date(dbSub.updated_at),
      targetName: dbSub.target_name,
      targetMetadata: dbSub.target_metadata,
    };
  }
}
