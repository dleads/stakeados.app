// @ts-nocheck
'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Heart,
  Share,
  Users,
  FileText,
  Newspaper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealTimeAnalyticsWidgetProps {
  className?: string;
  showDetailed?: boolean;
}

export function RealTimeAnalyticsWidget({
  className,
  showDetailed = false,
}: RealTimeAnalyticsWidgetProps) {
  const { metrics, contentMetrics, isConnected, lastUpdate, getRealTimeStats } =
    useRealTimeAnalytics();

  const realtimeStats = getRealTimeStats();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-500';
    if (engagement >= 60) return 'text-yellow-500';
    if (engagement >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Datos en tiempo real' : 'Desconectado'}
          </span>
        </div>

        <Badge
          variant={realtimeStats.isRealTime ? 'default' : 'secondary'}
          className="text-xs"
        >
          Actualizado{' '}
          {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
        </Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vistas totales</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.totalViews)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Likes totales</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.totalLikes)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Usuarios activos
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.activeUsers)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Artículos publicados
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.articlesPublished)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      {showDetailed && (
        <>
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Actualizaciones recientes</span>
                  <Badge variant="secondary">
                    {realtimeStats.recentUpdates}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Contenido rastreado</span>
                  <Badge variant="outline">
                    {realtimeStats.totalContentTracked}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Noticias procesadas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {metrics.newsProcessed}
                    </span>
                    <Newspaper className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          {contentMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido destacado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentMetrics
                    .sort((a, b) => b.engagement - a.engagement)
                    .slice(0, 5)
                    .map(content => (
                      <div key={content.contentId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {content.contentType === 'article'
                                ? 'Artículo'
                                : 'Noticia'}
                            </Badge>
                            {getTrendIcon(content.trend)}
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(content.views)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {formatNumber(content.likes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Share className="h-3 w-3" />
                              {formatNumber(content.shares)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Engagement</span>
                            <span
                              className={getEngagementColor(content.engagement)}
                            >
                              {content.engagement}%
                            </span>
                          </div>
                          <Progress
                            value={content.engagement}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Compact version for dashboard widgets
export function CompactAnalyticsWidget({ className }: { className?: string }) {
  const { metrics, isConnected } = useRealTimeAnalytics();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Analytics en vivo</h3>
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Vistas</p>
            <p className="font-semibold">{formatNumber(metrics.totalViews)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Usuarios</p>
            <p className="font-semibold">{formatNumber(metrics.activeUsers)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Artículos</p>
            <p className="font-semibold">
              {formatNumber(metrics.articlesPublished)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Noticias</p>
            <p className="font-semibold">
              {formatNumber(metrics.newsProcessed)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
