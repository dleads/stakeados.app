'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/types/content';

interface CategoriesAdminPageProps {
  params: { locale: string };
}

export default function CategoriesAdminPage({
  params,
}: CategoriesAdminPageProps) {
  const locale = params.locale as Locale;
  const { t } = useTranslation(locale);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('admin.sections.categories.title')}
              </h1>
              <p className="text-xl text-gray-300">
                {t('admin.sections.categories.description')}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <CategoryManager locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
