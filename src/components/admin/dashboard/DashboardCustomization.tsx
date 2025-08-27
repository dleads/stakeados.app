'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  Smartphone,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardCustomization } from '@/hooks/useAdminDashboard';

interface DashboardCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardCustomization({
  isOpen,
  onClose,
}: DashboardCustomizationProps) {
  const { layout, updateLayout, toggleWidget, reorderWidgets } =
    useDashboardCustomization();
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const widgets = [
    {
      id: 'metrics',
      name: 'Métricas Principales',
      description: 'Estadísticas clave del sistema',
    },
    {
      id: 'activity',
      name: 'Actividad Reciente',
      description: 'Últimas acciones realizadas',
    },
    {
      id: 'quickActions',
      name: 'Acciones Rápidas',
      description: 'Botones de acceso directo',
    },
    {
      id: 'topContent',
      name: 'Contenido Destacado',
      description: 'Artículos más populares',
    },
    {
      id: 'systemStatus',
      name: 'Estado del Sistema',
      description: 'Salud de los servicios',
    },
  ];

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== targetWidgetId) {
      const draggedIndex = layout.widgets.findIndex(
        w => w.id === draggedWidget
      );
      const targetIndex = layout.widgets.findIndex(
        w => w.id === targetWidgetId
      );

      if (draggedIndex !== -1 && targetIndex !== -1) {
        reorderWidgets(draggedWidget, targetIndex);
      }
    }
    setDraggedWidget(null);
  };

  const resetToDefault = () => {
    updateLayout({
      widgets: [
        { id: 'metrics', enabled: true, order: 0 },
        { id: 'activity', enabled: true, order: 1 },
        { id: 'quickActions', enabled: true, order: 2 },
        { id: 'topContent', enabled: true, order: 3 },
        { id: 'systemStatus', enabled: true, order: 4 },
      ],
      compactMode: false,
      theme: 'dark',
    });
  };

  const saveSettings = () => {
    // Here you would typically save to localStorage or user preferences
    localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gaming-card rounded-gaming w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stakeados-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Personalizar Dashboard
            </h2>
            <p className="text-sm text-stakeados-gray-400 mt-1">
              Configura la disposición y apariencia de tu panel de control
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Layout Options */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Opciones de Diseño
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() =>
                  updateLayout({ compactMode: !layout.compactMode })
                }
                className={cn(
                  'p-4 rounded-gaming border transition-all duration-200',
                  layout.compactMode
                    ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                    : 'border-stakeados-gray-600 hover:border-stakeados-gray-500 text-stakeados-gray-300'
                )}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Modo Compacto</p>
              </button>

              <button
                onClick={() => updateLayout({ compactMode: false })}
                className={cn(
                  'p-4 rounded-gaming border transition-all duration-200',
                  !layout.compactMode
                    ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                    : 'border-stakeados-gray-600 hover:border-stakeados-gray-500 text-stakeados-gray-300'
                )}
              >
                <Monitor className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Modo Estándar</p>
              </button>
            </div>
          </div>

          {/* Widget Configuration */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Widgets del Dashboard
            </h3>
            <p className="text-sm text-stakeados-gray-400 mb-4">
              Arrastra para reordenar, haz clic en el ojo para mostrar/ocultar
            </p>

            <div className="space-y-2">
              {layout.widgets
                .sort((a, b) => a.order - b.order)
                .map(widget => {
                  const widgetInfo = widgets.find(w => w.id === widget.id);
                  if (!widgetInfo) return null;

                  return (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={e => handleDragStart(e, widget.id)}
                      onDragOver={handleDragOver}
                      onDrop={e => handleDrop(e, widget.id)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-gaming border transition-all duration-200 cursor-move',
                        widget.enabled
                          ? 'border-stakeados-gray-600 bg-stakeados-gray-800/50'
                          : 'border-stakeados-gray-700 bg-stakeados-gray-900/50 opacity-60',
                        draggedWidget === widget.id && 'opacity-50 scale-95'
                      )}
                    >
                      <GripVertical className="w-5 h-5 text-stakeados-gray-400 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {widgetInfo.name}
                        </p>
                        <p className="text-xs text-stakeados-gray-400">
                          {widgetInfo.description}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleWidget(widget.id)}
                        className={cn(
                          'p-2 rounded-gaming transition-colors',
                          widget.enabled
                            ? 'text-stakeados-primary hover:bg-stakeados-primary/10'
                            : 'text-stakeados-gray-500 hover:bg-stakeados-gray-700'
                        )}
                      >
                        {widget.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Theme Options */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Tema</h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateLayout({ theme: 'dark' })}
                className={cn(
                  'p-4 rounded-gaming border transition-all duration-200',
                  layout.theme === 'dark'
                    ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                    : 'border-stakeados-gray-600 hover:border-stakeados-gray-500 text-stakeados-gray-300'
                )}
              >
                <div className="w-6 h-6 bg-stakeados-gray-800 rounded mx-auto mb-2" />
                <p className="text-sm font-medium">Oscuro</p>
              </button>

              <button
                onClick={() => updateLayout({ theme: 'light' })}
                className={cn(
                  'p-4 rounded-gaming border transition-all duration-200',
                  layout.theme === 'light'
                    ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                    : 'border-stakeados-gray-600 hover:border-stakeados-gray-500 text-stakeados-gray-300'
                )}
              >
                <div className="w-6 h-6 bg-white rounded mx-auto mb-2" />
                <p className="text-sm font-medium">Claro</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-stakeados-gray-700">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-light text-stakeados-dark font-medium rounded-gaming transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
