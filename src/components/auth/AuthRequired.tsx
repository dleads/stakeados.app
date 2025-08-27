'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export default function AuthRequired() {
  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <Lock className="w-16 h-16 text-stakeados-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">
          Autenticación Requerida
        </h1>
        <p className="text-stakeados-gray-300 mb-8">
          Necesitas iniciar sesión para acceder a esta función. Únete a la
          comunidad Stakeados para desbloquear contenido educativo exclusivo de
          Web3.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => (window.location.href = '/es')}
            className="bg-stakeados-gray-600 hover:bg-stakeados-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
