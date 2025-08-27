'use client';

import React, { useState, useEffect } from 'react';
import { Users, Eye, Clock, Zap, Globe, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeStatsWidgetProps {
  className?: string;
}

interface LiveStats {
  activeUsers: number;
  currentViews: number;
  processingJobs: number;
  systemLoad: number;
  responseTime: number;
  onlineStatus: 'online' | 'degraded' | 'offline';
}

export default function RealTimeStatsWidget({
  className,
}: RealTimeStatsWidgetProps) {
  const [stats, setStats] = useState<LiveStats>({
    activeUsers: 0,
    currentViews: 0,
    processingJobs: 0,
    systemLoad: 0,
    responseTime: 0,
    onlineStatus: 'online',
  });

  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    const updateStats = () => {
      setStats(prev => ({
        activeUsers: Math.max(
          0,
          prev.activeUsers + Math.floor(Math.random() * 10 - 5)
        ),
        currentViews: Math.max(
          0,
          prev.currentViews + Math.floor(Math.random() * 20 - 10)
        ),
        processingJobs: Math.max(
          0,
          prev.processingJobs + Math.floor(Math.random() * 6 - 3)
        ),
        systemLoad: Math.max(
          0,
          Math.min(100, prev.systemLoad + Math.random() * 10 - 5)
        ),
        responseTime: Math.max(10, prev.responseTime + Math.random() * 50 - 25),
        onlineStatus: Math.random() > 0.95 ? 'degraded' : 'online',
      }));
    };

    // Initial values
    setStats({
      activeUsers: 234 + Math.floor(Math.random() * 100),
      currentViews: 1567 + Math.floor(Math.random() * 500),
      processingJobs: Math.floor(Math.random() * 15),
      systemLoad: 45 + Math.random() * 30,
      responseTime: 120 + Math.random() * 100,
      onlineStatus: 'online',
    });

    setIsConnected(true);

    const interval = setInterval(updateStats, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-stakeados-primary';
      case 'degraded':
        return 'text-stakeados-yellow';
      case 'offline':
        return 'text-stakeados-red';
      default:
        return 'text-stakeados-gray-400';
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return 'text-stakeados-primary';
    if (load < 80) return 'text-stakeados-yellow';
    return 'text-stakeados-red';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={cn('bg-gaming-card rounded-gaming p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Estadísticas en Vivo
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected
                ? 'bg-stakeados-primary animate-pulse'
                : 'bg-stakeados-gray-500'
            )}
          />
          <span className="text-xs text-stakeados-gray-400">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active Users */}
        <div className="p-4 bg-stakeados-gray-800/50 rounded-gaming">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stakeados-blue/20 rounded-gaming">
              <Users className="w-4 h-4 text-stakeados-blue" />
            </div>
            <div>
              <p className="text-sm text-stakeados-gray-400">
                Usuarios Activos
              </p>
              <p className="text-lg font-bold text-white">
                {formatNumber(stats.activeUsers)}
              </p>
            </div>
          </div>
        </div>

        {/* Current Views */}
        <div className="p-4 bg-stakeados-gray-800/50 rounded-gaming">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stakeados-purple/20 rounded-gaming">
              <Eye className="w-4 h-4 text-stakeados-purple" />
            </div>
            <div>
              <p className="text-sm text-stakeados-gray-400">Vistas Actuales</p>
              <p className="text-lg font-bold text-white">
                {formatNumber(stats.currentViews)}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Jobs */}
        <div className="p-4 bg-stakeados-gray-800/50 rounded-gaming">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stakeados-yellow/20 rounded-gaming">
              <Zap className="w-4 h-4 text-stakeados-yellow" />
            </div>
            <div>
              <p className="text-sm text-stakeados-gray-400">Trabajos IA</p>
              <p className="text-lg font-bold text-white">
                {stats.processingJobs}
              </p>
            </div>
          </div>
        </div>

        {/* System Load */}
        <div className="p-4 bg-stakeados-gray-800/50 rounded-gaming">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stakeados-red/20 rounded-gaming">
              <Server className="w-4 h-4 text-stakeados-red" />
            </div>
            <div>
              <p className="text-sm text-stakeados-gray-400">Carga Sistema</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  getLoadColor(stats.systemLoad)
                )}
              >
                {Math.round(stats.systemLoad)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="mt-6 pt-4 border-t border-stakeados-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe
              className={cn('w-4 h-4', getStatusColor(stats.onlineStatus))}
            />
            <span className="text-sm text-stakeados-gray-300">Estado:</span>
            <span
              className={cn(
                'text-sm font-medium',
                getStatusColor(stats.onlineStatus)
              )}
            >
              {stats.onlineStatus === 'online'
                ? 'Operacional'
                : stats.onlineStatus === 'degraded'
                  ? 'Degradado'
                  : 'Fuera de línea'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stakeados-gray-400" />
            <span className="text-sm text-stakeados-gray-400">
              {Math.round(stats.responseTime)}ms
            </span>
          </div>
        </div>

        {/* Load Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-stakeados-gray-400">
              Carga del servidor
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                getLoadColor(stats.systemLoad)
              )}
            >
              {Math.round(stats.systemLoad)}%
            </span>
          </div>
          <div className="w-full bg-stakeados-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-1000',
                stats.systemLoad < 50
                  ? 'bg-stakeados-primary'
                  : stats.systemLoad < 80
                    ? 'bg-stakeados-yellow'
                    : 'bg-stakeados-red'
              )}
              style={{ width: `${Math.min(100, stats.systemLoad)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
