'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdvancedArticleEditor from '@/components/admin/articles/AdvancedArticleEditor';
import {
  adminArticleSchema,
  articleScheduleSchema,
} from '@/lib/schemas/articles';
import { UserRole } from '@/types/roles';
import type { z } from 'zod';

type AdminArticleData = z.infer<typeof adminArticleSchema>;
type ArticleScheduleData = z.infer<typeof articleScheduleSchema>;

export default function NewArticlePage({
  params,
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  const handleSave = async (articleData: AdminArticleData) => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const result = await response.json();

      // Redirect to the article edit page or list
      if (articleData.status === 'published') {
        router.push(`/${params.locale}/admin/articles/${result.article.id}`);
      } else {
        router.push(`/${params.locale}/admin/articles`);
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleSchedule = async (scheduleData: ArticleScheduleData) => {
    try {
      // First save the article as draft
      const articleData: AdminArticleData = {
        title: '',
        content: '',
        status: 'draft',
        language: 'es',
      };

      const articleResponse = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!articleResponse.ok) {
        throw new Error('Failed to save article');
      }

      const articleResult = await articleResponse.json();

      // Then schedule it
      const scheduleResponse = await fetch(
        `/api/admin/articles/${articleResult.article.id}/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scheduleData),
        }
      );

      if (!scheduleResponse.ok) {
        throw new Error('Failed to schedule article');
      }

      router.push(`/${params.locale}/admin/articles`);
    } catch (error) {
      console.error('Schedule error:', error);
      throw error;
    }
  };

  const handlePublish = async (articleData: AdminArticleData) => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
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
      router.push(`/${params.locale}/admin/articles/${result.article.id}`);
    } catch (error) {
      console.error('Publish error:', error);
      throw error;
    }
  };

  const handleError = (error: string) => {
    // You could integrate with a toast notification system here
    console.error('Editor error:', error);
    alert(error); // Simple error handling for now
  };

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminLayout locale={params.locale}>
        <div className="min-h-screen bg-gray-50">
          <AdvancedArticleEditor
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
