import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function SupabaseStatus() {
  const t = useTranslations('home.status');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });

        if (error) {
          setError(error.message);
          setIsConnected(false);
        } else {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  if (isConnected === null) {
    return (
      <div className="inline-flex items-center gap-3 bg-gaming-card px-6 py-3 rounded-gaming">
        <div className="w-3 h-3 bg-stakeados-yellow rounded-full animate-pulse" />
        <span className="text-stakeados-yellow font-semibold">
          🔄 {t('supabaseConnecting')}
        </span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="inline-flex items-center gap-3 bg-gaming-card px-6 py-3 rounded-gaming border border-stakeados-red/30">
        <div className="w-3 h-3 bg-stakeados-red rounded-full" />
        <span className="text-stakeados-red font-semibold">
          ❌ {t('supabaseFailed')}
        </span>
        {error && (
          <span className="text-stakeados-gray-300 text-sm">({error})</span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 bg-gaming-card px-6 py-3 rounded-gaming border border-stakeados-primary/30">
      <div className="status-online" />
      <span className="text-stakeados-primary font-semibold">
        ✅ {t('supabaseConnected')}
      </span>
    </div>
  );
}
