import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { aiContentService } from '@/lib/services/aiContentService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, title } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Get AI-powered tag suggestions
    const aiSuggestions = await aiContentService.suggestTags(content, title);

    // Get existing tags from database for comparison
    // Note: content_tags table doesn't exist yet, using empty array for now
    const existingTags: Array<{ name: string; usage_count: number }> = [];

    // Combine AI suggestions with existing popular tags
    const suggestions = aiSuggestions.map(suggestion => {
      const existingTag = existingTags?.find(
        tag => tag.name.toLowerCase() === suggestion.toLowerCase()
      );

      return {
        tag: suggestion,
        confidence: existingTag ? 0.9 : 0.7, // Higher confidence for existing tags
        reason: existingTag
          ? `Popular existing tag (used ${existingTag.usage_count} times)`
          : 'AI-generated suggestion based on content analysis',
        isExisting: !!existingTag,
        usageCount: existingTag?.usage_count || 0,
      };
    });

    // Sort by confidence and usage
    suggestions.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return b.usageCount - a.usageCount;
    });

    return NextResponse.json(suggestions.slice(0, 10));
  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate tag suggestions' },
      { status: 500 }
    );
  }
}
