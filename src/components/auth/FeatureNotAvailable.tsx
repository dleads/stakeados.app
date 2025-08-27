'use client';

import React, { useState } from 'react';
import { Rocket, ArrowLeft } from 'lucide-react';
import { FeatureNotAvailableProps } from '@/types/roles';

export default function FeatureNotAvailable({
  featureName,
  description,
  showInterest = true,
}: FeatureNotAvailableProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement interest tracking API
      // await fetch('/api/feature-interest', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, feature: featureName })
      // });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting interest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <Rocket className="w-16 h-16 text-stakeados-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">
          {featureName} Próximamente
        </h1>
        <p className="text-stakeados-gray-300 mb-8">
          {description ||
            `Estamos trabajando arduamente para traerte ${featureName.toLowerCase()}. Esta función está actualmente en desarrollo y estará disponible pronto.`}
        </p>

        {showInterest && !submitted && (
          <div className="space-y-4">
            <form onSubmit={handleInterestSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-stakeados-gray-800 border border-stakeados-gray-700 rounded-lg text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary focus:ring-1 focus:ring-stakeados-primary transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-stakeados-primary hover:bg-stakeados-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {isSubmitting
                  ? 'Enviando...'
                  : 'Notificarme Cuando Esté Disponible'}
              </button>
            </form>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 text-stakeados-gray-300 hover:text-stakeados-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        )}

        {submitted && (
          <div className="space-y-4">
            <div className="bg-stakeados-primary/20 border border-stakeados-primary rounded-lg p-4">
              <p className="text-stakeados-primary font-medium">
                ¡Gracias! Te notificaremos cuando {featureName.toLowerCase()}{' '}
                esté disponible.
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 text-stakeados-gray-300 hover:text-stakeados-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
