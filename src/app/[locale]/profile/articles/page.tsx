'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleGrid from '@/components/articles/ArticleGrid';
import ArticleEditor from '@/components/articles/ArticleEditor';
import { FileText, Plus } from 'lucide-react';

interface UserArticlesPageProps {
  params: { locale: string };
}

export default function UserArticlesPage({
  params: { locale },
}: UserArticlesPageProps) {
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateNew = () => {
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    setShowEditor(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-stakeados-primary" />
                  <h1 className="text-4xl font-bold text-neon">My Articles</h1>
                </div>
                <p className="text-xl text-stakeados-gray-300">
                  Manage your published articles and drafts
                </p>
              </div>

              {!showEditor && (
                <button onClick={handleCreateNew} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Write Article
                </button>
              )}
            </div>

            {/* Article Editor */}
            {showEditor && (
              <div className="mb-8">
                <ArticleEditor
                  locale={locale as 'en' | 'es'}
                  onSave={handleEditorSave}
                />
              </div>
            )}

            {/* Articles Grid */}
            {!showEditor && (
              <ArticleGrid
                locale={locale as 'en' | 'es'}
                showFilters={false}
                showSearch={false}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
