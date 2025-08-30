import React from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, Bell, Zap } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface ComingSoonPageProps {
  searchParams: {
    feature?: string;
    description?: string;
    estimated?: string;
  };
}

export default function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const featureName = searchParams.feature || 'Esta funcionalidad';
  const description = searchParams.description || 'Esta funcionalidad está en desarrollo y estará disponible pronto.';
  const estimatedDate = searchParams.estimated;

  return (
    <PageLayout showBreadcrumbs={false} className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-blue-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Próximamente
        </h1>

        {/* Feature name */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {featureName}
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Estimated date */}
        {estimatedDate && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-blue-700">
              <Zap className="w-5 h-5 mr-2" />
              <span className="font-medium">
                Fecha estimada: {estimatedDate}
              </span>
            </div>
          </div>
        )}

        {/* Features list */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Mientras tanto, puedes:
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Explorar las funcionalidades disponibles</li>
            <li>• Revisar nuestros artículos y noticias</li>
            <li>• Unirte a nuestra comunidad</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button 
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            onClick={() => {
              // TODO: Implement notification subscription when notification system is ready
              alert('La funcionalidad de notificaciones estará disponible pronto');
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notificarme cuando esté listo
          </button>
          
          <Link 
            href="/"
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 mt-6">
          Estamos trabajando duro para traerte las mejores funcionalidades.
        </p>
      </div>
      </div>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Próximamente - Stakeados',
  description: 'Esta funcionalidad está en desarrollo y estará disponible pronto.',
};