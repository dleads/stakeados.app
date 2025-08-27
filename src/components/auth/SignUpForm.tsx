'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from './AuthProvider';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface SignUpFormProps {
  onToggleMode?: () => void;
  onSuccess?: () => void;
}

export default function SignUpForm({
  onToggleMode,
  onSuccess,
}: SignUpFormProps) {
  const t = useTranslations('auth.signUp');
  const { signUp, loading, error } = useAuthContext();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.displayName || undefined
    );

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
        {/* Display Name Field */}
        <div className="form-gaming">
          <label htmlFor="displayName">{t('displayName')} (Optional)</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="pl-12"
              placeholder="Your display name"
            />
          </div>
        </div>

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

        {/* Confirm Password Field */}
        <div className="form-gaming">
          <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-12 pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
            >
              {showConfirmPassword ? (
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
              Creating account...
            </div>
          ) : (
            t('title')
          )}
        </button>

        {/* Toggle to Sign In */}
        {onToggleMode && (
          <div className="text-center pt-4 border-t border-stakeados-gray-700">
            <p className="text-stakeados-gray-300 mb-2">{t('hasAccount')}</p>
            <button
              type="button"
              onClick={onToggleMode}
              className="text-stakeados-primary hover:text-stakeados-primary-light transition-colors font-semibold"
            >
              {t('signIn')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
