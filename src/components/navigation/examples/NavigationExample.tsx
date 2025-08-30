'use client';

import React from 'react';
import { useNavigationState } from '@/hooks/useNavigationState';

/**
 * Example component showing how to use the navigation system
 * This demonstrates the key features implemented in task 1
 */
export function NavigationExample() {
  const {
    isAuthenticated,
    userRole,
    currentPath,
    visibleSections,
    userMenuItems,
    adminMenuItems,
    safeNavigate,
    config,
  } = useNavigationState();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Navigation System Example</h1>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User Role: {userRole || 'None'}</p>
        <p>Current Path: {currentPath}</p>
      </div>

      {/* Visible Navigation Sections */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Visible Navigation Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {visibleSections.map((section) => (
            <div
              key={section.id}
              className={`p-3 rounded border cursor-pointer hover:bg-blue-100 ${
                section.isImplemented 
                  ? 'bg-white border-blue-200' 
                  : 'bg-gray-50 border-gray-300 opacity-60'
              }`}
              onClick={() => safeNavigate(section.href, section)}
            >
              <div className="font-medium">{section.label}</div>
              <div className="text-sm text-gray-600">{section.href}</div>
              <div className="text-xs mt-1">
                {section.isImplemented ? (
                  <span className="text-green-600">✓ Implemented</span>
                ) : (
                  <span className="text-orange-600">⚠ Coming Soon</span>
                )}
                {section.requiredAuth && (
                  <span className="ml-2 text-blue-600">🔒 Auth Required</span>
                )}
                {section.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                    {section.badge.text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Menu Items */}
      {isAuthenticated && userMenuItems.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Menu Items</h2>
          <div className="space-y-2">
            {userMenuItems.map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded border cursor-pointer hover:bg-green-100 ${
                  item.isImplemented 
                    ? 'bg-white border-green-200' 
                    : 'bg-gray-50 border-gray-300 opacity-60'
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-600">
                  {item.action || item.href}
                </div>
                <div className="text-xs">
                  {item.isImplemented ? (
                    <span className="text-green-600">✓ Available</span>
                  ) : (
                    <span className="text-orange-600">⚠ Coming Soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Menu Items */}
      {userRole === 'admin' && adminMenuItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Admin Menu Items</h2>
          <div className="space-y-2">
            {adminMenuItems.map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded border cursor-pointer hover:bg-red-100 ${
                  item.isImplemented 
                    ? 'bg-white border-red-200' 
                    : 'bg-gray-50 border-gray-300 opacity-60'
                }`}
                onClick={() => safeNavigate(item.href, { 
                  id: item.id, 
                  label: item.label, 
                  href: item.href, 
                  isImplemented: item.isImplemented 
                })}
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-600">{item.href}</div>
                <div className="text-xs">
                  {item.isImplemented ? (
                    <span className="text-green-600">✓ Available</span>
                  ) : (
                    <span className="text-orange-600">⚠ Coming Soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Configuration Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Sections</div>
            <div>{config.sections.length}</div>
          </div>
          <div>
            <div className="font-medium">Implemented Sections</div>
            <div>{config.sections.filter(s => s.isImplemented).length}</div>
          </div>
          <div>
            <div className="font-medium">Implementation Progress</div>
            <div>
              {Math.round((config.sections.filter(s => s.isImplemented).length / config.sections.length) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}