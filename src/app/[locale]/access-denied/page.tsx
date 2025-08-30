import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Home, LogIn } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface AccessDeniedPageProps {
  searchParams: {
    reason?: string;
    feature?: string;
    redirect?: string;
  };
}

export default function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const reason = searchParams.reason || 'insufficient-permissions';
  const featureName = searchParams.feature;
  const redirectUrl = searchParams.redirect;

  const getTitle = () => {
    switch (reason) {
      case 'not-authenticated':
        return 'Acceso Restringido';
      case 'insufficient-role':
        return 'Permisos Insuficientes';
      default:
        return 'Acceso Denegado';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'not-authenticated':
        return 'Debes iniciar sesión para acceder a esta funcionalidad.';
      case 'insufficient-role':
        return 'No tienes los permisos necesarios para acceder a esta sección.';
      default:
        return 'No tienes autorización para acceder a esta página.';
    }
  };

  const getActionButton = () => {
    if (reason === 'not-authenticated') {
      const loginUrl = redirectUrl 
        ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
        : '/login';
      
      return (
        <Link 
          href={loginUrl}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Iniciar Sesión
        </Link>
      );
    }

    return (
      <Link 
        href="/"
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <Home className="w-4 h-4 mr-2" />
        Ir al Inicio
      </Link>
    );
  };

  return (
    <PageLayout showBreadcrumbs={false} className="bg-gradient-to-br from-red-50 to-orange-100">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getTitle()}
        </h1>

        {/* Feature name if provided */}
        {featureName && (
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {featureName}
          </h2>
        )}

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {getMessage()}
        </p>

        {/* Additional info based on reason */}
        {reason === 'insufficient-role' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Si crees que deberías tener acceso a esta funcionalidad, 
              contacta con el administrador del sistema.
            </p>
          </div>
        )}

        {reason === 'not-authenticated' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Inicia sesión con tu cuenta para acceder a todas las funcionalidades 
              de la plataforma.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {getActionButton()}
          
          <Link 
            href="/"
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </div>

        {/* Help section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            ¿Necesitas ayuda?
          </p>
          <div className="flex justify-center space-x-4 text-xs">
            <Link href="/help" className="text-blue-600 hover:text-blue-800">
              Centro de Ayuda
            </Link>
            <Link href="/contact" className="text-blue-600 hover:text-blue-800">
              Contacto
            </Link>
          </div>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Acceso Denegado - Stakeados',
  description: 'No tienes permisos para acceder a esta página.',
};