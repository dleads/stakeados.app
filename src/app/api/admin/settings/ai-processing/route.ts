export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Default configuration (temporary until system_settings table is created)
    const config = {
      openai: {
        model: 'gpt-4-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 30,
      },
      processing: {
        batchSize: 10,
        retryAttempts: 3,
        duplicateThreshold: 85,
        autoProcessing: true,
        processingSchedule: '0 * * * *', // Every hour
      },
      translation: {
        enabled: true,
        targetLanguages: ['es', 'en'],
        qualityThreshold: 80,
      },
      summarization: {
        enabled: true,
        maxLength: 300,
        minLength: 100,
      },
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in AI processing config GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const config = await request.json();

    // Validate configuration
    if (
      !config.openai ||
      !config.processing ||
      !config.translation ||
      !config.summarization
    ) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      );
    }

    // For now, just return success (temporary until system_settings table is created)
    console.log('AI Processing config updated:', config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in AI processing config PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
