import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bulkArticleSchema = z.object({
  articleIds: z.array(z.string().uuid()),
  operation: z.enum(['publish', 'archive', 'categorize', 'tag', 'delete']),
  data: z
    .object({
      categoryId: z.string().uuid().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
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

    // Check admin permissions
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

    const body = await request.json();
    const { articleIds, operation, data } = bulkArticleSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      processedIds: [] as string[],
    };

    // Process each article
    for (const articleId of articleIds) {
      try {
        let updateData: any = {};

        switch (operation) {
          case 'publish':
            updateData = {
              status: 'published',
              published_at: new Date().toISOString(),
            };
            break;
          case 'archive':
            updateData = {
              status: 'archived',
            };
            break;
          case 'categorize':
            if (data?.categoryId) {
              updateData = { category_id: data.categoryId };
            }
            break;
          case 'tag':
            // Tags functionality not implemented - column doesn't exist in articles table
            results.errors.push(
              `Article ${articleId}: Tags functionality not available`
            );
            results.failed++;
            continue;
            break;
          case 'delete':
            updateData = { status: 'archived' }; // Soft delete
            break;
        }

        const { error } = await supabase
          .from('articles')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', articleId);

        if (error) {
          results.failed++;
          results.errors.push(`Article ${articleId}: ${error.message}`);
        } else {
          results.success++;
          results.processedIds.push(articleId);

          // Log the change in article history
          await supabase.from('article_history').insert({
            article_id: articleId,
            changed_by: user.id,
            change_type: 'updated',
            new_values: updateData,
            notes: `Bulk operation: ${operation}`,
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Article ${articleId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      message: `Bulk operation completed. ${results.success} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    console.error('Bulk articles operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
