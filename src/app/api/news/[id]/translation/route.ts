import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { z } from 'zod';

// Enhanced validation schema for translation requests
const translationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content too long'),
  locale: z.enum(['es', 'en'], {
    errorMap: () => ({ message: 'Locale must be "es" or "en"' }),
  }),
  summary: z.string().max(1000, 'Summary too long').optional(),
  ai_translated: z.boolean().default(false),
  translation_confidence: z.number().min(0).max(1).optional(),
});

// Enhanced error types for better error handling
enum TranslationErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NEWS_NOT_FOUND = 'NEWS_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

interface ApiError {
  code: TranslationErrorCodes;
  message: string;
  details?: any;
  timestamp: string;
  request_id: string;
}

function createErrorResponse(
  code: TranslationErrorCodes,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): NextResponse {
  const error: ApiError = {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    request_id: requestId || crypto.randomUUID(),
  };

  return NextResponse.json({ error }, { status });
}

async function checkPermissions(supabase: any, userId: string, newsId: string) {
  // Check if user has admin/editor permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || !['admin', 'editor', 'author'].includes(profile.role)) {
    return { hasPermission: false, reason: 'insufficient_role' };
  }

  // Check if news item exists and user has access
  const { data: newsItem, error } = await supabase
    .from('news')
    .select('id, title, author_id')
    .eq('id', newsId)
    .single();

  if (error || !newsItem) {
    return { hasPermission: false, reason: 'news_not_found' };
  }

  // Authors can only edit their own content, admins/editors can edit any
  if (profile.role === 'author' && newsItem.author_id !== userId) {
    return { hasPermission: false, reason: 'not_owner' };
  }

  return { hasPermission: true, newsItem };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID();

  try {
    // Validate news ID format
    if (
      !params.id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.id
      )
    ) {
      return createErrorResponse(
        TranslationErrorCodes.VALIDATION_ERROR,
        'Invalid news ID format',
        400,
        { provided_id: params.id },
        requestId
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Authentication error:', authError);
      return createErrorResponse(
        TranslationErrorCodes.UNAUTHORIZED,
        'Authentication failed',
        401,
        { auth_error: authError.message },
        requestId
      );
    }

    if (!user) {
      return createErrorResponse(
        TranslationErrorCodes.UNAUTHORIZED,
        'User not authenticated',
        401,
        undefined,
        requestId
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        TranslationErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body',
        400,
        {
          parse_error:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
        },
        requestId
      );
    }

    // Validate request data
    const validationResult = translationSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse(
        TranslationErrorCodes.VALIDATION_ERROR,
        'Request validation failed',
        400,
        { validation_errors: validationResult.error.errors },
        requestId
      );
    }

    const validatedData = validationResult.data;

    // Check permissions
    const permissionCheck = await checkPermissions(
      supabase,
      user.id,
      params.id
    );
    if (!permissionCheck.hasPermission) {
      const statusCode =
        permissionCheck.reason === 'news_not_found' ? 404 : 403;
      const errorCode =
        permissionCheck.reason === 'news_not_found'
          ? TranslationErrorCodes.NEWS_NOT_FOUND
          : TranslationErrorCodes.FORBIDDEN;

      return createErrorResponse(
        errorCode,
        permissionCheck.reason === 'news_not_found'
          ? 'News item not found'
          : 'Insufficient permissions to update this news item',
        statusCode,
        { reason: permissionCheck.reason },
        requestId
      );
    }

    // Prepare update data
    const updateData: any = {
      title: validatedData.title,
      content: validatedData.content,
      language: validatedData.locale,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.summary) {
      updateData.summary = validatedData.summary;
    }

    // Add AI translation metadata if provided
    if (validatedData.ai_translated) {
      updateData.ai_metadata = {
        ...permissionCheck.newsItem?.ai_metadata,
        translation: {
          ai_translated: true,
          confidence: validatedData.translation_confidence,
          translated_at: new Date().toISOString(),
          translated_by: user.id,
          source_locale: validatedData.locale === 'es' ? 'en' : 'es',
        },
      };
    }

    // Update the news item
    const { data: updatedNews, error: updateError } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', params.id)
      .select(
        `
        id,
        title,
        content,
        summary,
        language,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return createErrorResponse(
        TranslationErrorCodes.DATABASE_ERROR,
        'Failed to update news translation',
        500,
        { db_error: updateError.message },
        requestId
      );
    }

    // Log successful translation update
    console.log(
      `Translation updated successfully for news ${params.id} by user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Translation updated successfully',
      data: {
        id: updatedNews?.id,
        title: updatedNews?.title,
        locale: updatedNews?.language,
        summary: updatedNews?.summary,
        content_length: updatedNews?.content?.length || 0,
        ai_translated: validatedData.ai_translated,
        updated_at: updatedNews?.updated_at,
      },
      request_id: requestId,
    });
  } catch (error) {
    console.error('Unexpected error in translation update:', error);
    return createErrorResponse(
      TranslationErrorCodes.TRANSLATION_FAILED,
      'An unexpected error occurred while updating translation',
      500,
      {
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
      requestId
    );
  }
}
