// Email service functions for different user actions

import { EmailTemplateFactory, emailQueue } from './templates';
import { sendEmail } from './resend';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/types';

// Send welcome email when user signs up
export async function sendWelcomeEmail(
  userId: string,
  userEmail: string,
  displayName: string,
  locale: Locale = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EmailTemplateFactory.welcome(
      userEmail,
      displayName,
      locale
    );
    const result = await sendEmail(template);

    // Log email activity
    if (result.success) {
      await logEmailActivity(userId, 'welcome', userEmail);
    }

    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send course completion email with certificate
export async function sendCourseCompletionEmail(
  userId: string,
  userEmail: string,
  displayName: string,
  courseName: string,
  certificateId: string,
  locale: Locale = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificateId}`;
    const template = EmailTemplateFactory.courseCompletion(
      userEmail,
      displayName,
      courseName,
      certificateUrl,
      locale
    );

    const result = await sendEmail(template);

    if (result.success) {
      await logEmailActivity(userId, 'course_completion', userEmail, {
        courseName,
        certificateId,
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending course completion email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send achievement notification email
export async function sendAchievementEmail(
  userId: string,
  userEmail: string,
  displayName: string,
  achievementName: string,
  achievementDescription: string,
  locale: Locale = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EmailTemplateFactory.achievement(
      userEmail,
      displayName,
      achievementName,
      achievementDescription,
      locale
    );

    const result = await sendEmail(template);

    if (result.success) {
      await logEmailActivity(userId, 'achievement', userEmail, {
        achievementName,
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending achievement email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send weekly digest email
export async function sendWeeklyDigestEmail(
  userId: string,
  userEmail: string,
  displayName: string,
  digestData: {
    coursesCompleted: number;
    pointsEarned: number;
    newAchievements: string[];
    recommendedCourses: Array<{ title: string; url: string }>;
  },
  locale: Locale = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EmailTemplateFactory.weeklyDigest(
      userEmail,
      displayName,
      digestData,
      locale
    );

    const result = await sendEmail(template);

    if (result.success) {
      await logEmailActivity(userId, 'weekly_digest', userEmail);
    }

    return result;
  } catch (error) {
    console.error('Error sending weekly digest email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send Genesis invitation email
export async function sendGenesisInvitationEmail(
  userEmail: string,
  displayName: string,
  inviteCode: string,
  locale: Locale = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EmailTemplateFactory.genesisInvitation(
      userEmail,
      displayName,
      inviteCode,
      locale
    );

    return await sendEmail(template);
  } catch (error) {
    console.error('Error sending Genesis invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send newsletter to subscribers
export async function sendNewsletterToSubscribers(content: {
  title: string;
  articles: Array<{ title: string; url: string; description: string }>;
  announcements: Array<{ title: string; description: string }>;
}): Promise<{ success: boolean; sent: number; errors: number }> {
  try {
    // Get all newsletter subscribers
    const supabase = createClient();
    const { data: subscribers, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, username')
      .not('email', 'is', null);

    if (error) {
      throw error;
    }

    if (!subscribers || subscribers.length === 0) {
      return { success: true, sent: 0, errors: 0 };
    }

    // Create email templates for all subscribers
    const templates = subscribers.map(subscriber =>
      EmailTemplateFactory.newsletter(
        subscriber.email,
        subscriber.display_name || subscriber.username || 'User',
        content,
        'en' // Default to English for now
      )
    );

    // Add to queue for batch processing
    emailQueue.addBatch(templates);

    // Process queue
    await emailQueue.process();

    return {
      success: true,
      sent: templates.length,
      errors: 0,
    };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return {
      success: false,
      sent: 0,
      errors: 1,
    };
  }
}

// Log email activity for analytics
async function logEmailActivity(
  userId: string,
  emailType: string,
  recipient: string,
  metadata?: any
): Promise<void> {
  try {
    // In a production app, you might want to create an email_logs table
    // For now, we'll just log to console
    console.log('Email activity logged:', {
      userId,
      emailType,
      recipient,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging email activity:', error);
  }
}

// Get user email preferences
export async function getUserEmailPreferences(_userId: string): Promise<{
  emailNotifications: boolean;
  courseUpdates: boolean;
  achievementAlerts: boolean;
  communityUpdates: boolean;
  marketingEmails: boolean;
}> {
  try {
    // This would typically come from a user_preferences table
    // For now, return default preferences
    return {
      emailNotifications: true,
      courseUpdates: true,
      achievementAlerts: true,
      communityUpdates: false,
      marketingEmails: false,
    };
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return {
      emailNotifications: false,
      courseUpdates: false,
      achievementAlerts: false,
      communityUpdates: false,
      marketingEmails: false,
    };
  }
}

// Update user email preferences
export async function updateUserEmailPreferences(
  userId: string,
  preferences: {
    emailNotifications?: boolean;
    courseUpdates?: boolean;
    achievementAlerts?: boolean;
    communityUpdates?: boolean;
    marketingEmails?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would typically update a user_preferences table
    // For now, just log the update
    console.log('Email preferences updated:', { userId, preferences });
    return { success: true };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Unsubscribe user from emails
export async function unsubscribeUser(
  userEmail: string,
  unsubscribeToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify unsubscribe token and update preferences
    // This would typically involve token validation
    console.log('User unsubscribed:', { userEmail, unsubscribeToken });
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
