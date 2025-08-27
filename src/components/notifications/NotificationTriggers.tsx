'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface NotificationTriggersProps {
  className?: string;
}

export default function NotificationTriggers({
  className = '',
}: NotificationTriggersProps) {
  const { isGenesisHolder, user } = useAuthContext();
  const { createNotification } = useNotifications();

  const handleTestCourseCompletion = () => {
    if (!user?.id) return;
    createNotification({
      userId: user.id,
      type: 'new_article',
      title: {
        en: 'Blockchain Fundamentals Completed',
        es: 'Fundamentos de Blockchain Completados',
      },
      message: {
        en: 'You completed your first course on Stakeados!',
        es: '¡Completaste tu primer curso en Stakeados!',
      },
      data: { certificateId: 'cert-123', score: 95 },
    });
  };

  const handleTestAchievement = () => {
    if (!user?.id) return;
    createNotification({
      userId: user.id,
      type: 'new_news',
      title: { en: 'First Course Completed', es: 'Primer Curso Completado' },
      message: {
        en: 'You completed your first course on Stakeados!',
        es: '¡Completaste tu primer curso en Stakeados!',
      },
      data: { achievementType: 'epic' },
    });
  };

  const handleTestGenesisAccess = () => {
    if (!user?.id || !isGenesisHolder) return;
    createNotification({
      userId: user.id,
      type: 'article_approved',
      title: {
        en: 'Advanced Analytics Dashboard',
        es: 'Panel de Análisis Avanzado',
      },
      message: {
        en: 'New analytics features are now available for Genesis members',
        es: 'Nuevas funciones de análisis están disponibles para miembros Genesis',
      },
      data: { feature: 'analytics_dashboard' },
    });
  };

  const handleTestCommunityUpdate = () => {
    if (!user?.id) return;
    createNotification({
      userId: user.id,
      type: 'proposal_reviewed',
      title: {
        en: 'New Community Article',
        es: 'Nuevo Artículo de la Comunidad',
      },
      message: {
        en: 'Check out the latest article about DeFi protocols by Alex Chen',
        es: 'Mira el último artículo sobre protocolos DeFi por Alex Chen',
      },
      data: { author: 'Alex Chen', topic: 'DeFi protocols' },
    });
  };

  const handleTestSystemUpdate = () => {
    if (!user?.id) return;
    createNotification({
      userId: user.id,
      type: 'breaking_news',
      title: {
        en: 'Platform Maintenance',
        es: 'Mantenimiento de la Plataforma',
      },
      message: {
        en: 'Scheduled maintenance will occur tonight from 2-4 AM UTC',
        es: 'El mantenimiento programado ocurrirá esta noche de 2-4 AM UTC',
      },
      data: { maintenanceTime: '2-4 AM UTC' },
    });
  };

  return (
    <div className={`card-gaming ${className}`}>
      <h3 className="text-lg font-bold text-neon mb-4">Test Notifications</h3>
      <p className="text-stakeados-gray-300 mb-6">
        Test different types of notifications to see how they appear
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={handleTestCourseCompletion} className="btn-primary">
          Test Course Completion
        </button>

        <button onClick={handleTestAchievement} className="btn-secondary">
          Test Achievement
        </button>

        {isGenesisHolder && (
          <button onClick={handleTestGenesisAccess} className="btn-ghost">
            Test Genesis Access
          </button>
        )}

        <button onClick={handleTestCommunityUpdate} className="btn-ghost">
          Test Community Update
        </button>

        <button onClick={handleTestSystemUpdate} className="btn-ghost">
          Test System Update
        </button>
      </div>
    </div>
  );
}
