'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock, Zap } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
  estimatedDate?: string;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  featureName,
  description,
  estimatedDate
}: ComingSoonModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Próximamente
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {featureName}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {description || 'Esta funcionalidad está en desarrollo y estará disponible pronto.'}
            </p>

            {estimatedDate && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center text-blue-700">
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Fecha estimada: {estimatedDate}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Dialog.Close asChild>
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                Entendido
              </button>
            </Dialog.Close>
            <button 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => {
                // TODO: Implement notification subscription when notification system is ready
                alert('La funcionalidad de notificaciones estará disponible pronto');
                onClose();
              }}
            >
              Notificarme
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}