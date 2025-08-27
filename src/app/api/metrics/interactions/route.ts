import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { z } from 'zod';

const interactionSchema = z.object({
  content_id: z.string().uuid(),
  content_type: z.enum(['article', 'news']),
  interaction_type: z.enum([
    'view',
    'like',
    'share',
    'bookmark',
    'comment',
    'click',
    'scroll',
  ]),
  interaction_value: z.number().optional().default(1),
  metadata: z.record(z.any()).optional().default({}),
  session_id: z.string().optional(),
  device_info: z.record(z.any()).optional().default({}),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
});

const batchInteractionSchema = z.object({
  interactions: z.array(interactionSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate request body
    const validation = batchInteractionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { interactions } = validation.data;

    // Get user if authenticated (optional for metrics)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Prepare interactions with user_id if available
    const interactionsToInsert = interactions.map(interaction => ({
      ...interaction,
      user_id: user?.id || null,
      ip_address: request.ip || null,
      user_agent:
        interaction.user_agent || request.headers.get('user-agent') || null,
      referrer: interaction.referrer || request.headers.get('referer') || null,
    }));

    // TODO: Implement interaction recording when content_interactions table is available
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      recorded: interactionsToInsert.length,
      message: `Successfully recorded ${interactionsToInsert.length} interactions (placeholder)`,
    });
  } catch (error) {
    console.error('Metrics interactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    // TODO: Use these parameters when content_interactions table is available
    // const contentId = searchParams.get('content_id')
    // const contentType = searchParams.get('content_type') as 'article' | 'news' | null
    // const interactionType = searchParams.get('interaction_type')
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // TODO: Implement interaction fetching when content_interactions table is available
    // For now, return a placeholder response
    return NextResponse.json({
      interactions: [],
      total: 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Metrics interactions GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
