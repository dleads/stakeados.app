export interface UserSubscription {
  id: string;
  userId: string;
  subscriptionType: 'category' | 'tag' | 'author';
  subscriptionTarget: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields from database function
  targetName?: string;
  targetMetadata?: {
    color?: string;
    icon?: string;
    avatar_url?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'new_article'
    | 'new_news'
    | 'article_approved'
    | 'proposal_reviewed'
    | 'breaking_news';
  title: Record<string, string>; // {en: "Title", es: "Título"}
  message: Record<string, string>; // {en: "Message", es: "Mensaje"}
  data: Record<string, any>; // Additional data like article_id, news_id, etc.
  isRead: boolean;
  deliveryStatus: {
    in_app: 'pending' | 'sent' | 'failed';
    email: 'pending' | 'sent' | 'failed';
    push: 'pending' | 'sent' | 'failed';
  };
  scheduledFor: Date;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreferences {
  id?: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency: 'none' | 'daily' | 'weekly';
  quietHoursStart: string; // Time format "HH:MM"
  quietHoursEnd: string; // Time format "HH:MM"
  timezone: string;
  categories: Record<
    string,
    {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    }
  >;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationDigest {
  id: string;
  userId: string;
  digestType: 'daily' | 'weekly';
  content: {
    articles: Array<{
      id: string;
      title: Record<string, string>;
      summary: Record<string, string>;
      category: string;
      publishedAt: Date;
    }>;
    news: Array<{
      id: string;
      title: Record<string, string>;
      summary: Record<string, string>;
      source: string;
      publishedAt: Date;
    }>;
    totalCount: number;
  };
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

export interface SubscriptionFilters {
  type?: 'category' | 'tag' | 'author';
  isActive?: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationFilters {
  type?: Notification['type'];
  isRead?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface CreateSubscriptionRequest {
  subscriptionType: 'category' | 'tag' | 'author';
  subscriptionTarget: string;
  frequency?: 'immediate' | 'daily' | 'weekly';
  isActive?: boolean;
}

export interface UpdateSubscriptionRequest {
  frequency?: 'immediate' | 'daily' | 'weekly';
  isActive?: boolean;
}

export interface CreateNotificationRequest {
  userId: string;
  type: Notification['type'];
  title: Record<string, string>;
  message: Record<string, string>;
  data?: Record<string, any>;
  scheduledFor?: Date;
}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<Notification['type'], number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  byType: Record<'category' | 'tag' | 'author', number>;
  byFrequency: Record<'immediate' | 'daily' | 'weekly', number>;
}

// Email template types
export interface EmailTemplate {
  subject: Record<string, string>;
  html: Record<string, string>;
  text: Record<string, string>;
}

export interface EmailNotificationData {
  user: {
    id: string;
    email: string;
    fullName?: string;
    preferredLocale: string;
  };
  notification: Notification;
  unsubscribeUrl: string;
}

export interface DigestEmailData {
  user: {
    id: string;
    email: string;
    fullName?: string;
    preferredLocale: string;
  };
  digest: NotificationDigest;
  unsubscribeUrl: string;
  managePreferencesUrl: string;
}

// Push notification types
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UserPushSubscription {
  id: string;
  userId: string;
  subscription: PushSubscription;
  userAgent?: string;
  createdAt: Date;
  lastUsed?: Date;
}
