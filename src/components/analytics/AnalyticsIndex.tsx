'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Target,
} from 'lucide-react';
import ContentAnalyticsDashboard from './ContentAnalyticsDashboard';
import UserEngagementAnalytics from './UserEngagementAnalytics';
import EditorialAnalyticsDashboard from './EditorialAnalyticsDashboard';
import PerformanceTracker from './PerformanceTracker';

interface AnalyticsIndexProps {
  userId: string;
  userRole: 'admin' | 'editor' | 'author' | 'user';
  contentId?: string;
  contentType?: 'article' | 'news';
}

export default function AnalyticsIndex({
  userId,
  userRole,
  contentId,
  contentType,
}: AnalyticsIndexProps) {
  const t = useTranslations('analytics');
  const [selectedView, setSelectedView] = useState('overview');

  const isAuthor = userRole === 'author';
  const isEditor = ['admin', 'editor'].includes(userRole);
  const isAdmin = userRole === 'admin';

  // Determine available analytics views based on user role
  const getAvailableViews = () => {
    const views = [{ id: 'overview', label: t('overview'), icon: BarChart3 }];

    if (isAuthor || isEditor || isAdmin) {
      views.push({ id: 'content', label: 'Content Analytics', icon: FileText });
    }

    if (isEditor || isAdmin) {
      views.push(
        { id: 'engagement', label: 'User Engagement', icon: Users },
        { id: 'editorial', label: 'Editorial Analytics', icon: Target }
      );
    }

    if (contentId && contentType) {
      views.push({
        id: 'performance',
        label: 'Performance Tracker',
        icon: TrendingUp,
      });
    }

    return views;
  };

  const availableViews = getAvailableViews();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Analytics Views
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableViews.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for your role
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole}</div>
            <p className="text-xs text-muted-foreground">Access level</p>
          </CardContent>
        </Card>

        {contentId && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Content Type
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {contentType}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tracking enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Analytics Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  Real-time tracking
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableViews.slice(1).map(view => {
          const Icon = view.icon;
          return (
            <Card
              key={view.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{view.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {view.id === 'content' &&
                    'Track your content performance and engagement metrics'}
                  {view.id === 'engagement' &&
                    'Analyze user behavior and interaction patterns'}
                  {view.id === 'editorial' &&
                    'Monitor editorial workflow and content quality'}
                  {view.id === 'performance' &&
                    'Detailed performance analysis for specific content'}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedView(view.id)}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role-specific Information */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Access</CardTitle>
          <CardDescription>
            Available analytics features based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRole === 'author' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  Author Analytics
                </h4>
                <p className="text-sm text-blue-600">
                  Track your content performance, view engagement metrics, and
                  monitor your article success rates.
                </p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                  <li>• Content performance tracking</li>
                  <li>• Reader engagement analysis</li>
                  <li>• Article success metrics</li>
                </ul>
              </div>
            )}

            {userRole === 'editor' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Editor Analytics
                </h4>
                <p className="text-sm text-green-600">
                  Access comprehensive analytics including user engagement,
                  editorial workflow, and content quality metrics.
                </p>
                <ul className="text-sm text-green-600 mt-2 space-y-1">
                  <li>• All author analytics features</li>
                  <li>• User engagement analytics</li>
                  <li>• Editorial workflow metrics</li>
                  <li>• Content quality analysis</li>
                </ul>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">
                  Admin Analytics
                </h4>
                <p className="text-sm text-purple-600">
                  Full access to all analytics features including platform-wide
                  metrics and advanced insights.
                </p>
                <ul className="text-sm text-purple-600 mt-2 space-y-1">
                  <li>• Complete analytics suite</li>
                  <li>• Platform-wide metrics</li>
                  <li>• Advanced editorial insights</li>
                  <li>• User behavior analysis</li>
                  <li>• Content gap analysis</li>
                </ul>
              </div>
            )}

            {userRole === 'user' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">User Access</h4>
                <p className="text-sm text-gray-600">
                  Limited analytics access. Consider becoming a contributor to
                  unlock more features.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Become a Contributor
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500">
            Comprehensive analytics and insights for content performance
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        value={selectedView}
        onValueChange={setSelectedView}
        className="space-y-4"
      >
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${availableViews.length}, 1fr)`,
          }}
        >
          {availableViews.map(view => {
            const Icon = view.icon;
            return (
              <TabsTrigger
                key={view.id}
                value={view.id}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>

        {(isAuthor || isEditor || isAdmin) && (
          <TabsContent value="content">
            <ContentAnalyticsDashboard
              userId={userId}
              isAuthor={isAuthor}
              contentId={contentId}
              contentType={contentType}
            />
          </TabsContent>
        )}

        {(isEditor || isAdmin) && (
          <>
            <TabsContent value="engagement">
              <UserEngagementAnalytics
                contentId={contentId}
                contentType={contentType}
                userId={userId}
              />
            </TabsContent>

            <TabsContent value="editorial">
              <EditorialAnalyticsDashboard editorId={userId} />
            </TabsContent>
          </>
        )}

        {contentId && contentType && (
          <TabsContent value="performance">
            <PerformanceTracker
              contentId={contentId}
              contentType={contentType}
              title={`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Performance`}
              publishedAt={new Date().toISOString()}
              authorId={isAuthor ? userId : undefined}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
