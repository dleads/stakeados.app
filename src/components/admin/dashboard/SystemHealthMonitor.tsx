'use client';

import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { SystemHealth } from '@/types/adminDashboard';

type ServiceKey =
  | 'database'
  | 'api'
  | 'supabase'
  | 'newsAggregation'
  | 'aiProcessing';
type ServiceDetail = {
  responseTime?: number;
  error?: string;
  memoryUsage?: number;
  statusCode?: number;
};

export function SystemHealthMonitor({
  health,
  onRefresh,
  serviceInfo,
}: {
  health: SystemHealth;
  onRefresh?: () => void;
  serviceInfo?: Partial<Record<ServiceKey, ServiceDetail>>;
}) {
  const color = (s: 'healthy' | 'warning' | 'error') =>
    s === 'healthy'
      ? 'text-green-400'
      : s === 'warning'
        ? 'text-yellow-400'
        : 'text-red-400';
  const Icon = (s: 'healthy' | 'warning' | 'error') =>
    s === 'healthy' ? CheckCircle : s === 'warning' ? AlertTriangle : XCircle;

  const services: Array<{
    key: ServiceKey;
    name: string;
    status: SystemHealth[ServiceKey];
  }> = [
    { key: 'database', name: 'Base de datos', status: health.database },
    { key: 'api', name: 'API', status: health.api },
    { key: 'supabase', name: 'Supabase', status: health.supabase },
    {
      key: 'newsAggregation',
      name: 'Agregador de noticias',
      status: health.newsAggregation,
    },
    {
      key: 'aiProcessing',
      name: 'Procesamiento IA',
      status: health.aiProcessing,
    },
  ];

  const tips: Partial<Record<ServiceKey, string[]>> = {
    database: [
      'Verifica conexiones y credenciales de Supabase.',
      'Revisa tiempo de respuesta y consultas lentas.',
    ],
    api: [
      'Comprueba variables de entorno requeridas.',
      'Verifica latencias y la cola de peticiones.',
    ],
    supabase: [
      'Confirma NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.',
      'Revisa políticas RLS y estado del proyecto.',
    ],
    newsAggregation: [
      'Revisa cron/tareas y fuentes RSS configuradas.',
      'Confirma que no hay bloqueos de red a las fuentes.',
    ],
    aiProcessing: [
      'Verifica OPENAI_API_KEY y cuota disponible.',
      'Monitoriza tiempos de procesamiento y tasa de fallos.',
    ],
  };

  const anyIssue = services.some(s => s.status !== 'healthy');

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Salud del sistema</h3>
        <button
          onClick={onRefresh}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Refrescar estado del sistema"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {services.map(s => {
          const I = Icon(s.status);
          const extra = serviceInfo?.[s.key];
          return (
            <div key={s.key} className="flex items-start justify-between">
              <span className="text-gray-300">{s.name}</span>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <I className={`w-4 h-4 ${color(s.status)}`} />
                  <span className={`text-sm capitalize ${color(s.status)}`}>
                    {s.status}
                  </span>
                </div>
                {extra &&
                  (extra.responseTime ||
                    extra.memoryUsage ||
                    extra.statusCode ||
                    extra.error) && (
                    <div className="text-xs text-gray-400 text-right">
                      {typeof extra.responseTime === 'number' && (
                        <div>RT: {extra.responseTime} ms</div>
                      )}
                      {typeof extra.memoryUsage === 'number' && (
                        <div>Mem: {extra.memoryUsage}</div>
                      )}
                      {typeof extra.statusCode === 'number' && (
                        <div>HTTP: {extra.statusCode}</div>
                      )}
                      {extra.error && (
                        <div className="text-red-400 truncate max-w-[220px]">
                          Error: {extra.error}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Última comprobación: {new Date(health.lastChecked).toLocaleString()}
        </p>
      </div>

      {anyIssue && (
        <div className="mt-6 rounded-lg border border-yellow-600/40 bg-yellow-900/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-300 text-sm font-medium">
              Detalle y recomendaciones
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            {services
              .filter(s => s.status !== 'healthy')
              .flatMap(s =>
                (tips[s.key] || []).map((t, idx) => (
                  <li key={`${s.key}-${idx}`}>
                    <span className="text-gray-400 mr-2">[{s.name}]</span>
                    {t}
                  </li>
                ))
              )}
          </ul>
        </div>
      )}
    </div>
  );
}
