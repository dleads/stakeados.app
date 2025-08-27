import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bulkCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()),
  operation: z.enum(['reorder', 'merge', 'delete', 'update']),
  data: z
    .object({
      newOrder: z
        .array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number(),
          })
        )
        .optional(),
      targetCategoryId: z.string().uuid().optional(), // For merge operation
      updates: z
        .object({
          color: z.string().optional(),
          parent_id: z.string().uuid().nullable().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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
    const { categoryIds, operation, data } = bulkCategoriesSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      processedIds: [] as string[],
    };

    switch (operation) {
      case 'reorder':
        if (data?.newOrder) {
          for (const item of data.newOrder) {
            try {
              const { error } = await supabase
                .from('categories')
                .update({
                  sort_order: item.sort_order,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);

              if (error) {
                results.failed++;
                results.errors.push(`Category ${item.id}: ${error.message}`);
              } else {
                results.success++;
                results.processedIds.push(item.id);
              }
            } catch (error) {
              results.failed++;
              results.errors.push(
                `Category ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
        break;

      case 'merge':
        if (data?.targetCategoryId) {
          for (const categoryId of categoryIds) {
            if (categoryId === data.targetCategoryId) continue; // Skip target category

            try {
              // Move all articles from source category to target category
              await supabase
                .from('articles')
                .update({ category_id: data.targetCategoryId })
                .eq('category_id', categoryId);

              // Move all news from source category to target category
              await supabase
                .from('news')
                .update({ category_id: data.targetCategoryId })
                .eq('category_id', categoryId);

              // Move child categories to target category
              await supabase
                .from('categories')
                .update({ parent_id: data.targetCategoryId })
                .eq('parent_id', categoryId);

              // Delete the source category
              const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

              if (error) {
                results.failed++;
                results.errors.push(`Category ${categoryId}: ${error.message}`);
              } else {
                results.success++;
                results.processedIds.push(categoryId);
              }
            } catch (error) {
              results.failed++;
              results.errors.push(
                `Category ${categoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
        break;

      case 'update':
        if (data?.updates) {
          for (const categoryId of categoryIds) {
            try {
              const { error } = await supabase
                .from('categories')
                .update({
                  ...data.updates,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', categoryId);

              if (error) {
                results.failed++;
                results.errors.push(`Category ${categoryId}: ${error.message}`);
              } else {
                results.success++;
                results.processedIds.push(categoryId);
              }
            } catch (error) {
              results.failed++;
              results.errors.push(
                `Category ${categoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
        break;

      case 'delete':
        for (const categoryId of categoryIds) {
          try {
            // Check if category has content
            const { data: articles } = await supabase
              .from('articles')
              .select('id')
              .eq('category_id', categoryId)
              .limit(1);

            const { data: news } = await supabase
              .from('news')
              .select('id')
              .eq('category_id', categoryId)
              .limit(1);

            const { data: children } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', categoryId)
              .limit(1);

            if (articles?.length || news?.length || children?.length) {
              results.failed++;
              results.errors.push(
                `Category ${categoryId}: Cannot delete category with content or subcategories`
              );
              continue;
            }

            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

            if (error) {
              results.failed++;
              results.errors.push(`Category ${categoryId}: ${error.message}`);
            } else {
              results.success++;
              results.processedIds.push(categoryId);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(
              `Category ${categoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
        break;
    }

    return NextResponse.json({
      message: `Bulk operation completed. ${results.success} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    console.error('Bulk categories operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
