'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleEditor from '@/components/articles/ArticleEditor';
import { FileText, Lightbulb, Users, Award } from 'lucide-react';
import { useRouter } from '@/lib/utils/navigation';
import type { Locale } from '@/types/content';

export default function CreateArticlePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const router = useRouter();

  const handleSave = (article: any) => {
    router.push(`/${params.locale}/articles/${article.slug || article.id}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileText className="w-12 h-12 text-stakeados-primary" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  Write an Article
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Share your knowledge and insights with the Stakeados community
              </p>
            </div>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-stakeados-yellow" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Share Knowledge
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Help others learn by sharing your expertise and experiences
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-stakeados-blue" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Build Community
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Connect with fellow learners and contribute to the ecosystem
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-stakeados-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Earn Recognition
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Get points and recognition for quality contributions
                </p>
              </div>
            </div>

            {/* Article Editor */}
            <ArticleEditor locale={params.locale} onSave={handleSave} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
