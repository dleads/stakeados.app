import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('content_id');

    if (contentId) {
      // Get stats for specific content
      return getContentStats(supabase, contentId);
    } else {
      // Get global translation stats
      return getGlobalStats(supabase);
    }
  } catch (error) {
    console.error('Error in translation stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getContentStats(supabase: any, contentId: string) {
  // Get content type first
  const { data: article } = await supabase
    .from('articles')
    .select('id, title, content, meta_description')
    .eq('id', contentId)
    .single();

  const { data: news } = await supabase
    .from('news_articles')
    .select('id, title, summary, content')
    .eq('id', contentId)
    .single();

  const content = article || news;
  const contentType = article ? 'article' : 'news';

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Check translation completeness
  const locales = ['en', 'es'];
  const fields =
    contentType === 'article'
      ? ['title', 'content', 'meta_description']
      : ['title', 'summary', 'content'];

  let fullyTranslated = 0;
  let partiallyTranslated = 0;
  let pendingTranslation = 0;

  const byLocale: any = {};

  for (const locale of locales) {
    let translatedFields = 0;

    for (const field of fields) {
      if (
        content[field] &&
        content[field][locale] &&
        content[field][locale].trim() !== ''
      ) {
        translatedFields++;
      }
    }

    const percentage = (translatedFields / fields.length) * 100;

    byLocale[locale] = {
      translated: translatedFields,
      pending: fields.length - translatedFields,
      percentage,
    };

    if (percentage === 100) {
      fullyTranslated++;
    } else if (percentage > 0) {
      partiallyTranslated++;
    } else {
      pendingTranslation++;
    }
  }

  // Get recent translation activity for this content
  const { data: recentActivity } = await supabase
    .from('translation_tasks')
    .select(
      `
      id,
      content_id,
      content_type,
      source_locale,
      target_locale,
      status,
      created_at,
      updated_at,
      translator:translator_id(name)
    `
    )
    .eq('content_id', contentId)
    .order('updated_at', { ascending: false })
    .limit(10);

  const formattedActivity =
    recentActivity?.map((activity: any) => ({
      id: activity.id,
      content_id: activity.content_id,
      content_title: content.title?.en || content.title?.es || 'Untitled',
      content_type: activity.content_type,
      source_locale: activity.source_locale,
      target_locale: activity.target_locale,
      translator_name: activity.translator?.name || 'Unknown',
      action: activity.status === 'completed' ? 'completed' : 'updated',
      created_at: activity.updated_at,
    })) || [];

  return NextResponse.json({
    total_content: 1,
    fully_translated: fullyTranslated,
    partially_translated: partiallyTranslated,
    pending_translation: pendingTranslation,
    by_locale: byLocale,
    by_content_type: {
      [contentType]: {
        total: 1,
        translated: fullyTranslated,
        pending: pendingTranslation,
      },
    },
    recent_activity: formattedActivity,
  });
}

async function getGlobalStats(supabase: any) {
  // Get all articles and news
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content, meta_description, status')
    .eq('status', 'published');

  const { data: news } = await supabase
    .from('news_articles')
    .select('id, title, summary, content');

  const allContent = [
    ...(articles || []).map((item: any) => ({ ...item, type: 'article' })),
    ...(news || []).map((item: any) => ({ ...item, type: 'news' })),
  ];

  let fullyTranslated = 0;
  let partiallyTranslated = 0;
  let pendingTranslation = 0;

  const byLocale: any = {
    en: { translated: 0, pending: 0, percentage: 0 },
    es: { translated: 0, pending: 0, percentage: 0 },
  };

  const byContentType: any = {
    articles: { total: 0, translated: 0, pending: 0 },
    news: { total: 0, translated: 0, pending: 0 },
  };

  for (const content of allContent) {
    const fields =
      content.type === 'article'
        ? ['title', 'content', 'meta_description']
        : ['title', 'summary', 'content'];

    let localeCompleteness = { en: 0, es: 0 };

    for (const locale of ['en', 'es']) {
      let translatedFields = 0;

      for (const field of fields) {
        if (
          content[field] &&
          content[field][locale] &&
          content[field][locale].trim() !== ''
        ) {
          translatedFields++;
        }
      }

      const percentage = (translatedFields / fields.length) * 100;
      localeCompleteness[locale as 'en' | 'es'] = percentage;

      if (percentage === 100) {
        byLocale[locale].translated++;
      } else {
        byLocale[locale].pending++;
      }
    }

    // Overall content completeness
    const avgCompleteness = (localeCompleteness.en + localeCompleteness.es) / 2;

    if (avgCompleteness === 100) {
      fullyTranslated++;
    } else if (avgCompleteness > 0) {
      partiallyTranslated++;
    } else {
      pendingTranslation++;
    }

    // Update content type stats
    const contentTypeKey = content.type === 'article' ? 'articles' : 'news';
    byContentType[contentTypeKey].total++;

    if (avgCompleteness === 100) {
      byContentType[contentTypeKey].translated++;
    } else {
      byContentType[contentTypeKey].pending++;
    }
  }

  // Calculate locale percentages
  for (const locale of ['en', 'es']) {
    const total = byLocale[locale].translated + byLocale[locale].pending;
    byLocale[locale].percentage =
      total > 0 ? (byLocale[locale].translated / total) * 100 : 0;
  }

  // Get recent translation activity
  const { data: recentActivity } = await supabase
    .from('translation_tasks')
    .select(
      `
      id,
      content_id,
      content_type,
      source_locale,
      target_locale,
      status,
      created_at,
      updated_at,
      translator:translator_id(name)
    `
    )
    .order('updated_at', { ascending: false })
    .limit(20);

  // Get content titles for activity
  const activityWithTitles = await Promise.all(
    (recentActivity || []).map(async (activity: any) => {
      let contentTitle = 'Untitled';

      if (activity.content_type === 'article') {
        const { data: article } = await supabase
          .from('articles')
          .select('title')
          .eq('id', activity.content_id)
          .single();

        if (article?.title) {
          contentTitle = article.title.en || article.title.es || 'Untitled';
        }
      } else if (activity.content_type === 'news') {
        const { data: newsItem } = await supabase
          .from('news_articles')
          .select('title')
          .eq('id', activity.content_id)
          .single();

        if (newsItem?.title) {
          contentTitle = newsItem.title.en || newsItem.title.es || 'Untitled';
        }
      }

      return {
        id: activity.id,
        content_id: activity.content_id,
        content_title: contentTitle,
        content_type: activity.content_type,
        source_locale: activity.source_locale,
        target_locale: activity.target_locale,
        translator_name: activity.translator?.name || 'Unknown',
        action: activity.status === 'completed' ? 'completed' : 'updated',
        created_at: activity.updated_at,
      };
    })
  );

  return NextResponse.json({
    total_content: allContent.length,
    fully_translated: fullyTranslated,
    partially_translated: partiallyTranslated,
    pending_translation: pendingTranslation,
    by_locale: byLocale,
    by_content_type: byContentType,
    recent_activity: activityWithTitles,
  });
}
