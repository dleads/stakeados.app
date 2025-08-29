import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // TODO: Implement when translation_tasks table is created
    // Return mock tasks for now
    console.log(
      `Getting translation tasks with status: ${status}, language: ${language}`
    );

    const mockTasks = [
      {
        id: '1',
        content_type: 'article',
        content_id: 'article-1',
        source_language: 'en',
        target_language: 'es',
        status: 'pending',
        priority: 'high',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        translator_id: user.id,
        translator: {
          name: 'Mock Translator',
          avatar_url: null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        original_content: 'This is urgent content that needs translation.',
        translated_content: null,
        notes: null,
      },
      {
        id: '2',
        content_type: 'news',
        content_id: 'news-1',
        source_language: 'en',
        target_language: 'fr',
        status: 'in_progress',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        translator_id: user.id,
        translator: {
          name: 'Mock Translator',
          avatar_url: null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        original_content: 'This content is currently being translated.',
        translated_content:
          'Ce contenu est actuellement en cours de traduction.',
        notes: 'Work in progress',
      },
    ];

    // Filter by status if provided
    let filteredTasks = mockTasks;
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    if (language) {
      filteredTasks = filteredTasks.filter(
        task => task.target_language === language
      );
    }

    // Apply pagination
    const paginatedTasks = filteredTasks.slice(offset, offset + limit);

    return NextResponse.json({
      tasks: paginatedTasks,
      total: filteredTasks.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get translation tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to get translation tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      content_type,
      content_id,
      source_language,
      target_language,
      priority,
      deadline,
    } = await request.json();

    if (!content_type || !content_id || !source_language || !target_language) {
      return NextResponse.json(
        {
          error:
            'Content type, content ID, source language, and target language are required',
        },
        { status: 400 }
      );
    }

    // TODO: Implement when translation_tasks table is created
    // Return mock success response for now
    console.log(`Creating translation task for ${content_type} ${content_id}`);

    const mockTask = {
      id: 'new-task-' + Date.now(),
      content_type,
      content_id,
      source_language,
      target_language,
      status: 'pending',
      priority: priority || 'medium',
      deadline:
        deadline ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      translator_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      task: mockTask,
      message: 'Translation task created successfully (mock response)',
    });
  } catch (error) {
    console.error('Create translation task error:', error);
    return NextResponse.json(
      { error: 'Failed to create translation task' },
      { status: 500 }
    );
  }
}
