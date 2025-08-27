import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { RealtimeChannel, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealTimeEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface AdminNotification {
  id: string;
  type:
    | 'article_status_change'
    | 'news_processed'
    | 'ai_processing_complete'
    | 'system_alert'
    | 'user_activity';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  created_at: Date;
  expires_at?: Date;
}

export interface CollaborationEvent {
  type:
    | 'user_joined'
    | 'user_left'
    | 'content_changed'
    | 'cursor_moved'
    | 'selection_changed';
  userId: string;
  userName: string;
  articleId: string;
  data?: any;
  timestamp: Date;
}

export interface AnalyticsUpdate {
  type: 'metrics_updated' | 'trend_changed' | 'alert_triggered';
  contentType: 'article' | 'news' | 'category';
  contentId?: string;
  metrics: any;
  timestamp: Date;
}

export interface BackgroundProcessUpdate {
  type:
    | 'ai_processing'
    | 'rss_fetch'
    | 'bulk_operation'
    | 'backup'
    | 'maintenance';
  processId: string;
  status: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  data?: any;
  timestamp: Date;
}

class RealTimeService {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  // (no-op) helpers removed; we rely on generated Database types directly

  // Admin Notifications Channel
  subscribeToAdminNotifications(
    userId: string,
    callback: (notification: AdminNotification) => void
  ) {
    const channelName = `admin_notifications:${userId}`;

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<
          Database['public']['Tables']['admin_notifications']['Row']
        >) => {
          const notification: AdminNotification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            data: payload.new.data,
            priority: payload.new.priority,
            read: payload.new.read,
            created_at: new Date(payload.new.created_at),
            expires_at: payload.new.expires_at
              ? new Date(payload.new.expires_at)
              : undefined,
          };
          callback(notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Article Collaboration Channel
  subscribeToArticleCollaboration(
    articleId: string,
    callback: (event: CollaborationEvent) => void
  ) {
    const channelName = `article_collaboration:${articleId}`;

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'collaboration' }, payload => {
        callback(payload.payload as CollaborationEvent);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Send collaboration event
  sendCollaborationEvent(
    articleId: string,
    event: Omit<CollaborationEvent, 'timestamp'>
  ) {
    const channelName = `article_collaboration:${articleId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'collaboration',
        payload: {
          ...event,
          timestamp: new Date(),
        },
      });
    }
  }

  // Analytics Updates Channel
  subscribeToAnalyticsUpdates(callback: (update: AnalyticsUpdate) => void) {
    const channelName = 'analytics_updates';

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_metrics',
        },
        (payload: RealtimePostgresChangesPayload<
          Database['public']['Tables']['content_metrics']['Row']
        >) => {
          const update: AnalyticsUpdate = {
            type: 'metrics_updated',
            contentType: (payload.new as any)?.content_type || 'article',
            contentId: (payload.new as any)?.content_id,
            metrics: payload.new,
            timestamp: new Date(),
          };
          callback(update);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Background Process Updates Channel
  subscribeToBackgroundProcesses(
    callback: (update: BackgroundProcessUpdate) => void
  ) {
    const channelName = 'background_processes';

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'background_jobs',
        },
        (payload: RealtimePostgresChangesPayload<
          Database['public']['Tables']['background_jobs']['Row']
        >) => {
          const update: BackgroundProcessUpdate = {
            type: payload.new.job_type || 'ai_processing',
            processId: payload.new.id,
            status: payload.new.status,
            progress: payload.new.progress ?? undefined,
            message: (payload.new as any).message,
            data: (payload.new as any).data,
            timestamp: new Date(payload.new.updated_at || payload.new.created_at),
          };
          callback(update);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Article Status Changes
  subscribeToArticleStatusChanges(callback: (event: any) => void) {
    const channelName = 'article_status_changes';

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'articles',
          filter: 'status=neq.draft',
        },
        (payload: RealtimePostgresChangesPayload<
          Database['public']['Tables']['articles']['Row']
        >) => {
          callback({
            type: 'article_status_changed',
            articleId: payload.new.id,
            oldStatus: payload.old?.status,
            newStatus: payload.new.status,
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // News Processing Updates
  subscribeToNewsProcessing(callback: (event: any) => void) {
    const channelName = 'news_processing';

    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'news',
          filter: 'processed=eq.true',
        },
        (payload: RealtimePostgresChangesPayload<
          Database['public']['Tables']['news']['Row']
        >) => {
          callback({
            type: 'news_processed',
            newsId: payload.new.id,
            aiMetadata: (payload.new as any).ai_metadata,
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Generic event subscription
  addEventListener(eventType: string, callback: (event: any) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)?.add(callback);

    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Emit event to all listeners
  emitEvent(eventType: string, event: any) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // Unsubscribe from channel
  private unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel, _channelName) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.eventListeners.clear();
  }

  // Get connection status
  getConnectionStatus() {
    return this.supabase.realtime.isConnected();
  }

  // Reconnect if needed
  async reconnect() {
    if (!this.supabase.realtime.isConnected()) {
      await this.supabase.realtime.connect();
    }
  }
}

export const realTimeService = new RealTimeService();
