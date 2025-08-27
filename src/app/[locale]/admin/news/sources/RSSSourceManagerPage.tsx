'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import RSSSourceManager from '@/components/admin/news/RSSSourceManager';
import { useRSSSourceManager } from '@/hooks/useRSSSourceManager';

export default function RSSSourceManagerPage() {
  const t = useTranslations('admin.news.sources');

  const {
    sources,
    categories,
    loading,
    error,
    createSource,
    updateSource,
    deleteSource,
    testSource,
    toggleSource,
    fetchNow,
  } = useRSSSourceManager();

  return (
    <AdminLayout locale="es">
      <div className="space-y-6">
        <div className="border-b border-stakeados-gray-600 pb-4">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-stakeados-gray-400 mt-1">{t('subtitle')}</p>
        </div>

        <RSSSourceManager
          sources={sources}
          categories={categories}
          onCreateSource={createSource}
          onUpdateSource={updateSource}
          onDeleteSource={deleteSource}
          onTestSource={testSource}
          onToggleSource={toggleSource}
          onFetchNow={fetchNow}
          loading={loading}
          error={error}
        />
      </div>
    </AdminLayout>
  );
}
