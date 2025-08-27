'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserList } from '@/components/admin/users/UserList';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">
              Gestión de usuarios
            </h1>
            <UserList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
