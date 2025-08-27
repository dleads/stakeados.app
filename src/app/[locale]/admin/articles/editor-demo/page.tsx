'use client';

import React from 'react';
import AdvancedArticleEditor from '@/components/admin/articles/AdvancedArticleEditor';
import {
  adminArticleSchema,
  articleScheduleSchema,
} from '@/lib/schemas/articles';
import type { z } from 'zod';

type AdminArticleData = z.infer<typeof adminArticleSchema>;
type ArticleScheduleData = z.infer<typeof articleScheduleSchema>;

export default function EditorDemoPage() {
  const handleSave = async (articleData: AdminArticleData) => {
    console.log('Save article:', articleData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSchedule = async (scheduleData: ArticleScheduleData) => {
    console.log('Schedule article:', scheduleData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handlePublish = async (articleData: AdminArticleData) => {
    console.log('Publish article:', articleData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleError = (error: string) => {
    console.error('Editor error:', error);
    alert(error);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Article Editor Demo
          </h1>
          <p className="text-gray-600">
            This is a demo of the advanced article editor with all features
            enabled.
          </p>
        </div>

        <AdvancedArticleEditor
          onSave={handleSave}
          onSchedule={handleSchedule}
          onPublish={handlePublish}
          onError={handleError}
        />
      </div>
    </div>
  );
}
