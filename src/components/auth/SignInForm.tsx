'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from './AuthProvider';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface SignInFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

export default function SignInForm({
  onToggleMode,
  onSuccess,
}: SignInFormProps) {
  const t = useTranslations('auth.signIn');
  const { signIn, loading, error } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setFormError(error.message);
    } else {
      onSuccess?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="card-gaming max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neon mb-2">{t('title')}</h1>
        <p className="text-stakeados-gray-300">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="form-gaming">
          <label htmlFor="email">{t('email')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-12"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-gaming">
          <label htmlFor="password">{t('password')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="pl-12 pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(formError || error) && (
          <div className="notification-error">{formError || error}</div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            t('title')
          )}
        </button>

        {/* Forgot Password */}
        <div className="text-center">
          <button
            type="button"
            className="text-stakeados-primary hover:text-stakeados-primary-light transition-colors text-sm"
          >
            {t('forgotPassword')}
          </button>
        </div>

        {/* Toggle to Sign Up */}
        {onToggleMode && (
          <div className="text-center pt-4 border-t border-stakeados-gray-700">
            <p className="text-stakeados-gray-300 mb-2">{t('noAccount')}</p>
            <button
              type="button"
              onClick={onToggleMode}
              className="text-stakeados-primary hover:text-stakeados-primary-light transition-colors font-semibold"
            >
              {t('signUp')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
