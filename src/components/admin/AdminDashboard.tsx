'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import DashboardCustomization from './dashboard/DashboardCustomization';
import RealTimeStatsWidget from './dashboard/RealTimeStatsWidget';
import { RealTimeAnalyticsWidget } from './realtime/RealTimeAnalyticsWidget';
import { BackgroundProcessMonitor } from './realtime/BackgroundProcessMonitor';
import {
  FileText,
  Newspaper,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Heart,
  Activity,
  Settings,
  RefreshCw,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
// TODO: Use DashboardMetrics interface when implementing metrics
// interface DashboardMetrics {
//   articles: {
//     total: number;
//     published: number;
//     draft: number;
//     review: number;
//     totalViews: number;
//     totalLikes: number;
//     avgViewsPerArticle: number;
//   };
//   news: {
//     total: number;
//     processed: number;
//     pending: number;
//     avgTrendingScore: number;
//   };
//   categories: {
//     total: number;
//     withContent: number;
//     topCategories: Array<{
//       id: string;
//       name: string;
//       articleCount: number;
//       newsCount: number;
//       totalContent: number;
//     }>;
//   };
//   growth: {
//     articlesGrowth: number;
//     newsGrowth: number;
//   };
//   recentActivity: Array<{
//     id: string;
//     change_type: string;
//     created_at: string;
//     article?: { title: string };
//     changed_by?: { full_name: string };
//   }>;
//   topPerformingContent: Array<{
//     id: string;
//     title: string;
//     views: number;
//     likes: number;
//     created_at: string;
//   }>;
// }

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  loading?: boolean;
  onClick?: () => void;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
  badge?: number;
}

interface SystemStatusProps {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  description: string;
  responseTime?: number;
}

// Dashboard Card Component
function DashboardCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  loading = false,
  onClick,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'bg-gaming-card rounded-gaming p-6 hover:shadow-glow-lg transition-all duration-300 relative overflow-hidden',
        onClick && 'cursor-pointer hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-stakeados-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-stakeados-primary/20 rounded-gaming">
            <Icon className="w-6 h-6 text-stakeados-primary" />
          </div>
          {onClick && (
            <ExternalLink className="w-4 h-4 text-stakeados-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        <div>
          <p className="text-stakeados-gray-400 text-sm font-medium mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 bg-stakeados-gray-700 rounded animate-pulse mb-2" />
          ) : (
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
          )}

          {change && !loading && (
            <div className="flex items-center gap-2 mb-2">
              {changeType === 'positive' && (
                <ArrowUpRight className="w-4 h-4 text-stakeados-primary" />
              )}
              {changeType === 'negative' && (
                <ArrowDownRight className="w-4 h-4 text-stakeados-red" />
              )}
              {changeType === 'neutral' && (
                <Minus className="w-4 h-4 text-stakeados-gray-400" />
              )}
              <p
                className={cn(
                  'text-sm font-medium',
                  changeType === 'positive' && 'text-stakeados-primary',
                  changeType === 'negative' && 'text-stakeados-red',
                  changeType === 'neutral' && 'text-stakeados-gray-400'
                )}
              >
                {change}
              </p>
            </div>
          )}

          {description && (
            <p className="text-xs text-stakeados-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  badge,
}: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-gaming transition-all duration-300 group relative overflow-hidden text-left w-full',
        `bg-${color}/10 hover:bg-${color}/20 border border-${color}/30`
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn('p-2 rounded-gaming flex-shrink-0', `bg-${color}/20`)}
        >
          <Icon
            className={cn(
              'w-5 h-5 group-hover:scale-110 transition-transform',
              `text-${color}`
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{title}</p>
            {badge && badge > 0 && (
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full font-semibold',
                  `bg-${color} text-stakeados-dark`
                )}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <p className="text-xs text-stakeados-gray-400">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-stakeados-gray-400 group-hover:text-white transition-colors" />
      </div>
    </button>
  );
}

// System Status Component
function SystemStatus({
  service,
  status,
  description,
  responseTime,
}: SystemStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-stakeados-primary';
      case 'degraded':
        return 'bg-stakeados-yellow';
      case 'down':
        return 'bg-stakeados-red';
      default:
        return 'bg-stakeados-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-stakeados-primary" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-stakeados-yellow" />;
      case 'down':
        return <AlertCircle className="w-4 h-4 text-stakeados-red" />;
      default:
        return <Clock className="w-4 h-4 text-stakeados-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-gaming hover:bg-stakeados-gray-800/50 transition-colors">
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          getStatusColor(status),
          status === 'operational' && 'animate-pulse'
        )}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <p className="text-sm font-medium text-white">{service}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-stakeados-gray-400">{description}</p>
          {responseTime && (
            <span className="text-xs text-stakeados-gray-500">
              • {responseTime}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const locale = useLocale();
  const [showCustomization, setShowCustomization] = useState(false);

  const {
    metrics,
    loading,
    error,
    lastUpdated,
    settings,
    refresh,
    updateSettings,
    isRefreshing,
  } = useAdminDashboard();

  // Manual refresh
  const handleRefresh = () => {
    refresh();
  };

  // Quick actions configuration
  const quickActions = [
    {
      title: 'Crear Artículo',
      description: 'Escribir nuevo contenido',
      icon: FileText,
      color: 'stakeados-primary',
      onClick: () => router.push(`/${locale}/admin/articles/create`),
      badge: metrics?.articles.draft || 0,
    },
    {
      title: 'Procesar Noticias',
      description: 'Ejecutar agregación RSS',
      icon: Newspaper,
      color: 'stakeados-blue',
      onClick: () => router.push(`/${locale}/admin/news`),
      badge: metrics?.news.pending || 0,
    },
    {
      title: 'Revisar Contenido',
      description: 'Artículos pendientes',
      icon: Eye,
      color: 'stakeados-purple',
      onClick: () => router.push(`/${locale}/admin/articles?status=review`),
      badge: metrics?.articles.review || 0,
    },
    {
      title: 'Ver Analíticas',
      description: 'Métricas detalladas',
      icon: BarChart3,
      color: 'stakeados-yellow',
      onClick: () => router.push(`/${locale}/admin/analytics`),
    },
    {
      title: 'Gestionar Categorías',
      description: 'Organizar contenido',
      icon: FolderOpen,
      color: 'stakeados-green',
      onClick: () => router.push(`/${locale}/admin/categories`),
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: Settings,
      color: 'stakeados-gray-400',
      onClick: () => router.push(`/${locale}/admin/settings`),
    },
  ];

  // System status (this would typically come from health check APIs)
  const systemStatus = [
    {
      service: 'Base de Datos',
      status: 'operational' as const,
      description: 'Todas las consultas funcionando',
      responseTime: 45,
    },
    {
      service: 'APIs de Contenido',
      status: 'operational' as const,
      description: 'Endpoints respondiendo correctamente',
      responseTime: 120,
    },
    {
      service: 'Procesamiento IA',
      status: 'degraded' as const,
      description: 'Carga elevada, procesamiento lento',
      responseTime: 2500,
    },
    {
      service: 'Fuentes RSS',
      status: 'operational' as const,
      description: '8/10 fuentes activas',
      responseTime: 800,
    },
    {
      service: 'Almacenamiento',
      status: 'operational' as const,
      description: '78% de capacidad utilizada',
    },
    {
      service: 'CDN',
      status: 'operational' as const,
      description: 'Distribución global activa',
      responseTime: 25,
    },
  ];

  // Format activity time
  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  // Get activity icon and color
  const getActivityDisplay = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return {
          icon: Plus,
          color: 'text-stakeados-primary',
          bg: 'bg-stakeados-primary/20',
        };
      case 'updated':
        return {
          icon: FileText,
          color: 'text-stakeados-blue',
          bg: 'bg-stakeados-blue/20',
        };
      case 'published':
        return {
          icon: CheckCircle,
          color: 'text-stakeados-green',
          bg: 'bg-stakeados-green/20',
        };
      case 'status_changed':
        return {
          icon: Activity,
          color: 'text-stakeados-yellow',
          bg: 'bg-stakeados-yellow/20',
        };
      default:
        return {
          icon: Clock,
          color: 'text-stakeados-gray-400',
          bg: 'bg-stakeados-gray-400/20',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Panel de Administración
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-stakeados-gray-400">
              Centro de control de Stakeados • Última actualización:{' '}
              {lastUpdated?.toLocaleTimeString() || 'Nunca'}
            </p>
            {error && (
              <div className="flex items-center gap-1 text-stakeados-red text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Error al cargar datos</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomization(true)}
            className="p-2 text-stakeados-gray-300 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors"
            title="Personalizar dashboard"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() =>
              updateSettings({ autoRefresh: !settings.autoRefresh })
            }
            className={cn(
              'px-3 py-2 rounded-gaming text-sm font-medium transition-colors',
              settings.autoRefresh
                ? 'bg-stakeados-primary/20 text-stakeados-primary border border-stakeados-primary/30'
                : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
            )}
          >
            <Activity className="w-4 h-4 mr-2 inline" />
            Auto-refresh {settings.autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-light text-stakeados-dark font-medium rounded-gaming transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 mr-2 inline',
                isRefreshing && 'animate-spin'
              )}
            />
            Actualizar
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Artículos"
          value={
            loading ? '...' : metrics?.articles.total.toLocaleString() || '0'
          }
          change={
            loading
              ? undefined
              : `${metrics?.growth.articlesGrowth || 0}% este mes`
          }
          changeType={
            !metrics?.growth.articlesGrowth
              ? 'neutral'
              : metrics.growth.articlesGrowth > 0
                ? 'positive'
                : 'negative'
          }
          icon={FileText}
          description={
            loading
              ? undefined
              : `${metrics?.articles.published || 0} publicados • ${metrics?.articles.draft || 0} borradores`
          }
          loading={loading}
          onClick={() => router.push(`/${locale}/admin/articles`)}
        />

        <DashboardCard
          title="Noticias Procesadas"
          value={loading ? '...' : metrics?.news.total.toLocaleString() || '0'}
          change={
            loading ? undefined : `${metrics?.growth.newsGrowth || 0}% este mes`
          }
          changeType={
            !metrics?.growth.newsGrowth
              ? 'neutral'
              : metrics.growth.newsGrowth > 0
                ? 'positive'
                : 'negative'
          }
          icon={Newspaper}
          description={
            loading
              ? undefined
              : `${metrics?.news.processed || 0} procesadas • ${metrics?.news.pending || 0} pendientes`
          }
          loading={loading}
          onClick={() => router.push(`/${locale}/admin/news`)}
        />

        <DashboardCard
          title="Engagement Total"
          value={
            loading
              ? '...'
              : (metrics?.articles.totalViews || 0).toLocaleString()
          }
          change={
            loading ? undefined : `${metrics?.articles.totalLikes || 0} likes`
          }
          changeType="positive"
          icon={TrendingUp}
          description={
            loading
              ? undefined
              : `${metrics?.articles.avgViewsPerArticle || 0} vistas promedio`
          }
          loading={loading}
          onClick={() => router.push(`/${locale}/admin/analytics`)}
        />

        <DashboardCard
          title="Categorías Activas"
          value={loading ? '...' : metrics?.categories.withContent || '0'}
          change={
            loading ? undefined : `de ${metrics?.categories.total || 0} totales`
          }
          changeType="neutral"
          icon={FolderOpen}
          description="Categorías con contenido"
          loading={loading}
          onClick={() => router.push(`/${locale}/admin/categories`)}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gaming-card rounded-gaming p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Actividad Reciente
            </h2>
            <button
              onClick={() => router.push(`/${locale}/admin/activity`)}
              className="text-stakeados-primary hover:text-stakeados-primary-light text-sm transition-colors"
            >
              Ver todo
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-gaming"
                >
                  <div className="w-8 h-8 bg-stakeados-gray-700 rounded-gaming animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-stakeados-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-stakeados-gray-700 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))
            ) : metrics?.recentActivity.length ? (
              metrics.recentActivity.slice(0, 8).map(activity => {
                const {
                  icon: ActivityIcon,
                  color,
                  bg,
                } = getActivityDisplay(activity.change_type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-gaming hover:bg-stakeados-gray-800/50 transition-colors"
                  >
                    <div className={cn('p-2 rounded-gaming', bg)}>
                      <ActivityIcon className={cn('w-4 h-4', color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">
                        {activity.change_type === 'created' &&
                          'Artículo creado: '}
                        {activity.change_type === 'updated' &&
                          'Artículo actualizado: '}
                        {activity.change_type === 'published' &&
                          'Artículo publicado: '}
                        {activity.change_type === 'status_changed' &&
                          'Estado cambiado: '}
                        {activity.article?.title || 'Contenido sin título'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-stakeados-gray-400">
                          {formatActivityTime(activity.created_at)}
                        </p>
                        {activity.changed_by?.full_name && (
                          <>
                            <span className="text-xs text-stakeados-gray-500">
                              •
                            </span>
                            <p className="text-xs text-stakeados-gray-400">
                              por {activity.changed_by.full_name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-stakeados-gray-600 mx-auto mb-3" />
                <p className="text-stakeados-gray-400">
                  No hay actividad reciente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gaming-card rounded-gaming p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Acciones Rápidas
          </h2>

          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Statistics */}
      <RealTimeStatsWidget />

      {/* Real-time Analytics and Process Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RealTimeAnalyticsWidget showDetailed={false} />
        <BackgroundProcessMonitor compact={true} />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Content */}
        <div className="bg-gaming-card rounded-gaming p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Contenido Destacado
            </h2>
            <button
              onClick={() => router.push(`/${locale}/admin/analytics/content`)}
              className="text-stakeados-primary hover:text-stakeados-primary-light text-sm transition-colors"
            >
              Ver más
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-gaming border border-stakeados-gray-700"
                >
                  <div className="h-4 bg-stakeados-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-stakeados-gray-700 rounded animate-pulse w-2/3" />
                </div>
              ))
            ) : metrics?.topPerformingContent.length ? (
              metrics.topPerformingContent.slice(0, 5).map((content, index) => (
                <div
                  key={content.id}
                  className="p-3 rounded-gaming border border-stakeados-gray-700 hover:border-stakeados-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-stakeados-primary/20 rounded-gaming flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-stakeados-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {content.title}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-stakeados-gray-400" />
                          <span className="text-xs text-stakeados-gray-400">
                            {content.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-stakeados-gray-400" />
                          <span className="text-xs text-stakeados-gray-400">
                            {content.likes.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-stakeados-gray-600 mx-auto mb-3" />
                <p className="text-stakeados-gray-400">
                  No hay datos de rendimiento
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gaming-card rounded-gaming p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Estado del Sistema
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse" />
              <span className="text-xs text-stakeados-gray-400">En vivo</span>
            </div>
          </div>

          <div className="space-y-3">
            {systemStatus.map((status, index) => (
              <SystemStatus key={index} {...status} />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-stakeados-gray-700">
            <button
              onClick={() => router.push(`/${locale}/admin/system-health`)}
              className="w-full text-center text-sm text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
            >
              Ver estado completo del sistema
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Customization Modal */}
      <DashboardCustomization
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </div>
  );
}
