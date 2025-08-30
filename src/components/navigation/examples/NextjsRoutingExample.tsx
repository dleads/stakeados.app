'use client';

import React, { useState } from 'react';
import { NavigationProvider } from '../NavigationProvider';
import { NavigationLink, SectionNavigationLink } from '../NavigationLink';
import { RouteTransition, NavigationLoadingIndicator } from '../RouteTransition';
import { useNextNavigation } from '@/hooks/useNextNavigation';
import { useNavigationState } from '@/hooks/useNavigationState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Home, ExternalLink, Hash } from 'lucide-react';
import type { NavigationSection } from '@/types/navigation';

// Example navigation sections
const exampleSections: NavigationSection[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/es',
    isImplemented: true
  },
  {
    id: 'articles',
    label: 'Artículos',
    href: '/es/articles',
    isImplemented: true
  },
  {
    id: 'news',
    label: 'Noticias',
    href: '/es/news',
    isImplemented: false,
    badge: {
      text: 'Próximamente',
      variant: 'coming-soon'
    }
  },
  {
    id: 'community',
    label: 'Comunidad',
    href: '/es/community',
    requiredAuth: true,
    isImplemented: false,
    badge: {
      text: 'Beta',
      variant: 'beta'
    }
  }
];

/**
 * Example component demonstrating Next.js routing integration
 */
function RoutingExampleContent() {
  const {
    currentPath,
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    isRouteActive,
    buildUrl,
    navigationHistory,
    isRouteChanging
  } = useNextNavigation();

  const {
    isNavigating,
    visibleSections
  } = useNavigationState();

  const [customPath, setCustomPath] = useState('');

  const handleCustomNavigation = () => {
    if (customPath.trim()) {
      navigate(buildUrl(customPath.trim()));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Next.js Routing Integration Example</CardTitle>
          <CardDescription>
            Demonstrating smooth client-side navigation, browser history support, and route state management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Route Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Current Route Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current Path:</strong> {currentPath}
              </div>
              <div>
                <strong>Is Navigating:</strong> {isNavigating ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Route Changing:</strong> {isRouteChanging ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>History Length:</strong> {navigationHistory.length}
              </div>
            </div>
          </div>

          {/* Browser Navigation Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold">Browser Navigation</h3>
            <div className="flex gap-2">
              <Button
                onClick={goBack}
                disabled={!canGoBack}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={goForward}
                disabled={!canGoForward}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Forward
              </Button>
              <Button
                onClick={() => navigate('/es')}
                variant="outline"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>

          {/* Navigation Links Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Navigation Links</h3>
            
            {/* Internal Links */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Internal Navigation</h4>
              <div className="flex flex-wrap gap-2">
                {exampleSections.map((section) => (
                  <SectionNavigationLink
                    key={section.id}
                    section={section}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      isRouteActive(section.href)
                        ? 'bg-green-100 text-green-800 font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {section.label}
                  </SectionNavigationLink>
                ))}
              </div>
            </div>

            {/* External Links */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">External Links</h4>
              <div className="flex flex-wrap gap-2">
                <NavigationLink
                  href="https://nextjs.org"
                  className="px-3 py-2 rounded-md text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
                >
                  Next.js Docs
                  <ExternalLink className="w-3 h-3" />
                </NavigationLink>
                <NavigationLink
                  href="https://supabase.com"
                  className="px-3 py-2 rounded-md text-sm bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors inline-flex items-center gap-1"
                >
                  Supabase
                  <ExternalLink className="w-3 h-3" />
                </NavigationLink>
              </div>
            </div>

            {/* Anchor Links */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Anchor Links</h4>
              <div className="flex flex-wrap gap-2">
                <NavigationLink
                  href="#top"
                  className="px-3 py-2 rounded-md text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors inline-flex items-center gap-1"
                >
                  <Hash className="w-3 h-3" />
                  Top of Page
                </NavigationLink>
              </div>
            </div>
          </div>

          {/* Custom Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold">Custom Navigation</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="Enter path (e.g., /articles, /admin)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <Button
                onClick={handleCustomNavigation}
                disabled={!customPath.trim()}
                size="sm"
              >
                Navigate
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Path will be automatically prefixed with current locale
            </p>
          </div>

          {/* Route Active Detection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Route Active Detection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {exampleSections.map((section) => (
                <div key={section.id} className="flex justify-between">
                  <span>{section.href}</span>
                  <span className={`font-medium ${
                    isRouteActive(section.href) ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {isRouteActive(section.href) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation History */}
          <div className="space-y-4">
            <h3 className="font-semibold">Navigation History</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm space-y-1">
                {navigationHistory.length > 0 ? (
                  navigationHistory.map((path, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="font-mono">{path}</span>
                      <span className="text-gray-500">
                        {index === navigationHistory.length - 1 ? '(current)' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No navigation history</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      <NavigationLoadingIndicator
        show={isNavigating || isRouteChanging}
        position="top"
      />
    </div>
  );
}

/**
 * Main example component with providers
 */
export function NextjsRoutingExample() {
  return (
    <NavigationProvider>
      <RouteTransition>
        <div id="top" className="min-h-screen bg-gray-50">
          <RoutingExampleContent />
        </div>
      </RouteTransition>
    </NavigationProvider>
  );
}

export default NextjsRoutingExample;