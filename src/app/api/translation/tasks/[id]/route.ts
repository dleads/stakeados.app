import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement when translation_tasks table is created
    // Return mock task data for now
    console.log(`Getting translation task ${params.id}`);

    const mockTask = {
      id: params.id,
      content_type: 'article',
      content_id: 'mock-content-id',
      source_language: 'en',
      target_language: 'es',
      status: 'pending',
      priority: 'medium',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      translator_id: user.id,
      translator: {
        name: 'Mock Translator',
        avatar_url: null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      original_content: 'This is the original content to be translated.',
      translated_content: null,
      notes: null,
    };

    return NextResponse.json(mockTask);
  } catch (error) {
    console.error('Get translation task error:', error);
    return NextResponse.json(
      { error: 'Failed to get translation task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, translated_content, notes } = await request.json();

    // TODO: Implement when translation_tasks table is created
    // Return mock success response for now
    console.log(`Updating translation task ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Translation task updated successfully (mock response)',
      task_id: params.id,
      status,
      translated_content: translated_content?.substring(0, 100) + '...',
      notes,
    });
  } catch (error) {
    console.error('Update translation task error:', error);
    return NextResponse.json(
      { error: 'Failed to update translation task' },
      { status: 500 }
    );
  }
}
