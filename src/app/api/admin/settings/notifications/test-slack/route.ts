import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }

    const slackConfig = await request.json();

    if (!slackConfig.webhookUrl) {
      return NextResponse.json(
        {
          error: 'Slack webhook URL is required',
        },
        { status: 400 }
      );
    }

    // Send test message to Slack
    try {
      const response = await fetch(slackConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: slackConfig.channel,
          username: 'Stakeados Admin',
          text: '🧪 Slack Configuration Test',
          attachments: [
            {
              color: 'good',
              title: 'Configuration Test Successful',
              text: 'This is a test message to verify your Slack webhook configuration is working correctly.',
              footer: 'Stakeados Admin Panel',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Test message sent to Slack successfully',
        });
      } else {
        const errorText = await response.text();
        return NextResponse.json(
          {
            error: `Slack webhook failed: ${response.status} ${errorText}`,
          },
          { status: 500 }
        );
      }
    } catch (fetchError: any) {
      console.error('Slack webhook error:', fetchError);
      return NextResponse.json(
        {
          error: `Failed to send Slack message: ${fetchError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Slack test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
