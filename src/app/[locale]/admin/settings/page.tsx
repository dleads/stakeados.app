import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import SystemConfigurationInterface from '@/components/admin/settings/SystemConfigurationInterface';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.settings');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminSettingsPage() {
  const t = await getTranslations('admin.settings');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      <SystemConfigurationInterface />
    </div>
  );
}
