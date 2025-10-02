'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useNavigation } from '@/components/navigation/NavigationProvider';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';

function Content() {
  const { navigate, goBack, canGoBack, getVisibleSections, currentPath } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ label: string; href: string }>>([]);

  // Get navigation suggestions based on available sections
  useEffect(() => {
    const visibleSections = getVisibleSections();
    const sectionSuggestions = visibleSections
      .filter(section => section.isImplemented)
      .slice(0, 4)
      .map(section => ({
        label: section.label,
        href: section.href
      }));
    
    setSuggestions(sectionSuggestions);
  }, [getVisibleSections]);

  // Extract locale from current path
  const locale = currentPath.split('/')[1] || 'es';

  const handleGoHome = () => {
    navigate(`/${locale}`);
  };

  const handleGoBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      handleGoHome();
    }
  };

  const handleSuggestionClick = (href: string) => {
    navigate(href);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* 404 Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-400 animate-pulse" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-green-400 mb-2">404</h1>
            <div className="w-24 h-1 bg-green-400 mx-auto rounded-full"></div>
          </div>

          {/* Error message */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Página No Encontrada
          </h2>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            La página que buscas podría haber sido eliminada, renombrada o no estar disponible temporalmente.
          </p>

          {/* Search functionality */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Buscar contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
              />
              <Button
                onClick={handleSearch}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Navigation options */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoHome}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </Button>
              
              {canGoBack && (
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver Atrás
                </Button>
              )}
            </div>
          </div>

          {/* Helpful suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-green-400 mb-4">
                Destinos Populares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.href)}
                    className="text-left text-gray-300 hover:text-green-400 transition-colors p-2 rounded hover:bg-gray-700"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional help */}
          <div className="mt-8 text-sm text-gray-400">
            <p>
              Si crees que esto es un error, puedes{' '}
              <button
                onClick={() => navigate(`/${locale}/admin`)}
                className="text-green-400 hover:text-green-300 underline"
              >
                contactar al administrador
              </button>
              {' '}o{' '}
              <button
                onClick={() => window.location.reload()}
                className="text-green-400 hover:text-green-300 underline"
              >
                recargar la página
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
