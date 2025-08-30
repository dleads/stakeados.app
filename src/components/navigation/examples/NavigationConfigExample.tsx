'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigationConfig, useNavigationStats } from '@/hooks/useNavigationConfig';
import { NavigationConfigPanel } from '../NavigationConfigPanel';
import { 
  enableSection, 
  disableSection, 
  setSectionBadge, 
  rolloutArticleSystem,
  rolloutNewsSystem,
  rolloutCommunityFeatures,
  applyDevelopmentConfig,
  applyProductionConfig,
  getConfigurationSummary
} from '@/lib/navigation/config-utils';

/**
 * Example component demonstrating navigation configuration management
 * This shows how to use the configuration system in different scenarios
 */
export function NavigationConfigExample() {
  const { config, isLoading } = useNavigationConfig();
  const stats = useNavigationStats();
  const [summary, setSummary] = useState<any>(null);

  // Example: Enable a specific feature
  const handleEnableArticles = () => {
    rolloutArticleSystem();
  };

  // Example: Enable news system
  const handleEnableNews = () => {
    rolloutNewsSystem();
  };

  // Example: Enable community features in beta
  const handleEnableCommunity = () => {
    rolloutCommunityFeatures();
  };

  // Example: Apply development configuration
  const handleApplyDevConfig = () => {
    applyDevelopmentConfig();
  };

  // Example: Apply production configuration
  const handleApplyProdConfig = () => {
    applyProductionConfig();
  };

  // Example: Manual section management
  const handleToggleSection = (sectionId: string, enabled: boolean) => {
    if (enabled) {
      enableSection(sectionId);
    } else {
      disableSection(sectionId);
    }
  };

  // Example: Add badge to section
  const handleAddBadge = (sectionId: string) => {
    setSectionBadge(sectionId, 'Nuevo', 'new');
  };

  // Example: Get configuration summary
  const handleGetSummary = () => {
    const configSummary = getConfigurationSummary();
    setSummary(configSummary);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Navigation Configuration Management</h1>
        <p className="text-muted-foreground mt-2">
          Examples of how to manage navigation configuration dynamically
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Feature Rollouts</CardTitle>
          <CardDescription>
            Enable complete features with a single click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleEnableArticles} disabled={isLoading}>
              Enable Article System
            </Button>
            <Button onClick={handleEnableNews} disabled={isLoading}>
              Enable News System
            </Button>
            <Button onClick={handleEnableCommunity} disabled={isLoading}>
              Enable Community (Beta)
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Environment Presets</h4>
            <div className="flex gap-2">
              <Button onClick={handleApplyDevConfig} variant="outline" disabled={isLoading}>
                Development Config
              </Button>
              <Button onClick={handleApplyProdConfig} variant="outline" disabled={isLoading}>
                Production Config
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration Status</CardTitle>
          <CardDescription>
            Overview of the current navigation configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.sections.implemented}
              </div>
              <div className="text-sm text-muted-foreground">Sections Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.sections.unimplemented}
              </div>
              <div className="text-sm text-muted-foreground">Sections Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.sections.withBadges}
              </div>
              <div className="text-sm text-muted-foreground">Sections with Badges</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Navigation Sections</h4>
            {config.sections.map(section => (
              <div key={section.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <span>{section.label}</span>
                  {section.badge && (
                    <Badge variant="outline">
                      {section.badge.text}
                    </Badge>
                  )}
                  {section.isImplemented ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleSection(section.id, !section.isImplemented)}
                    disabled={isLoading}
                  >
                    {section.isImplemented ? 'Disable' : 'Enable'}
                  </Button>
                  {!section.badge && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBadge(section.id)}
                      disabled={isLoading}
                    >
                      Add Badge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            Detailed breakdown of the current configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetSummary} className="mb-4">
            Get Configuration Summary
          </Button>
          
          {summary && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Implementation Statistics</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Sections</div>
                    <div>{summary.stats.sections.implementationRate.toFixed(1)}% Complete</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">User Menu</div>
                    <div>{summary.stats.userMenuItems.implementationRate.toFixed(1)}% Complete</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Admin Menu</div>
                    <div>{summary.stats.adminMenuItems.implementationRate.toFixed(1)}% Complete</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Implemented Features</h4>
                <div className="flex flex-wrap gap-1 mt-2">
                  {summary.implementedSections.map((section: string) => (
                    <Badge key={section} variant="default">{section}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Pending Features</h4>
                <div className="flex flex-wrap gap-1 mt-2">
                  {summary.unimplementedSections.map((section: string) => (
                    <Badge key={section} variant="secondary">{section}</Badge>
                  ))}
                </div>
              </div>

              {summary.sectionsWithBadges.length > 0 && (
                <div>
                  <h4 className="font-semibold">Features with Badges</h4>
                  <div className="space-y-1 mt-2">
                    {summary.sectionsWithBadges.map((item: any) => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <span>{item.label}</span>
                        <Badge variant="outline">{item.badge.text}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Configuration Panel */}
      <NavigationConfigPanel />

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to use the configuration management system in your code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Enable a Feature</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { enableSection, setSectionBadge } from '@/lib/navigation/config-utils';

// Enable a section
enableSection('articles');

// Add a badge to highlight the new feature
setSectionBadge('articles', 'Nuevo', 'new');`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Rollout Complete Features</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { rolloutArticleSystem } from '@/lib/navigation/config-utils';

// Enable the entire article system with badge
rolloutArticleSystem();`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Use in React Components</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useNavigationConfig } from '@/hooks/useNavigationConfig';

function MyComponent() {
  const { config, toggleSection } = useNavigationConfig();
  
  const handleEnableFeature = () => {
    toggleSection('articles', true);
  };
  
  return (
    <button onClick={handleEnableFeature}>
      Enable Articles
    </button>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Check Implementation Status</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useIsImplemented } from '@/hooks/useNavigationConfig';

function FeatureComponent() {
  const isArticlesEnabled = useIsImplemented('articles');
  
  if (!isArticlesEnabled) {
    return <div>Articles feature coming soon!</div>;
  }
  
  return <ArticlesComponent />;
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}