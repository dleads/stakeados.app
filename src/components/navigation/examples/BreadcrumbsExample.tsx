'use client';

import React from 'react';
import { ChevronRight, Home, ArrowRight } from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import { useBreadcrumbs, useCustomBreadcrumbs } from '@/hooks/useBreadcrumbs';
import type { BreadcrumbItem } from '@/types/navigation';

/**
 * Example component demonstrating different breadcrumb configurations
 */
export default function BreadcrumbsExample() {
  // Example 1: Basic breadcrumbs
  const basicBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Artículos', href: '/articles' },
    { label: 'Tecnología', href: '/articles/technology' },
    { label: 'React Hooks', isCurrentPage: true }
  ];

  // Example 2: Breadcrumbs with home
  const breadcrumbsWithHome: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Comunidad', href: '/community' },
    { label: 'Discusiones', isCurrentPage: true }
  ];

  // Example 3: Long breadcrumbs (will be truncated)
  const longBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Nivel 1', href: '/level1' },
    { label: 'Nivel 2', href: '/level2' },
    { label: 'Nivel 3', href: '/level3' },
    { label: 'Nivel 4', href: '/level4' },
    { label: 'Nivel 5', href: '/level5' },
    { label: 'Nivel 6', href: '/level6' },
    { label: 'Actual', isCurrentPage: true }
  ];

  // Example 4: Using the hook for automatic breadcrumbs
  const { breadcrumbs: autoBreadcrumbs, shouldShowBreadcrumbs } = useBreadcrumbs({
    dynamicParams: { title: 'Artículo Dinámico' }
  });

  // Example 5: Custom breadcrumbs using factory
  const { breadcrumbs: customBreadcrumbs } = useCustomBreadcrumbs(() => [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reportes', href: '/dashboard/reports' },
    { label: 'Ventas Mensuales', isCurrentPage: true }
  ]);

  return (
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Ejemplos de Breadcrumbs
        </h1>

        {/* Example 1: Basic Breadcrumbs */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            1. Breadcrumbs Básicos
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <Breadcrumbs items={basicBreadcrumbs} showHome={false} />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Breadcrumbs simples sin icono de inicio
          </p>
        </section>

        {/* Example 2: With Home Icon */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            2. Con Icono de Inicio
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <Breadcrumbs items={breadcrumbsWithHome} showHome={true} />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Breadcrumbs con icono de casa para el inicio
          </p>
        </section>

        {/* Example 3: Custom Separator */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            3. Separador Personalizado
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <Breadcrumbs 
              items={basicBreadcrumbs} 
              separator={<ArrowRight className="h-4 w-4 text-blue-500" />}
              showHome={false}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Usando un separador personalizado (flecha azul)
          </p>
        </section>

        {/* Example 4: Truncated Long Breadcrumbs */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            4. Breadcrumbs Largos (Truncados)
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <Breadcrumbs 
              items={longBreadcrumbs} 
              maxItems={4}
              showHome={false}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Breadcrumbs largos se truncan automáticamente (máximo 4 elementos)
          </p>
        </section>

        {/* Example 5: Automatic Breadcrumbs */}
        {shouldShowBreadcrumbs && (
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              5. Breadcrumbs Automáticos
            </h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
              <Breadcrumbs items={autoBreadcrumbs} />
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Generados automáticamente basados en la ruta actual
            </p>
          </section>
        )}

        {/* Example 6: Custom Factory Breadcrumbs */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            6. Breadcrumbs Personalizados
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <Breadcrumbs items={customBreadcrumbs} />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Creados usando una función factory personalizada
          </p>
        </section>

        {/* Example 7: Different Styles */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            7. Estilos Personalizados
          </h2>
          
          {/* Compact Style */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Estilo Compacto
            </h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <Breadcrumbs 
                items={basicBreadcrumbs}
                className="text-xs"
                separator={<span className="mx-1 text-gray-400">/</span>}
                showHome={false}
              />
            </div>
          </div>

          {/* Large Style */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Estilo Grande
            </h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
              <Breadcrumbs 
                items={basicBreadcrumbs}
                className="text-lg"
                separator={<ChevronRight className="h-5 w-5 text-gray-400 mx-2" />}
                showHome={false}
              />
            </div>
          </div>
        </section>

        {/* Usage Code Examples */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Ejemplos de Código
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Uso Básico
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                <code>{`import Breadcrumbs from '@/components/navigation/Breadcrumbs';

const breadcrumbs = [
  { label: 'Inicio', href: '/' },
  { label: 'Artículos', href: '/articles' },
  { label: 'Actual', isCurrentPage: true }
];

<Breadcrumbs items={breadcrumbs} />`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Con Hook Automático
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                <code>{`import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

function MyPage() {
  const { breadcrumbs, shouldShowBreadcrumbs } = useBreadcrumbs({
    dynamicParams: { title: 'Mi Título' }
  });

  return (
    <>
      {shouldShowBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      {/* Contenido de la página */}
    </>
  );
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}