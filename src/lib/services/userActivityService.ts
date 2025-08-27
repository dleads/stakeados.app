/**
 * User Activity Service
 * Handles logging and tracking of user activities throughout the system
 */

interface ActivityLogData {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  user_id?: string;
}

class UserActivityService {
  private static instance: UserActivityService;

  static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService();
    }
    return UserActivityService.instance;
  }

  /**
   * Log a user activity
   */
  async logActivity(data: ActivityLogData): Promise<void> {
    try {
      await fetch('/api/admin/users/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, details?: Record<string, any>): Promise<void> {
    await this.logActivity({
      action: 'login',
      user_id: userId,
      details: {
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
  }

  /**
   * Log user logout
   */
  async logLogout(
    userId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      action: 'logout',
      user_id: userId,
      details: {
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
  }

  /**
   * Log article creation
   */
  async logArticleCreate(
    articleId: string,
    title: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'article.create',
      resource_type: 'article',
      resource_id: articleId,
      user_id: userId,
      details: {
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log article edit
   */
  async logArticleEdit(
    articleId: string,
    title: string,
    changes: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'article.edit',
      resource_type: 'article',
      resource_id: articleId,
      user_id: userId,
      details: {
        title,
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log article deletion
   */
  async logArticleDelete(
    articleId: string,
    title: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'article.delete',
      resource_type: 'article',
      resource_id: articleId,
      user_id: userId,
      details: {
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log article publication
   */
  async logArticlePublish(
    articleId: string,
    title: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'article.publish',
      resource_type: 'article',
      resource_id: articleId,
      user_id: userId,
      details: {
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log news creation
   */
  async logNewsCreate(
    newsId: string,
    title: string,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'news.create',
      resource_type: 'news',
      resource_id: newsId,
      user_id: userId,
      details: {
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log news edit
   */
  async logNewsEdit(
    newsId: string,
    title: string,
    changes: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'news.edit',
      resource_type: 'news',
      resource_id: newsId,
      user_id: userId,
      details: {
        title,
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user creation
   */
  async logUserCreate(
    targetUserId: string,
    email: string,
    role: string,
    adminUserId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'user.create',
      resource_type: 'user',
      resource_id: targetUserId,
      user_id: adminUserId,
      details: {
        email,
        role,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user edit
   */
  async logUserEdit(
    targetUserId: string,
    email: string,
    changes: Record<string, any>,
    adminUserId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'user.edit',
      resource_type: 'user',
      resource_id: targetUserId,
      user_id: adminUserId,
      details: {
        email,
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(
    targetUserId: string,
    oldRole: string,
    newRole: string,
    adminUserId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'role.change',
      resource_type: 'user',
      resource_id: targetUserId,
      user_id: adminUserId,
      details: {
        oldRole,
        newRole,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log settings update
   */
  async logSettingsUpdate(
    settingType: string,
    changes: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'settings.update',
      resource_type: 'settings',
      resource_id: settingType,
      user_id: userId,
      details: {
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const userActivityService = UserActivityService.getInstance();
