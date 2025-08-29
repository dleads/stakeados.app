import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locale, title, content, meta_description } = body;

    // Validate required fields
    if (!locale || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate locale
    if (!['en', 'es'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    // Get current article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit =
      article.author_id === user.id ||
      user.role === 'admin' ||
      user.role === 'editor';

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update the article with new translation
    // Parse existing title and content as JSON objects if they're strings
    let existingTitle = {};
    let existingContent = {};

    try {
      existingTitle =
        typeof article.title === 'string'
          ? JSON.parse(article.title)
          : article.title || {};
    } catch {
      existingTitle = {};
    }

    try {
      existingContent =
        typeof article.content === 'string'
          ? JSON.parse(article.content)
          : article.content || {};
    } catch {
      existingContent = {};
    }

    const updatedTitle = {
      ...existingTitle,
      [locale]: title,
    };

    const updatedContent = {
      ...existingContent,
      [locale]: content,
    };

    // Parse existing meta description
    let existingMetaDescription = {};
    try {
      existingMetaDescription =
        typeof article.seo_description === 'string'
          ? JSON.parse(article.seo_description)
          : article.seo_description || {};
    } catch {
      existingMetaDescription = {};
    }

    const updatedMetaDescription = {
      ...existingMetaDescription,
      [locale]: meta_description || '',
    };

    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update({
        title: JSON.stringify(updatedTitle),
        content: JSON.stringify(updatedContent),
        seo_description: JSON.stringify(updatedMetaDescription),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating article translation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update translation' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Error in article translation PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
