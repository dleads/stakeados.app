'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, AlertTriangle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);

        // Verificar si el usuario es admin
        // Puedes ajustar esta lógica según tu estructura de base de datos
        const isUserAdmin =
          session.user.email === 'tu@email.com' ||
          session.user.user_metadata?.role === 'admin' ||
          session.user.app_metadata?.role === 'admin';

        setIsAdmin(isUserAdmin);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/es/admin`,
        },
      });

      if (error) {
        console.error('Error signing in:', error);
      }
    } catch (error) {
      console.error('Error in sign in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error in sign out:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full filter blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="relative z-10 text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
            <Lock className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-4">
              Acceso Requerido
            </h1>
            <p className="text-gray-300 mb-8">
              Necesitas iniciar sesión para acceder al panel de administración.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50"
            >
              Iniciar Sesión con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but not admin
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-red-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-red-400 rounded-full filter blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="relative z-10 text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-700 rounded-lg p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-400 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-300 mb-4">
              No tienes permisos de administrador para acceder a esta área.
            </p>
            <p className="text-sm text-gray-400 mb-8">Usuario: {user?.email}</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
              <a
                href="/es"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
              >
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and admin - render admin content
  return (
    <div>
      {/* Admin header with user info */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-green-400 font-bold text-lg">
              Panel de Administración
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">Admin: {user?.email}</div>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
