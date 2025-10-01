import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { articleProposalSchema } from '@/lib/schemas/articles';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = articleProposalSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsedData.error.errors,
        },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const proposalData = {
      ...parsedData.data,
      proposer_id: user.id,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('article_proposals')
      .insert([proposalData])
      .select(
        `
        *,
        proposer:profiles!proposer_id(display_name, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('article_proposals')
      .select(
        `
        *,
        proposer:profiles!proposer_id(display_name, avatar_url)
      `
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(
      page * limit,
      (page + 1) * limit - 1
    );

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      limit,
      hasMore: (count || 0) > (page + 1) * limit,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
