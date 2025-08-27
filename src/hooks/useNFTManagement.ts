'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
// import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  mintCertificate,
  mintCitizenship,
  getUserCertificates,
  getUserCitizenship,
  getTotalCertificates,
  batchMintCertificates,
  type CertificateData,
  type CitizenshipData,
  type NFTMintResult,
} from '@/lib/web3/nft';
import type { Address } from 'viem';

interface NFTManagementState {
  certificates: Array<{ tokenId: number; data: CertificateData }>;
  citizenship: { tokenId: number; data: CitizenshipData } | null;
  totalCertificates: number;
  isLoading: boolean;
  isMinting: boolean;
  error: string | null;
  success: string | null;
}

export function useNFTManagement() {
  const { address } = useAccount();
  // const { user } = useAuthContext();

  const [state, setState] = useState<NFTManagementState>({
    certificates: [],
    citizenship: null,
    totalCertificates: 0,
    isLoading: false,
    isMinting: false,
    error: null,
    success: null,
  });

  // Load user's NFTs
  const loadUserNFTs = useCallback(async () => {
    if (!address) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [certificatesResult, citizenshipResult, totalCerts] =
        await Promise.all([
          getUserCertificates(address),
          getUserCitizenship(address),
          getTotalCertificates(),
        ]);

      setState(prev => ({
        ...prev,
        certificates: certificatesResult.certificates,
        citizenship: citizenshipResult.citizenship,
        totalCertificates: totalCerts,
        isLoading: false,
        error: certificatesResult.error || citizenshipResult.error || null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load NFTs',
      }));
    }
  }, [address]);

  // Load NFTs when address changes
  useEffect(() => {
    loadUserNFTs();
  }, [loadUserNFTs]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Mint certificate
  const mintCertificateNFT = useCallback(
    async (
      courseId: string,
      courseName: string,
      score: number,
      difficulty: 'basic' | 'intermediate' | 'advanced',
      recipientAddress?: Address
    ): Promise<NFTMintResult> => {
      const targetAddress = recipientAddress || address;

      if (!targetAddress) {
        const error = 'No wallet address available';
        setState(prev => ({ ...prev, error }));
        return { success: false, error };
      }

      setState(prev => ({
        ...prev,
        isMinting: true,
        error: null,
        success: null,
      }));

      try {
        const result = await mintCertificate(
          targetAddress,
          courseId,
          courseName,
          score,
          difficulty
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isMinting: false,
            success: `Certificate minted successfully! ${result.wasGasless ? '(Gasless)' : ''}`,
          }));

          // Reload user NFTs
          setTimeout(loadUserNFTs, 2000);
        } else {
          setState(prev => ({
            ...prev,
            isMinting: false,
            error: result.error || 'Failed to mint certificate',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isMinting: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address, loadUserNFTs]
  );

  // Mint citizenship
  const mintCitizenshipNFT = useCallback(
    async (
      points: number,
      isGenesis: boolean,
      ethBalance: bigint,
      transactionCount: number,
      tier: 'bronze' | 'silver' | 'gold' | 'genesis',
      recipientAddress?: Address
    ): Promise<NFTMintResult> => {
      const targetAddress = recipientAddress || address;

      if (!targetAddress) {
        const error = 'No wallet address available';
        setState(prev => ({ ...prev, error }));
        return { success: false, error };
      }

      setState(prev => ({
        ...prev,
        isMinting: true,
        error: null,
        success: null,
      }));

      try {
        const result = await mintCitizenship(
          targetAddress,
          points,
          isGenesis,
          ethBalance,
          transactionCount,
          tier
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isMinting: false,
            success: `Citizenship NFT minted successfully! ${result.wasGasless ? '(Gasless)' : ''}`,
          }));

          // Reload user NFTs
          setTimeout(loadUserNFTs, 2000);
        } else {
          setState(prev => ({
            ...prev,
            isMinting: false,
            error: result.error || 'Failed to mint citizenship',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isMinting: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address, loadUserNFTs]
  );

  // Batch mint certificates
  const batchMintCertificateNFTs = useCallback(
    async (
      recipients: Address[],
      courseId: string,
      courseName: string,
      scores: number[],
      difficulty: 'basic' | 'intermediate' | 'advanced'
    ): Promise<NFTMintResult> => {
      setState(prev => ({
        ...prev,
        isMinting: true,
        error: null,
        success: null,
      }));

      try {
        const result = await batchMintCertificates(
          recipients,
          courseId,
          courseName,
          scores,
          difficulty
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isMinting: false,
            success: `${recipients.length} certificates minted successfully! ${result.wasGasless ? '(Gasless)' : ''}`,
          }));

          // Reload user NFTs
          setTimeout(loadUserNFTs, 2000);
        } else {
          setState(prev => ({
            ...prev,
            isMinting: false,
            error: result.error || 'Failed to batch mint certificates',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isMinting: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [loadUserNFTs]
  );

  // Get certificate by course ID
  const getCertificateByCourse = useCallback(
    (courseId: string) => {
      return state.certificates.find(cert => cert.data.courseId === courseId);
    },
    [state.certificates]
  );

  // Check if user has certificate for course
  const hasCertificateForCourse = useCallback(
    (courseId: string) => {
      return state.certificates.some(
        cert => cert.data.courseId === courseId && cert.data.isValid
      );
    },
    [state.certificates]
  );

  // Get certificates by difficulty
  const getCertificatesByDifficulty = useCallback(
    (difficulty: 'basic' | 'intermediate' | 'advanced') => {
      return state.certificates.filter(
        cert => cert.data.difficulty === difficulty
      );
    },
    [state.certificates]
  );

  // Get certificate statistics
  const getCertificateStats = useCallback(() => {
    const stats = {
      total: state.certificates.length,
      basic: 0,
      intermediate: 0,
      advanced: 0,
      averageScore: 0,
      validCertificates: 0,
    };

    let totalScore = 0;

    state.certificates.forEach(cert => {
      if (cert.data.isValid) {
        stats.validCertificates++;
        totalScore += cert.data.score;

        switch (cert.data.difficulty) {
          case 'basic':
            stats.basic++;
            break;
          case 'intermediate':
            stats.intermediate++;
            break;
          case 'advanced':
            stats.advanced++;
            break;
        }
      }
    });

    stats.averageScore =
      stats.validCertificates > 0
        ? Math.round(totalScore / stats.validCertificates)
        : 0;

    return stats;
  }, [state.certificates]);

  return {
    // State
    ...state,

    // Actions
    mintCertificateNFT,
    mintCitizenshipNFT,
    batchMintCertificateNFTs,
    loadUserNFTs,
    clearMessages,

    // Utilities
    getCertificateByCourse,
    hasCertificateForCourse,
    getCertificatesByDifficulty,
    getCertificateStats,

    // Status
    isConnected: !!address,
    hasNFTs: state.certificates.length > 0 || !!state.citizenship,
    currentAddress: address,
  };
}
