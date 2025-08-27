import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useProgressTracking } from './useProgressTracking';
import { getUserCitizenship, mintCitizenship } from '@/lib/web3/nft';
import { CITIZENSHIP_REQUIREMENTS } from '@/lib/web3/config';
import { createPublicClient, http } from 'viem';
import { getCurrentChain } from '@/lib/web3/config';

interface CitizenshipRequirement {
  id: string;
  name: string;
  description: string;
  required: number | string;
  current: number | string;
  met: boolean;
  progress: number; // 0-100
  icon: string;
}

interface CitizenshipEligibilityState {
  isEligible: boolean;
  requirements: CitizenshipRequirement[];
  citizenship: any | null;
  hasCitizenship: boolean;
  isLoading: boolean;
  isMinting: boolean;
  error: string | null;
  success: string | null;
  overallProgress: number;
}

export function useCitizenshipEligibility() {
  const { address } = useAccount();
  const { user, profile } = useAuthContext();
  const { analytics } = useProgressTracking();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  const [state, setState] = useState<CitizenshipEligibilityState>({
    isEligible: false,
    requirements: [],
    citizenship: null,
    hasCitizenship: false,
    isLoading: false,
    isMinting: false,
    error: null,
    success: null,
    overallProgress: 0,
  });

  const [transactionCount, setTransactionCount] = useState(0);

  // Fetch transaction count
  const fetchTransactionCount = useCallback(async () => {
    if (!address) return 0;

    try {
      const publicClient = createPublicClient({
        chain: getCurrentChain(),
        transport: http(),
      });

      const count = await publicClient.getTransactionCount({
        address,
      });

      return Number(count);
    } catch (error) {
      console.error('Error fetching transaction count:', error);
      return 0;
    }
  }, [address]);

  // Check citizenship status
  const checkCitizenshipStatus = useCallback(async () => {
    if (!address) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { citizenship } = await getUserCitizenship(address);
      setState(prev => ({
        ...prev,
        citizenship,
        hasCitizenship: !!citizenship,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error checking citizenship status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check citizenship status',
      }));
    }
  }, [address]);

  // Calculate requirements
  const calculateRequirements = useCallback(async () => {
    if (!user || !profile) return;

    const txCount = await fetchTransactionCount();
    setTransactionCount(txCount);

    const currentPoints = profile.total_points || 0;
    const currentBalance = balance ? parseFloat(balance.formatted) : 0;
    const requiredBalance = 0.001; // ETH
    const completedCourses = analytics?.coursesCompleted || 0;

    const requirements: CitizenshipRequirement[] = [
      {
        id: 'points',
        name: 'Community Points',
        description: 'Earn points through learning and participation',
        required: CITIZENSHIP_REQUIREMENTS.minPoints,
        current: currentPoints,
        met: currentPoints >= CITIZENSHIP_REQUIREMENTS.minPoints,
        progress: Math.min(
          100,
          (currentPoints / CITIZENSHIP_REQUIREMENTS.minPoints) * 100
        ),
        icon: '⭐',
      },
      {
        id: 'eth_balance',
        name: 'ETH Balance',
        description: 'Minimum ETH balance to demonstrate Web3 engagement',
        required: `${requiredBalance} ETH`,
        current: `${currentBalance.toFixed(4)} ETH`,
        met: currentBalance >= requiredBalance,
        progress: Math.min(100, (currentBalance / requiredBalance) * 100),
        icon: '💎',
      },
      {
        id: 'transactions',
        name: 'On-chain Activity',
        description: 'Minimum transaction count to show blockchain experience',
        required: CITIZENSHIP_REQUIREMENTS.minTransactions,
        current: txCount,
        met: txCount >= CITIZENSHIP_REQUIREMENTS.minTransactions,
        progress: Math.min(
          100,
          (txCount / CITIZENSHIP_REQUIREMENTS.minTransactions) * 100
        ),
        icon: '🔗',
      },
      {
        id: 'courses',
        name: 'Course Completion',
        description: 'Complete at least one course to demonstrate learning',
        required: CITIZENSHIP_REQUIREMENTS.requiredCourses,
        current: completedCourses,
        met: completedCourses >= CITIZENSHIP_REQUIREMENTS.requiredCourses,
        progress: Math.min(
          100,
          (completedCourses / CITIZENSHIP_REQUIREMENTS.requiredCourses) * 100
        ),
        icon: '📚',
      },
    ];

    const allMet = requirements.every(req => req.met);
    const overallProgress =
      requirements.reduce((sum, req) => sum + req.progress, 0) /
      requirements.length;

    setState(prev => ({
      ...prev,
      requirements,
      isEligible: allMet && !prev.hasCitizenship,
      overallProgress,
    }));
  }, [user, profile, balance, analytics, fetchTransactionCount]);

  // Mint citizenship NFT
  const mintCitizenshipNFT = useCallback(async () => {
    if (!address || !user || !state.isEligible) return;

    setState(prev => ({
      ...prev,
      isMinting: true,
      error: null,
      success: null,
    }));

    try {
      const currentPoints = profile?.total_points || 0;
      const currentBalance = balance
        ? BigInt(Math.floor(parseFloat(balance.formatted) * 1e18))
        : 0n;
      const isGenesis = profile?.is_genesis || false;

      // Determine tier based on points and activity
      let tier: 'bronze' | 'silver' | 'gold' | 'genesis' = 'bronze';
      if (isGenesis) {
        tier = 'genesis';
      } else if (currentPoints >= 500 && transactionCount >= 10) {
        tier = 'gold';
      } else if (currentPoints >= 250 && transactionCount >= 5) {
        tier = 'silver';
      }

      const result = await mintCitizenship(
        address,
        currentPoints,
        isGenesis,
        currentBalance,
        transactionCount,
        tier
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isMinting: false,
          success: `Citizenship NFT minted successfully! Tier: ${tier.toUpperCase()}`,
          hasCitizenship: true,
        }));

        // Refresh citizenship status
        setTimeout(checkCitizenshipStatus, 2000);
      } else {
        setState(prev => ({
          ...prev,
          isMinting: false,
          error: result.error || 'Failed to mint citizenship NFT',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMinting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mint citizenship NFT',
      }));
    }
  }, [
    address,
    user,
    state.isEligible,
    profile,
    balance,
    transactionCount,
    checkCitizenshipStatus,
  ]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (address) {
      checkCitizenshipStatus();
    }
  }, [address, checkCitizenshipStatus]);

  useEffect(() => {
    if (user && profile && !isBalanceLoading) {
      calculateRequirements();
    }
  }, [
    user,
    profile,
    balance,
    analytics,
    isBalanceLoading,
    calculateRequirements,
  ]);

  // Get requirement by ID
  const getRequirement = useCallback(
    (id: string) => {
      return state.requirements.find(req => req.id === id);
    },
    [state.requirements]
  );

  // Get unmet requirements
  const getUnmetRequirements = useCallback(() => {
    return state.requirements.filter(req => !req.met);
  }, [state.requirements]);

  // Get next milestone
  const getNextMilestone = useCallback(() => {
    const unmet = getUnmetRequirements();
    if (unmet.length === 0) return null;

    // Return the requirement with highest progress
    return unmet.reduce((highest, current) =>
      current.progress > highest.progress ? current : highest
    );
  }, [getUnmetRequirements]);

  return {
    // State
    ...state,
    transactionCount,

    // Actions
    mintCitizenshipNFT,
    checkCitizenshipStatus,
    calculateRequirements,
    clearMessages,

    // Utilities
    getRequirement,
    getUnmetRequirements,
    getNextMilestone,

    // Status
    isConnected: !!address,
    isAuthenticated: !!user,
    canMint: state.isEligible && !state.hasCitizenship && !state.isMinting,
  };
}
