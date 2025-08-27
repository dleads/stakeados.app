'use client';

import React from 'react';
import { ArticleManagementDashboard } from '@/components/admin/articles/ArticleManagementDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/roles';

export default function AdminArticlesPage() {
  return (
    <ProtectedRoute requireAuth={true} requiredRole={UserRole.ADMIN}>
      <ArticleManagementDashboard />
    </ProtectedRoute>
  );
}
