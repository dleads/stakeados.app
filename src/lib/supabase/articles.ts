import { createAnonClient } from './anon';
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
  // Use server-only API route to avoid leaking server code in client bundles
  const res = await fetch('/api/admin/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error creating article via API:', err);
    throw new Error(err?.error || 'Failed to create article');
  }

  return res.json();
};

// Update article
export const updateArticle = async (id: string, updates: ArticleUpdate) => {
  const res = await fetch(`/api/admin/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error updating article via API:', err);
    throw new Error(err?.error || 'Failed to update article');
  }

  return res.json();
};

// Delete article
export const deleteArticle = async (id: string) => {
  const res = await fetch(`/api/admin/articles/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error deleting (archiving) article via API:', err);
    throw new Error(err?.error || 'Failed to delete article');
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
  // Move article to review status via admin update route
  const res = await fetch(`/api/admin/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'review' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error submitting article for review via API:', err);
    throw new Error(err?.error || 'Failed to submit article for review');
  }

  return res.json();
};

// Approve article (admin only)
export const approveArticle = async (id: string) => {
  const res = await fetch(`/api/admin/articles/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', feedback: 'Approved by admin' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error approving article via API:', err);
    throw new Error(err?.error || 'Failed to approve article');
  }

  const json = await res.json();
  return json.article ?? json;
};

// Reject article (admin only)
export const rejectArticle = async (id: string) => {
  const res = await fetch(`/api/admin/articles/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject', feedback: 'Rejected by admin' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error rejecting article via API:', err);
    throw new Error(err?.error || 'Failed to reject article');
  }

  const json = await res.json();
  return json.article ?? json;
};

// Get article statistics
export const getArticleStatistics = async () => {
  const supabase = createAnonClient();
  const { data: allArticles, error: allError } = await supabase
    .from('articles')
    .select('status, author_id');

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

  const list = (allArticles ?? []) as Array<{ status: string; author_id: string }>;
  const stats = {
    total: list.length,
    published: list.filter(a => a.status === 'published').length,
    pending: list.filter(a => a.status === 'review').length,
    drafts: list.filter(a => a.status === 'draft').length,
    uniqueAuthors: new Set(list.map(a => a.author_id)).size,
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
