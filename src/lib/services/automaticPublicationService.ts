import { createClient } from '@/lib/supabase/server';
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns';

interface ScheduledPublication {
  id: string;
  content_id: string;
  content_type: 'article' | 'news';
  scheduled_for: string;
  timezone: string;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  auto_publish: boolean;
  publish_channels: string[];
  recurring_pattern: string | null;
  metadata: any;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicationResult {
  success: boolean;
  error?: string;
  published_at?: string;
  next_scheduled?: string;
}

export class AutomaticPublicationService {
  private async db() {
    return await createClient();
  }

  /**
   * Process all scheduled publications that are due
   */
  async processScheduledPublications(): Promise<void> {
    try {
      const now = new Date();

      // Get all scheduled publications that are due
      const supabase = await this.db();
      const { data: scheduledPublications, error } = await supabase
        .from('publication_schedule')
        .select('*')
        .eq('status', 'scheduled')
        .eq('auto_publish', true)
        .lte('scheduled_for', now.toISOString());

      if (error) {
        console.error('Error fetching scheduled publications:', error);
        return;
      }

      if (!scheduledPublications || scheduledPublications.length === 0) {
        console.log('No scheduled publications due for processing');
        return;
      }

      console.log(
        `Processing ${scheduledPublications.length} scheduled publications`
      );

      // Process each publication
      for (const publication of scheduledPublications) {
        await this.processPublication(publication);
      }
    } catch (error) {
      console.error('Error in processScheduledPublications:', error);
    }
  }

  /**
   * Process a single scheduled publication
   */
  private async processPublication(
    publication: ScheduledPublication
  ): Promise<void> {
    try {
      console.log(
        `Processing publication ${publication.id} for ${publication.content_type} ${publication.content_id}`
      );

      let result: PublicationResult;

      if (publication.content_type === 'article') {
        result = await this.publishArticle(publication);
      } else {
        result = await this.publishNews(publication);
      }

      if (result.success) {
        // Update publication status
        await this.updatePublicationStatus(
          publication.id,
          'published',
          result.published_at
        );

        // Handle recurring publications
        if (publication.recurring_pattern) {
          await this.scheduleNextRecurrence(publication);
        }

        console.log(
          `Successfully published ${publication.content_type} ${publication.content_id}`
        );
      } else {
        // Mark as failed
        await this.updatePublicationStatus(publication.id, 'failed');
        console.error(
          `Failed to publish ${publication.content_type} ${publication.content_id}:`,
          result.error
        );
      }
    } catch (error) {
      console.error(`Error processing publication ${publication.id}:`, error);
      await this.updatePublicationStatus(publication.id, 'failed');
    }
  }

  /**
   * Publish an article
   */
  private async publishArticle(
    publication: ScheduledPublication
  ): Promise<PublicationResult> {
    try {
      const now = new Date();

      // Update article status to published
      const supabase = await this.db();
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', publication.content_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create article history entry
      await this.createArticleHistoryEntry(
        publication.content_id,
        'published',
        { status: 'review' },
        { status: 'published', published_at: now.toISOString() },
        'Automatically published via scheduled publication'
      );

      // Process publish channels
      await this.processPublishChannels(publication);

      return {
        success: true,
        published_at: now.toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Publish a news item
   */
  private async publishNews(
    publication: ScheduledPublication
  ): Promise<PublicationResult> {
    try {
      const now = new Date();

      // Update news status to published
      const supabase = await this.db();
      const { error: updateError } = await supabase
        .from('news')
        .update({
          published_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', publication.content_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Process publish channels
      await this.processPublishChannels(publication);

      return {
        success: true,
        published_at: now.toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process publish channels (web, newsletter, social, etc.)
   */
  private async processPublishChannels(
    publication: ScheduledPublication
  ): Promise<void> {
    const channels = publication.publish_channels || ['web'];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'web':
            // Already handled by updating the database
            break;

          case 'newsletter':
            await this.addToNewsletter(publication);
            break;

          case 'social':
            await this.scheduleToSocialMedia(publication);
            break;

          case 'rss':
            // RSS is automatically updated when content is published
            break;

          default:
            console.warn(`Unknown publish channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Error processing channel ${channel}:`, error);
        // Continue with other channels even if one fails
      }
    }
  }

  /**
   * Add content to newsletter queue
   */
  private async addToNewsletter(
    publication: ScheduledPublication
  ): Promise<void> {
    // This would integrate with your newsletter system
    // For now, we'll just log it
    console.log(
      `Adding ${publication.content_type} ${publication.content_id} to newsletter queue`
    );

    // Example implementation:
    // await this.supabase
    //   .from('newsletter_queue')
    //   .insert({
    //     content_id: publication.content_id,
    //     content_type: publication.content_type,
    //     scheduled_for: new Date().toISOString(),
    //     status: 'pending'
    //   })
  }

  /**
   * Schedule content for social media
   */
  private async scheduleToSocialMedia(
    publication: ScheduledPublication
  ): Promise<void> {
    // This would integrate with your social media scheduling system
    // For now, we'll just log it
    console.log(
      `Scheduling ${publication.content_type} ${publication.content_id} for social media`
    );

    // Example implementation:
    // await this.supabase
    //   .from('social_media_queue')
    //   .insert({
    //     content_id: publication.content_id,
    //     content_type: publication.content_type,
    //     platforms: ['twitter', 'linkedin'],
    //     scheduled_for: new Date().toISOString(),
    //     status: 'pending'
    //   })
  }

  /**
   * Schedule next recurrence for recurring publications
   */
  private async scheduleNextRecurrence(
    publication: ScheduledPublication
  ): Promise<void> {
    if (!publication.recurring_pattern) return;

    try {
      const currentDate = parseISO(publication.scheduled_for);
      let nextDate: Date;

      switch (publication.recurring_pattern) {
        case 'daily':
          nextDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          nextDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          nextDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          nextDate = addMonths(currentDate, 1);
          break;
        default:
          // Handle custom patterns
          nextDate = this.parseCustomPattern(
            currentDate,
            publication.recurring_pattern
          );
          break;
      }

      // Create new scheduled publication
      const { error } = await this.supabase
        .from('publication_schedule')
        .insert({
          content_id: publication.content_id,
          content_type: publication.content_type,
          scheduled_for: nextDate.toISOString(),
          timezone: publication.timezone,
          status: 'scheduled',
          auto_publish: publication.auto_publish,
          publish_channels: publication.publish_channels,
          recurring_pattern: publication.recurring_pattern,
          metadata: {
            ...publication.metadata,
            parent_schedule_id: publication.id,
            recurrence_count: (publication.metadata?.recurrence_count || 0) + 1,
          },
        });

      if (error) {
        console.error('Error creating recurring publication:', error);
      } else {
        console.log(`Scheduled next recurrence for ${nextDate.toISOString()}`);
      }
    } catch (error) {
      console.error('Error scheduling next recurrence:', error);
    }
  }

  /**
   * Parse custom recurring patterns
   */
  private parseCustomPattern(currentDate: Date, pattern: string): Date {
    // Parse patterns like "every 3 days", "every 2 weeks"
    const match = pattern.match(/every (\d+) (day|week|month)s?/i);

    if (!match) {
      throw new Error(`Invalid custom pattern: ${pattern}`);
    }

    const count = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'day':
        return addDays(currentDate, count);
      case 'week':
        return addWeeks(currentDate, count);
      case 'month':
        return addMonths(currentDate, count);
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }

  /**
   * Update publication status
   */
  private async updatePublicationStatus(
    publicationId: string,
    status: 'published' | 'failed' | 'cancelled',
    publishedAt?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (publishedAt) {
      updateData.published_at = publishedAt;
    }

    const supabase = await this.db();
    const { error } = await supabase
      .from('publication_schedule')
      .update(updateData)
      .eq('id', publicationId);

    if (error) {
      console.error('Error updating publication status:', error);
    }
  }

  /**
   * Create article history entry
   */
  private async createArticleHistoryEntry(
    articleId: string,
    changeType: string,
    oldValues: any,
    newValues: any,
    notes?: string
  ): Promise<void> {
    try {
      const supabase = await this.db();
      const { error } = await supabase.from('article_history').insert({
        article_id: articleId,
        changed_by: null, // System change
        change_type: changeType,
        old_values: oldValues,
        new_values: newValues,
        notes: notes || `Automatic ${changeType} via scheduled publication`,
        created_at: new Date().toISOString(),
      });

      if (
        error &&
        !error.message?.includes('relation "article_history" does not exist')
      ) {
        console.error('Error creating article history:', error);
      }
    } catch (error) {
      console.error('Error creating article history entry:', error);
    }
  }

  /**
   * Get upcoming scheduled publications
   */
  async getUpcomingPublications(
    limit: number = 10
  ): Promise<ScheduledPublication[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from('publication_schedule')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming publications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get overdue publications
   */
  async getOverduePublications(): Promise<ScheduledPublication[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from('publication_schedule')
      .select('*')
      .eq('status', 'scheduled')
      .lt('scheduled_for', new Date().toISOString());

    if (error) {
      console.error('Error fetching overdue publications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Cancel a scheduled publication
   */
  async cancelScheduledPublication(publicationId: string): Promise<boolean> {
    try {
      const supabase = await this.db();
      const { error } = await supabase
        .from('publication_schedule')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', publicationId);

      if (error) {
        console.error('Error cancelling publication:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling publication:', error);
      return false;
    }
  }

  /**
   * Reschedule a publication
   */
  async reschedulePublication(
    publicationId: string,
    newScheduledFor: string,
    timezone?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        scheduled_for: newScheduledFor,
        updated_at: new Date().toISOString(),
      };

      if (timezone) {
        updateData.timezone = timezone;
      }

      const supabase = await this.db();
      const { error } = await supabase
        .from('publication_schedule')
        .update(updateData)
        .eq('id', publicationId);

      if (error) {
        console.error('Error rescheduling publication:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error rescheduling publication:', error);
      return false;
    }
  }
}

// Export singleton instance
export const automaticPublicationService = new AutomaticPublicationService();
