import { Metadata } from 'next';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

export const metadata: Metadata = {
  title: 'Notification Settings - Stakeados',
  description: 'Manage your notification preferences and subscriptions',
};

interface NotificationSettingsPageProps {
  params: { locale: string };
  searchParams: { tab?: string };
}

export default function NotificationSettingsPage({
  searchParams,
}: NotificationSettingsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <NotificationSettings defaultTab={searchParams.tab || 'notifications'} />
    </div>
  );
}
