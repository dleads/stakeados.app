'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageLayout from '@/components/layout/PageLayout';

const supabase = createClient();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(() => {
    if (typeof window === 'undefined') return 'es';
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    return seg || 'es';
  }, []);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/${locale}/auth/reset-password`;
  }, [locale]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
          throw new Error('Por favor, introduce un email válido');
        }

        const options: { redirectTo?: string } = {};
        if (redirectTo) options.redirectTo = redirectTo;

        const { error } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          options
        );
        if (error) throw error;
        setSent(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo enviar el email'
        );
      } finally {
        setLoading(false);
      }
    },
    [email, redirectTo]
  );

  return (
    <PageLayout showBreadcrumbs={false} className="bg-gradient-gaming">
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-6 shadow">
          <h1 className="text-2xl font-semibold mb-6">Recuperar contraseña</h1>
          {sent ? (
            <p className="text-sm text-green-400">
              Si el email existe, hemos enviado un enlace para restablecer tu
              contraseña.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}
          <div className="mt-4 text-sm">
            <Link
              href={`/${locale}/auth/sign-in`}
              className="text-blue-400 hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
