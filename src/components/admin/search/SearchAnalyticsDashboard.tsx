'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Search, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchAnalytics } from '@/hooks/useAdvancedSearch';

interface SearchAnalyticsDashboardProps {
  analytics: SearchAnalytics | null;
  onLoadAnalytics: (period: string) => void;
}

export function SearchAnalyticsDashboard({
  analytics,
  onLoadAnalytics,
}: SearchAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    handleLoadAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const handleLoadAnalytics = async (period: string) => {
    setIsLoading(true);
    await onLoadAnalytics(period);
    setIsLoading(false);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day':
        return 'Último día';
      case 'week':
        return 'Última semana';
      case 'month':
        return 'Último mes';
      case 'year':
        return 'Último año';
      default:
        return period;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics de Búsqueda
        </h3>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Último día</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleLoadAnalytics(selectedPeriod)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Búsquedas
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.summary.total_searches}
                    </p>
                  </div>
                  <Search className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Promedio Resultados
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.summary.avg_results_count}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tiempo Promedio
                    </p>
                    <p className="text-2xl font-bold">
                      {formatDuration(analytics.summary.avg_duration_ms)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Sin Resultados
                    </p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(analytics.summary.no_results_rate)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas Más Frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.top_queries.length > 0 ? (
                <div className="space-y-3">
                  {analytics.top_queries.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{query.query}</span>
                      </div>
                      <Badge variant="secondary">
                        {query.count} búsqueda{query.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay consultas registradas en este período
                </p>
              )}
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Contenido</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.type_distribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analytics.type_distribution).map(
                    ([type, count]) => {
                      const percentage =
                        (count / analytics.summary.total_searches) * 100;
                      const getTypeLabel = (type: string) => {
                        switch (type) {
                          case 'articles':
                            return 'Artículos';
                          case 'news':
                            return 'Noticias';
                          case 'categories':
                            return 'Categorías';
                          case 'tags':
                            return 'Etiquetas';
                          case 'global':
                            return 'Global';
                          default:
                            return type;
                        }
                      };

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {getTypeLabel(type)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                {count} búsquedas
                              </span>
                              <Badge variant="outline">
                                {formatPercentage(percentage)}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay datos de distribución disponibles
                </p>
              )}
            </CardContent>
          </Card>

          {/* Period Info */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Período:</strong>{' '}
                  {getPeriodLabel(analytics.period.period)}
                </p>
                <p>
                  <strong>Desde:</strong>{' '}
                  {new Date(analytics.period.start_date).toLocaleDateString(
                    'es-ES'
                  )}
                </p>
                <p>
                  <strong>Hasta:</strong>{' '}
                  {new Date(analytics.period.end_date).toLocaleDateString(
                    'es-ES'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isLoading ? 'Cargando analytics...' : 'No hay datos disponibles'}
            </h3>
            <p className="text-gray-600">
              {isLoading
                ? 'Obteniendo datos de búsqueda...'
                : 'Selecciona un período para ver las estadísticas de búsqueda.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
