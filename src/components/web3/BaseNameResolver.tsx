'use client';

import React, { useState } from 'react';
import {
  useBaseNameResolution,
  useBaseNameAvailability,
} from '@/hooks/useBaseName';
import { isValidBaseName, formatBaseName } from '@/lib/web3/basenames';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';

interface BaseNameResolverProps {
  onResolve?: (address: string | null, name: string) => void;
  className?: string;
}

export default function BaseNameResolver({
  onResolve,
  className = '',
}: BaseNameResolverProps) {
  const [inputName, setInputName] = useState('');
  const [searchName, setSearchName] = useState('');

  const {
    resolvedAddress,
    isLoading: isResolving,
    error: resolveError,
  } = useBaseNameResolution(searchName);
  const { isAvailable, isLoading: isCheckingAvailability } =
    useBaseNameAvailability(searchName);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const formattedName = formatBaseName(inputName.trim().toLowerCase());
    setSearchName(formattedName);
    onResolve?.(resolvedAddress, formattedName);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputName(value);

    // Clear search when input is cleared
    if (!value.trim()) {
      setSearchName('');
    }
  };

  const isValidInput = inputName ? isValidBaseName(inputName) : true;
  const isLoading = isResolving || isCheckingAvailability;

  return (
    <div className={`card-gaming ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-stakeados-blue" />
          <h3 className="text-xl font-bold text-neon">Base Name Resolver</h3>
        </div>
        <p className="text-stakeados-gray-300">
          Search for Base names (.base.eth) and resolve them to addresses
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="form-gaming">
          <label htmlFor="basename">Base Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
            <input
              type="text"
              id="basename"
              value={inputName}
              onChange={handleInputChange}
              className={`pl-12 ${!isValidInput ? 'border-stakeados-red focus:border-stakeados-red' : ''}`}
              placeholder="vitalik or vitalik.base.eth"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-primary animate-spin" />
            )}
          </div>

          {!isValidInput && (
            <div className="text-sm text-stakeados-red mt-1 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Invalid Base name format (3-63 characters, lowercase letters,
              numbers, hyphens)
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputName.trim() || !isValidInput || isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Resolving...
            </div>
          ) : (
            'Resolve Base Name'
          )}
        </button>
      </form>

      {/* Results */}
      {searchName && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-stakeados-blue" />
              <span className="font-semibold text-white">Searching for:</span>
            </div>
            <div className="text-stakeados-blue font-mono">{searchName}</div>
          </div>

          {resolveError && (
            <div className="notification-error">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Error: {resolveError}</span>
              </div>
            </div>
          )}

          {!isLoading && !resolveError && (
            <>
              {resolvedAddress ? (
                <div className="notification-success">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Name Resolved!</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-mono text-stakeados-primary break-all">
                      {resolvedAddress}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="notification-warning">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {isAvailable === true
                        ? 'Name is available for registration'
                        : 'Name not found or not configured'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-xs text-stakeados-gray-400">
        <p className="mb-2">
          <strong>Base Names</strong> are human-readable names for Base
          addresses, similar to ENS.
        </p>
        <p>
          Examples:{' '}
          <code className="text-stakeados-primary">vitalik.base.eth</code>,{' '}
          <code className="text-stakeados-primary">alice.base.eth</code>
        </p>
      </div>
    </div>
  );
}
