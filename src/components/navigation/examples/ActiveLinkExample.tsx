import React, { useState } from 'react';
import NavLinks from '../NavLinks';
import type { NavigationSection } from '@/types/navigation';

const exampleSections: NavigationSection[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/',
    isImplemented: true,
  },
  {
    id: 'articles',
    label: 'Artículos',
    href: '/articles',
    isImplemented: true,
    children: [
      {
        id: 'articles-list',
        label: 'Todos los Artículos',
        href: '/articles',
        isImplemented: true,
      },
      {
        id: 'articles-categories',
        label: 'Categorías',
        href: '/articles/categories',
        isImplemented: true,
      },
      {
        id: 'articles-detail',
        label: 'Detalle del Artículo',
        href: '/articles/[slug]',
        isImplemented: true,
      },
    ],
  },
  {
    id: 'news',
    label: 'Noticias',
    href: '/news',
    isImplemented: true,
    badge: {
      text: 'Nuevo',
      variant: 'new',
    },
  },
  {
    id: 'community',
    label: 'Comunidad',
    href: '/community',
    requiredAuth: true,
    isImplemented: true,
  },
  {
    id: 'courses',
    label: 'Cursos',
    href: '/courses',
    requiredAuth: true,
    isImplemented: false,
    badge: {
      text: 'Próximamente',
      variant: 'coming-soon',
    },
  },
  {
    id: 'admin',
    label: 'Administración',
    href: '/admin',
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: true,
  },
];

const pathExamples = [
  { path: '/', label: 'Página Principal' },
  { path: '/articles', label: 'Artículos' },
  { path: '/articles/categories', label: 'Categorías de Artículos' },
  { path: '/articles/my-article-slug', label: 'Artículo Específico' },
  { path: '/articles/category/blockchain/guide', label: 'Artículo Anidado' },
  { path: '/news', label: 'Noticias' },
  { path: '/news/2024/01/15/breaking-news', label: 'Noticia Específica' },
  { path: '/community', label: 'Comunidad' },
  { path: '/courses', label: 'Cursos (No Implementado)' },
  { path: '/admin', label: 'Panel de Administración' },
  { path: '/unknown-path', label: 'Ruta Desconocida' },
];

export default function ActiveLinkExample() {
  const [currentPath, setCurrentPath] = useState('/');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const handleLinkClick = (href: string) => {
    setCurrentPath(href);
    console.log(`Navigated to: ${href}`);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            Active Link Highlighting Demo
          </h1>
          <p className="text-gray-300">
            Demonstración del sistema de resaltado de enlaces activos con detección de rutas avanzada
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Controles de Demostración</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Estado de Autenticación</label>
              <select
                value={isAuthenticated ? 'authenticated' : 'unauthenticated'}
                onChange={(e) => setIsAuthenticated(e.target.value === 'authenticated')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="authenticated">Autenticado</option>
                <option value="unauthenticated">No Autenticado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rol de Usuario</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                disabled={!isAuthenticated}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Orientación</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'horizontal' | 'vertical')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="horizontal">Horizontal (Desktop)</option>
                <option value="vertical">Vertical (Mobile)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ruta Actual: {currentPath}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {pathExamples.map((example) => (
                <button
                  key={example.path}
                  onClick={() => setCurrentPath(example.path)}
                  className={`p-2 text-sm rounded transition-colors ${
                    currentPath === example.path
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Demo */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">
            Navegación {orientation === 'horizontal' ? 'Desktop' : 'Mobile'}
          </h2>
          
          <div className={`${orientation === 'vertical' ? 'max-w-md' : 'w-full'}`}>
            <NavLinks
              sections={exampleSections}
              currentPath={currentPath}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
              orientation={orientation}
              onLinkClick={handleLinkClick}
            />
          </div>
        </div>

        {/* Features Explanation */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Características Implementadas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-green-300">Detección de Rutas</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Coincidencia exacta para página principal</li>
                <li>✅ Coincidencia de rutas anidadas</li>
                <li>✅ Manejo de parámetros de consulta</li>
                <li>✅ Manejo de fragmentos hash</li>
                <li>✅ Rutas dinámicas ([slug])</li>
                <li>✅ Rutas profundamente anidadas</li>
                <li>✅ Secciones con hijos</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-green-300">Indicadores Visuales</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Punto indicador animado</li>
                <li>✅ Barra de subrayado activa</li>
                <li>✅ Fondo con brillo sutil</li>
                <li>✅ Colores de texto diferenciados</li>
                <li>✅ Bordes y sombras</li>
                <li>✅ Transiciones suaves</li>
                <li>✅ Adaptación móvil/desktop</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-green-300">Accesibilidad</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ aria-current="page" para enlaces activos</li>
                <li>✅ aria-label descriptivos</li>
                <li>✅ aria-describedby para descripciones</li>
                <li>✅ Soporte para lectores de pantalla</li>
                <li>✅ Navegación por teclado</li>
                <li>✅ Indicadores focus visibles</li>
                <li>✅ Roles ARIA apropiados</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-green-300">Control de Acceso</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Filtrado por autenticación</li>
                <li>✅ Filtrado por roles</li>
                <li>✅ Indicadores de funciones no implementadas</li>
                <li>✅ Badges informativos</li>
                <li>✅ Estados deshabilitados</li>
                <li>✅ Mensajes de acceso denegado</li>
                <li>✅ Redirección a login</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current State Info */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Estado Actual</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-medium text-green-300 mb-2">Ruta</h4>
              <p className="text-gray-300 font-mono">{currentPath}</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-medium text-green-300 mb-2">Usuario</h4>
              <p className="text-gray-300">
                {isAuthenticated ? `Autenticado (${userRole})` : 'No autenticado'}
              </p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-medium text-green-300 mb-2">Vista</h4>
              <p className="text-gray-300 capitalize">{orientation}</p>
            </div>
          </div>
        </div>

        {/* Performance Info */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Rendimiento</h2>
          
          <div className="text-sm text-gray-300 space-y-2">
            <p>• Detección de rutas optimizada con coincidencia de segmentos</p>
            <p>• Memoización de cálculos de estado activo</p>
            <p>• Transiciones CSS eficientes</p>
            <p>• Lazy loading de componentes no críticos</p>
            <p>• Manejo eficiente de listas grandes de secciones</p>
          </div>
        </div>
      </div>
    </div>
  );
}