'use client';

import { useState, useEffect, useRef } from 'react';
import {
  reverseResolveAddress,
  resolveBaseName,
  getBaseNameAvatar,
  getBaseNameTextRecord,
  isBaseNameAvailable,
} from '@/lib/web3/basenames';
import type { Address } from 'viem';

interface BaseNameData {
  name: string | null;
  avatar: string | null;
  description: string | null;
  twitter: string | null;
  github: string | null;
  website: string | null;
}

export function useBaseName(addressOverride?: Address) {
  // Always call useAccount, but handle the case where it might fail
  let account;

  // Dynamic import to avoid SSR issues
  const { useAccount } = require('wagmi');
  account = useAccount();
  const connectedAddress = account.address;

  const address = addressOverride || connectedAddress;

  const [baseNameData, setBaseNameData] = useState<BaseNameData>({
    name: null,
    avatar: null,
    description: null,
    twitter: null,
    github: null,
    website: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!address) {
      setBaseNameData({
        name: null,
        avatar: null,
        description: null,
        twitter: null,
        github: null,
        website: null,
      });
      return;
    }

    const fetchBaseNameData = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        // Reverse resolve address to get base name
        const name = await reverseResolveAddress(address);

        if (!name) {
          setBaseNameData({
            name: null,
            avatar: null,
            description: null,
            twitter: null,
            github: null,
            website: null,
          });
          return;
        }

        // Get additional base name data
        const [avatar, description, twitter, github, website] =
          await Promise.allSettled([
            getBaseNameAvatar(name),
            getBaseNameTextRecord(name, 'description'),
            getBaseNameTextRecord(name, 'com.twitter'),
            getBaseNameTextRecord(name, 'com.github'),
            getBaseNameTextRecord(name, 'url'),
          ]);

        setBaseNameData({
          name,
          avatar: avatar.status === 'fulfilled' ? avatar.value : null,
          description:
            description.status === 'fulfilled' ? description.value : null,
          twitter: twitter.status === 'fulfilled' ? twitter.value : null,
          github: github.status === 'fulfilled' ? github.value : null,
          website: website.status === 'fulfilled' ? website.value : null,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        console.error('Error fetching base name data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBaseNameData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [address]);

  return {
    ...baseNameData,
    loading,
    error,
    address,
    isConnected: account.isConnected,
  };
}

// Hook for resolving a specific Base name to address
export function useBaseNameResolution(name: string) {
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setResolvedAddress(null);
      return;
    }

    const resolveName = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const address = await resolveBaseName(name);
        setResolvedAddress(address);
      } catch (err) {
        console.error('Error resolving Base name:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to resolve Base name'
        );
      } finally {
        setIsLoading(false);
      }
    };

    resolveName();
  }, [name]);

  return {
    resolvedAddress,
    isLoading,
    error,
    isResolved: !!resolvedAddress,
  };
}

// Hook for checking Base name availability
export function useBaseNameAvailability(name: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setIsAvailable(null);
      return;
    }

    const checkAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const available = await isBaseNameAvailable(name);
        setIsAvailable(available);
      } catch (err) {
        console.error('Error checking Base name availability:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to check availability'
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [name]);

  return {
    isAvailable,
    isLoading,
    error,
  };
}
