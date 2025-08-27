'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import AdvancedArticleEditor from '@/components/admin/articles/AdvancedArticleEditor';
import {
  adminArticleSchema,
  articleScheduleSchema,
} from '@/lib/schemas/articles';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserRole } from '@/types/roles';
import type { z } from 'zod';

type AdminArticleData = z.infer<typeof adminArticleSchema>;
type ArticleScheduleData = z.infer<typeof articleScheduleSchema>;

interface Article extends AdminArticleData {
  id: string;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const locale = params.locale as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load article data
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`);

        if (!response.ok) {
          throw new Error('Failed to load article');
        }

        const result = await response.json();
        setArticle(result.article);
      } catch (error) {
        console.error('Load error:', error);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadArticle();
    }
  }, [articleId, locale]);

  const handleSave = async (articleData: AdminArticleData) => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const result = await response.json();
      setArticle(result.article);

      // Redirect based on status
      if (articleData.status === 'published') {
        router.push(`/${locale}/admin/articles/${articleId}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleSchedule = async (scheduleData: ArticleScheduleData) => {
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scheduleData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to schedule article');
      }

      router.push(`/${locale}/admin/articles`);
    } catch (error) {
      console.error('Schedule error:', error);
      throw error;
    }
  };

  const handlePublish = async (articleData: AdminArticleData) => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...articleData,
          status: 'published',
          published_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish article');
      }

      const result = await response.json();
      setArticle(result.article);
      router.push(`/${locale}/admin/articles/${articleId}`);
    } catch (error) {
      console.error('Publish error:', error);
      throw error;
    }
  };

  const handleError = (error: string) => {
    console.error('Editor error:', error);
    alert(error); // Simple error handling for now
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Article not found'}</p>
          <button
            onClick={() => router.push(`/${locale}/admin/articles`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminLayout locale={params.locale as string}>
        <div className="min-h-screen bg-gray-50">
          <AdvancedArticleEditor
            article={article}
            onSave={handleSave}
            onSchedule={handleSchedule}
            onPublish={handlePublish}
            onError={handleError}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
