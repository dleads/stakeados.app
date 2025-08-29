import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bulkNewsSchema = z.object({
  newsIds: z.array(z.string().uuid()),
  operation: z.enum(['categorize', 'process', 'approve', 'reject', 'delete']),
  data: z
    .object({
      categoryId: z.string().uuid().optional(),
      processed: z.boolean().optional(),
      status: z.string().optional(),
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
    const { newsIds, operation, data } = bulkNewsSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      processedIds: [] as string[],
    };

    // Process each news item
    for (const newsId of newsIds) {
      try {
        let updateData: any = {};

        switch (operation) {
          case 'categorize':
            if (data?.categoryId) {
              updateData = { category_id: data.categoryId };
            }
            break;
          case 'process':
            updateData = {
              processed: true,
              ai_metadata: {
                processed_at: new Date().toISOString(),
                processed_by: user.id,
              },
            };
            break;
          case 'approve':
            updateData = {
              processed: true,
              published_at: new Date().toISOString(),
            };
            break;
          case 'reject':
            updateData = {
              processed: false,
              ai_metadata: {
                rejected_at: new Date().toISOString(),
                rejected_by: user.id,
              },
            };
            break;
          case 'delete':
            // For news, we actually delete since they're aggregated content
            const { error: deleteError } = await supabase
              .from('news')
              .delete()
              .eq('id', newsId);

            if (deleteError) {
              results.failed++;
              results.errors.push(`News ${newsId}: ${deleteError.message}`);
            } else {
              results.success++;
              results.processedIds.push(newsId);
            }
            continue; // Skip the update operation below
        }

        const { error } = await supabase
          .from('news')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', newsId);

        if (error) {
          results.failed++;
          results.errors.push(`News ${newsId}: ${error.message}`);
        } else {
          results.success++;
          results.processedIds.push(newsId);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `News ${newsId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      message: `Bulk operation completed. ${results.success} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    console.error('Bulk news operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
