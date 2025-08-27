'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Lock } from 'lucide-react';

import { useRole } from './RoleProvider';
import { UserRole } from '@/types/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireGenesis?: boolean;
  requireGenesisForContent?: boolean;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireGenesis = false,
  requireGenesisForContent = false,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, role, loading, hasRole } = useRole();
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);

  // Check if user is Genesis holder (this could be enhanced with NFT verification)
  useEffect(() => {
    if (user) {
      // For now, we'll use a simple check. In the future, this should verify NFT ownership
      setIsGenesisHolder(true); // Placeholder - implement actual Genesis verification
    }
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Lock className="w-16 h-16 text-stakeados-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Autenticación Requerida
          </h1>
          <p className="text-stakeados-gray-300 mb-8">
            Necesitas iniciar sesión para acceder a esta página. Únete a la
            comunidad Stakeados para desbloquear contenido educativo exclusivo
            de Web3.
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

  // Check admin requirement
  if (requireAdmin && (!user || role !== UserRole.ADMIN)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Acceso de Administrador Requerido
          </h1>
          <p className="text-stakeados-gray-300 mb-8">
            Necesitas privilegios de administrador para acceder a esta página.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

  // Check role requirement
  if (requiredRole && (!user || !hasRole(requiredRole))) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    const roleNames = requiredRoles
      .map(r => r.charAt(0).toUpperCase() + r.slice(1))
      .join(' o ');

    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Acceso de {roleNames} Requerido
          </h1>
          <p className="text-stakeados-gray-300 mb-8">
            Necesitas privilegios de {roleNames.toLowerCase()} para acceder a
            esta página.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

  // Check Genesis requirement
  if ((requireGenesis || requireGenesisForContent) && !isGenesisHolder) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-stakeados-yellow mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Acceso Genesis Requerido
          </h1>
          <p className="text-stakeados-gray-300 mb-8">
            {requireGenesisForContent
              ? 'Este contenido es exclusivo para miembros de la comunidad Genesis. Reclama tu estado Genesis para desbloquear privilegios especiales.'
              : 'Este contenido es exclusivo para miembros de la comunidad Genesis. Únete a los miembros fundadores para desbloquear privilegios especiales y acceso anticipado.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-stakeados-yellow hover:bg-stakeados-yellow-dark text-black px-6 py-3 rounded-lg transition-colors font-medium">
              {requireGenesisForContent
                ? 'Reclamar Estado Genesis'
                : 'Conocer Genesis'}
            </button>
            <button className="bg-stakeados-gray-600 hover:bg-stakeados-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
