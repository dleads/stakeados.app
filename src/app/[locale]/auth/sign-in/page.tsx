'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/es/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Sincroniza cookies SSR para que el layout admin detecte la sesión inmediatamente
      try {
        if (data.session) {
          await fetch('/api/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
          });
        }
      } catch {}
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-stakeados-gray-900/80 backdrop-blur-sm border border-stakeados-gray-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-stakeados-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-stakeados-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Iniciar sesión
            </h1>
            <p className="text-stakeados-gray-400">
              Accede a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stakeados-gray-800 border border-stakeados-gray-700 rounded-lg text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary focus:ring-1 focus:ring-stakeados-primary transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-stakeados-gray-800 border border-stakeados-gray-700 rounded-lg text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary focus:ring-1 focus:ring-stakeados-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stakeados-gray-400 hover:text-stakeados-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stakeados-primary hover:bg-stakeados-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="./forgot-password"
              className="text-stakeados-gray-400 hover:text-stakeados-primary transition-colors text-sm"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
