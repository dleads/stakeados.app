import { Metadata } from 'next';
import { getTranslations } from '@/lib/mocks/next-intl-server';
import TagManager from '@/components/admin/tags/TagManager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.tags');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function TagManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TagManager />
      </div>
    </div>
  );
}
