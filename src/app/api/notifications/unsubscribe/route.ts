export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { NotificationPreferencesServiceServer } from '@/lib/services/notificationPreferencesService.server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Decode token
    let userId: string, notificationType: string;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 2) throw new Error('Invalid token format');

      userId = parts[0];
      notificationType = parts[1];
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const supabase = await createClient();
    const subSvc = new SubscriptionService(supabase);
    const prefSvc = new NotificationPreferencesServiceServer(supabase as any);

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different unsubscribe types
    if (notificationType === 'digest') {
      // Disable digest notifications
      await prefSvc.updateUserPreferences(userId, {
        digestFrequency: 'none',
      });
    } else if (notificationType === 'all') {
      // Disable all email notifications
      await prefSvc.updateUserPreferences(userId, {
        emailEnabled: false,
      });
    } else {
      // Disable specific notification type subscriptions
      const subscriptions =
        await subSvc.getUserSubscriptions(userId);
      const relevantSubscriptions = subscriptions.filter(
        sub =>
          sub.subscriptionType === notificationType ||
          (notificationType === 'articles' &&
            sub.subscriptionType === 'category') ||
          (notificationType === 'news' && sub.subscriptionType === 'tag')
      );

      for (const subscription of relevantSubscriptions) {
        await subSvc.updateSubscription(userId, subscription.id, {
          isActive: false,
        });
      }
    }

    // Return success page HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Stakeados</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f9fafb;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .logo {
            color: #00FF88;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #00FF88;
            color: black;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 8px;
          }
          .button:hover {
            background-color: #00e67a;
          }
          .button-secondary {
            background-color: #f3f4f6;
            color: #374151;
          }
          .button-secondary:hover {
            background-color: #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Stakeados</div>
          <div class="success-icon">✅</div>
          <h1>Successfully Unsubscribed</h1>
          <p>
            You have been unsubscribed from ${
              notificationType === 'digest'
                ? 'digest emails'
                : notificationType === 'all'
                  ? 'all email notifications'
                  : `${notificationType} notifications`
            }.
          </p>
          <p>
            You can update your notification preferences at any time by visiting your account settings.
          </p>
          <div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
              Return to Stakeados
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" class="button button-secondary">
              Manage Preferences
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);

    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Stakeados</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f9fafb;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .logo {
            color: #00FF88;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #dc2626;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #00FF88;
            color: black;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Stakeados</div>
          <div class="error-icon">❌</div>
          <h1>Unsubscribe Failed</h1>
          <p>
            We encountered an error while processing your unsubscribe request. 
            Please try again or contact support if the problem persists.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
            Return to Stakeados
          </a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
