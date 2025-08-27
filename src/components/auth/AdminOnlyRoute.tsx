'use client';

import React from 'react';
import { useRole } from './RoleProvider';
import { AdminOnlyRouteProps } from '@/types/roles';
import FeatureNotAvailable from './FeatureNotAvailable';
import AdminBadge from './AdminBadge';
import AuthRequired from './AuthRequired';

export default function AdminOnlyRoute({
  children,
  fallback,
  showComingSoon = true,
  featureName = 'This feature',
}: AdminOnlyRouteProps) {
  const { user, role, loading } = useRole();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <AuthRequired />;
  }

  // Check if user is admin
  if (role !== 'admin') {
    if (fallback) return <>{fallback}</>;

    return showComingSoon ? (
      <FeatureNotAvailable featureName={featureName} />
    ) : (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-neon mb-4">Access Denied</h1>
          <p className="text-stakeados-gray-300 mb-8">
            You need administrator privileges to access this feature.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-stakeados-primary hover:bg-stakeados-primary-dark text-white px-6 py-3 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render admin content with badge
  return (
    <div className="relative">
      <AdminBadge variant="development" />
      {children}
    </div>
  );
}
