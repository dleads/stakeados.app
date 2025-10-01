import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar rol de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, url, description, is_active } = body;

    // Actualizar fuente
    const { data: source, error } = await supabase
      .from('news_sources')
      .update({
        name,
        url,
        description,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating news source:', error);
      return NextResponse.json(
        { error: 'Failed to update source' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: source });
  } catch (error) {
    console.error('Error in news source update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest, // Required for Next.js API route signature
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar rol de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Eliminar fuente
    const { error } = await supabase
      .from('news_sources')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting news source:', error);
      return NextResponse.json(
        { error: 'Failed to delete source' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error in news source delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
