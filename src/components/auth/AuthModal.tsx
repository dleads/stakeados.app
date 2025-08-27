'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 w-8 h-8 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-full flex items-center justify-center text-stakeados-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Form Content */}
        {mode === 'signin' ? (
          <SignInForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        ) : (
          <SignUpForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}
