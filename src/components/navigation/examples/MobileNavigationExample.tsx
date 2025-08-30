'use client';

import React, { useState } from 'react';
import { NavigationProvider } from '../NavigationProvider';
import HamburgerButton from '../HamburgerButton';
import MobileMenu from '../MobileMenu';
import { defaultNavigationConfig } from '@/lib/navigation/config';

/**
 * Example component demonstrating the mobile navigation system
 * This shows how the HamburgerButton and MobileMenu work together
 */
export default function MobileNavigationExample() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <NavigationProvider config={defaultNavigationConfig}>
      <div className="min-h-screen bg-black text-white">
        {/* Example Header with Mobile Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-green-500/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="text-xl font-bold text-green-400">
                Stakeados
              </div>

              {/* Mobile Menu Button */}
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={toggleMobileMenu}
                size="md"
                variant="default"
              />
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          slideDirection="right"
        />

        {/* Example Content */}
        <main className="pt-20 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Mobile Navigation System</h1>
            
            <div className="space-y-6">
              <section className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-400">Features Implemented</h2>
                <ul className="space-y-2 text-gray-300">
                  <li>✅ HamburgerButton component with proper accessibility</li>
                  <li>✅ MobileMenu component with slide-out functionality</li>
                  <li>✅ Touch-friendly interactions and mobile styling</li>
                  <li>✅ Menu state management with outside click detection</li>
                  <li>✅ Keyboard navigation support (Escape key)</li>
                  <li>✅ Focus management for accessibility</li>
                  <li>✅ Body scroll prevention when menu is open</li>
                  <li>✅ Smooth animations and transitions</li>
                </ul>
              </section>

              <section className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-400">Accessibility Features</h2>
                <ul className="space-y-2 text-gray-300">
                  <li>• ARIA attributes for screen readers</li>
                  <li>• Keyboard navigation support</li>
                  <li>• Focus management</li>
                  <li>• Proper semantic HTML structure</li>
                  <li>• Touch-friendly button sizes (44px minimum)</li>
                  <li>• High contrast colors for visibility</li>
                </ul>
              </section>

              <section className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-400">Mobile Interactions</h2>
                <ul className="space-y-2 text-gray-300">
                  <li>• Tap the hamburger button to open/close menu</li>
                  <li>• Tap outside the menu to close it</li>
                  <li>• Press Escape key to close menu</li>
                  <li>• Smooth slide animations</li>
                  <li>• Responsive design for different screen sizes</li>
                </ul>
              </section>

              <section className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-400">Integration</h2>
                <p className="text-gray-300 mb-4">
                  The mobile navigation system is fully integrated with:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li>• NavigationProvider for state management</li>
                  <li>• Authentication system for user-specific menus</li>
                  <li>• Role-based navigation filtering</li>
                  <li>• Safe navigation with implementation checks</li>
                  <li>• Existing design system and styling</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </NavigationProvider>
  );
}