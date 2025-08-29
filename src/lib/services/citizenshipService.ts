import { gamificationServiceServer } from './gamificationService.server';
import type { CitizenshipProgress } from '@/types/gamification';

export class CitizenshipService {
  /**
   * Check if user meets citizenship requirements
   */
  async checkCitizenshipEligibility(userId: string): Promise<boolean> {
    try {
      const progress = await gamificationServiceServer.getCitizenshipProgress(userId);
      return progress?.isEligible || false;
    } catch (error) {
      console.error('Error checking citizenship eligibility:', error);
      return false;
    }
  }

  /**
   * Automatically check and update citizenship status after content contribution
   */
  async checkAndUpdateCitizenshipStatus(userId: string): Promise<{
    wasEligible: boolean;
    isNowEligible: boolean;
    newlyEligible: boolean;
  }> {
    try {
      // For now, just check current eligibility since we don't have citizenship tracking columns
      const isNowEligible = await this.checkCitizenshipEligibility(userId);

      return {
        wasEligible: false, // We can't track this without the citizenship_eligible column
        isNowEligible,
        newlyEligible: isNowEligible, // Assume newly eligible if currently eligible
      };
    } catch (error) {
      console.error('Error checking citizenship status:', error);
      return {
        wasEligible: false,
        isNowEligible: false,
        newlyEligible: false,
      };
    }
  }

  /**
   * Get citizenship requirements configuration
   */
  getCitizenshipRequirements() {
    return {
      contentPoints: 100,
      articles: 5,
      qualityScore: 3.5,
      reviews: 3,
    };
  }

  /**
   * Calculate progress towards citizenship
   */
  async calculateCitizenshipProgress(
    userId: string
  ): Promise<CitizenshipProgress | null> {
    return gamificationServiceServer.getCitizenshipProgress(userId);
  }

  /**
   * Get users eligible for citizenship NFT
   */
  async getEligibleUsers(_limit = 50): Promise<
    Array<{
      userId: string;
      userName: string;
      eligibleAt: Date;
      claimed: boolean;
    }>
  > {
    try {
      // For now, return empty array since we don't have citizenship tracking columns
      // TODO: Implement when citizenship_eligible column is added to profiles table
      console.warn(
        'Citizenship tracking not implemented yet - missing database columns'
      );
      return [];
    } catch (error) {
      console.error('Error fetching eligible users:', error);
      return [];
    }
  }

  /**
   * Mark citizenship NFT as claimed
   */
  async markCitizenshipNFTClaimed(_userId: string): Promise<void> {
    try {
      // TODO: Implement when citizenship_nft_claimed column is added to profiles table
      console.warn(
        'Citizenship NFT claiming not implemented yet - missing database columns'
      );
    } catch (error) {
      console.error('Error marking citizenship NFT as claimed:', error);
      throw error;
    }
  }

  /**
   * Get citizenship NFT metadata
   */
  async getCitizenshipNFTMetadata(userId: string): Promise<{
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  } | null> {
    try {
      const isEligible = await this.checkCitizenshipEligibility(userId);
      if (!isEligible) {
        return null;
      }

      return {
        name: `Stakeados Citizen - User ${userId}`,
        description: 'Official citizenship NFT for the Stakeados community',
        image: 'https://stakeados.com/citizenship-nft.png', // Placeholder
        attributes: [
          { trait_type: 'Citizenship Status', value: 'Active' },
          {
            trait_type: 'Member Since',
            value: new Date().toISOString().split('T')[0],
          },
        ],
      };
    } catch (error) {
      console.error('Error generating citizenship NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get citizenship statistics
   */
  async getCitizenshipStats(): Promise<{
    totalEligible: number;
    totalClaimed: number;
    averagePoints: number;
  }> {
    try {
      // For now, return mock data since we don't have citizenship tracking columns
      return {
        totalEligible: 0,
        totalClaimed: 0,
        averagePoints: 0,
      };
    } catch (error) {
      console.error('Error fetching citizenship stats:', error);
      return {
        totalEligible: 0,
        totalClaimed: 0,
        averagePoints: 0,
      };
    }
  }
}

export const citizenshipService = new CitizenshipService();
export default citizenshipService;
