import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { z } from 'zod';

// Schema for updating a tag
const updateTagSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  slug: z.string().min(1).max(50).trim().optional(),
});

// PUT /api/admin/tags/[id] - Update tag information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;

    const tagId = params.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const updateData = updateTagSchema.parse(body);

    // Check if tag exists
    const { data: existingTag, error: fetchError } = await (supabase as any)
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // If updating name or slug, check for conflicts
    if (updateData.name || updateData.slug) {
      const checkName = updateData.name || existingTag.name;
      const checkSlug =
        updateData.slug ||
        (updateData.name
          ? updateData.name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '')
          : existingTag.slug);

      const { data: conflictTag } = await (supabase as any)
        .from('tags')
        .select('id, name, slug')
        .or(`name.eq.${checkName},slug.eq.${checkSlug}`)
        .neq('id', tagId)
        .single();

      if (conflictTag) {
        return NextResponse.json(
          {
            error:
              conflictTag.name === checkName
                ? 'Tag name already exists'
                : 'Tag slug already exists',
          },
          { status: 409 }
        );
      }

      // Auto-generate slug if name is updated but slug is not provided
      if (updateData.name && !updateData.slug) {
        updateData.slug = checkSlug;
      }
    }

    // Update the tag
    const { data: updatedTag, error: updateError } = await (supabase as any)
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tag:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Tag updated successfully',
      tag: updatedTag,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/admin/tags/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags/[id] - Remove unused tags
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    const tagId = params.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID format' },
        { status: 400 }
      );
    }

    // Check if tag exists
    const { data: existingTag, error: fetchError } = await (supabase as any)
      .from('tags')
      .select('id, name, usage_count')
      .eq('id', tagId)
      .single();

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if tag is in use
    if (existingTag.usage_count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete tag that is currently in use',
          usageCount: existingTag.usage_count,
        },
        { status: 400 }
      );
    }

    // Delete the tag
    const { error: deleteError } = await (supabase as any)
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      console.error('Error deleting tag:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Tag deleted successfully',
      deletedTag: {
        id: tagId,
        name: existingTag.name,
        usageCount: existingTag.usage_count,
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tags/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/tags/[id] - Get tag details with usage information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    const tagId = params.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID format' },
        { status: 400 }
      );
    }

    // Get tag details
    const { data: tag, error: tagError } = await (supabase as any)
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get articles using this tag
    const { data: articleTags, error: articleTagsError } = await (
      supabase as any
    )
      .from('article_tags')
      .select(
        `
        articles (
          id,
          title,
          status,
          published_at,
          created_at
        )
      `
      )
      .eq('tag_id', tagId);

    if (articleTagsError) {
      console.error('Error fetching article tags:', articleTagsError);
      return NextResponse.json(
        { error: 'Failed to fetch tag usage' },
        { status: 500 }
      );
    }

    const articles =
      (articleTags?.map((at: any) => at.articles).filter(Boolean) as any[]) ||
      [];
    const publishedArticles = articles.filter(
      (a: any) => a.status === 'published'
    ).length;
    const draftArticles = articles.filter(
      (a: any) => a.status === 'draft'
    ).length;

    return NextResponse.json({
      tag,
      articles,
      statistics: {
        totalArticles: articles.length,
        publishedArticles,
        draftArticles,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/tags/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
