import { createAnonClient } from './anon';
import { createClient as createServerClient } from './server';
import type { Database } from './types';
import type { Locale } from '@/types';

type Article = Database['public']['Tables']['articles']['Row'];
type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

// Get all published articles
export const getPublishedArticles = async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching published articles:', error);
    throw error;
  }

  return data;
};

// Get article by ID
export const getArticleById = async (id: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    throw error;
  }

  return data;
};

// Get articles by category
export const getArticlesByCategory = async (category: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('category', category)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles by category:', error);
    throw error;
  }

  return data;
};

// Get articles by author
export const getArticlesByAuthor = async (authorId: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles by author:', error);
    throw error;
  }

  return data;
};

// Create a new article
export const createArticle = async (article: ArticleInsert) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('articles' as any)
    .insert(article as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating article:', error);
    throw error;
  }

  return data;
};

// Update article
export const updateArticle = async (id: string, updates: ArticleUpdate) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('articles' as any)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating article:', error);
    throw error;
  }

  return data;
};

// Delete article
export const deleteArticle = async (id: string) => {
  const supabase = await createServerClient();
  const { error } = await supabase.from('articles').delete().eq('id', id);

  if (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
};

// Get articles pending review
export const getArticlesPendingReview = async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'review')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles pending review:', error);
    throw error;
  }

  return data;
};

// Helper function to get localized article title
export const getArticleTitle = (
  article: Article,
  locale: Locale = 'en'
): string => {
  const title = article.title as any;
  return title?.[locale] || title?.en || 'Untitled Article';
};

// Helper function to get localized article content
export const getArticleContent = (
  article: Article,
  locale: Locale = 'en'
): string => {
  const content = article.content as any;
  return content?.[locale] || content?.en || 'No content available';
};

// Search articles
export const searchArticles = async (query: string) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'published')
    .or(
      `title->>en.ilike.%${query}%,title->>es.ilike.%${query}%,category.ilike.%${query}%`
    )
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error searching articles:', error);
    throw error;
  }

  return data;
};

// Get articles by tags
export const getArticlesByTags = async (tags: string[]) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'published')
    .overlaps('tags', tags)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles by tags:', error);
    throw error;
  }

  return data;
};

// Get all unique categories
export const getArticleCategories = async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select('category')
    .eq('status', 'published')
    .not('category', 'eq', '');

  if (error) {
    console.error('Error fetching article categories:', error);
    throw error;
  }

  const categories = [
    ...new Set((data as any[]).map((item: any) => item.category)),
  ];
  return categories.filter(Boolean);
};

// Get all unique tags
export const getArticleTags = async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select('tags')
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching article tags:', error);
    throw error;
  }

  const allTags = (data as any[]).flatMap((item: any) => item.tags || []);
  const uniqueTags = [...new Set(allTags)];
  return uniqueTags.filter(Boolean);
};

// Submit article for review
export const submitArticleForReview = async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'review' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error submitting article for review:', error);
    throw error;
  }

  return data;
};

// Approve article (admin only)
export const approveArticle = async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'published' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving article:', error);
    throw error;
  }

  return data;
};

// Reject article (admin only)
export const rejectArticle = async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'draft' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting article:', error);
    throw error;
  }

  return data;
};

// Get article statistics
export const getArticleStatistics = async () => {
  const supabase = createAnonClient();
  const { data: allArticles, error: allError } = await supabase
    .from('articles')
    .select('status, author_id') as { data: Array<{ status: string; author_id: string }> | null; error: any };

  if (allError) {
    console.error('Error fetching article statistics:', allError);
    return {
      total: 0,
      published: 0,
      pending: 0,
      drafts: 0,
      uniqueAuthors: 0,
    };
  }

  const stats = {
    total: allArticles.length,
    published: allArticles.filter(a => a.status === 'published').length,
    pending: allArticles.filter(a => a.status === 'review').length,
    drafts: allArticles.filter(a => a.status === 'draft').length,
    uniqueAuthors: new Set(allArticles.map(a => a.author_id)).size,
  };

  return stats;
};

// Get trending articles (most recent published)
export const getTrendingArticles = async (limit: number = 5) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending articles:', error);
    throw error;
  }

  return data;
};
