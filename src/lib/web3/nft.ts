import { createPublicClient, http } from 'viem';
// import { base, baseSepolia } from 'viem/chains';
import { getCurrentChain, getContractAddress } from './config';
import { createClient } from '@/lib/supabase/client';
import { mintCertificateGasless, mintCitizenshipGasless } from './paymaster';
import type { Address } from 'viem';
import type { DatabaseExtended } from '@/types/database-extended';
import type { SupabaseClient } from '@supabase/supabase-js';

// NFT Certificate contract ABI
const CERTIFICATE_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'courseId', type: 'string' },
      { name: 'courseName', type: 'string' },
      { name: 'score', type: 'uint256' },
      { name: 'difficulty', type: 'string' },
      { name: 'tokenURI', type: 'string' },
    ],
    name: 'mintCertificate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getCertificate',
    outputs: [
      {
        components: [
          { name: 'courseId', type: 'string' },
          { name: 'courseName', type: 'string' },
          { name: 'completionDate', type: 'uint256' },
          { name: 'score', type: 'uint256' },
          { name: 'difficulty', type: 'string' },
          { name: 'isValid', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserCertificates',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCertificates',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Citizenship NFT contract ABI
const CITIZENSHIP_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'points', type: 'uint256' },
      { name: 'isGenesis', type: 'bool' },
      { name: 'ethBalance', type: 'uint256' },
      { name: 'transactionCount', type: 'uint256' },
      { name: 'tokenURI', type: 'string' },
    ],
    name: 'mintCitizenship',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getCitizenship',
    outputs: [
      {
        components: [
          { name: 'mintDate', type: 'uint256' },
          { name: 'pointsAtMint', type: 'uint256' },
          { name: 'isGenesis', type: 'bool' },
          { name: 'tier', type: 'string' },
          { name: 'isActive', type: 'bool' },
          { name: 'lastTierUpdate', type: 'uint256' },
          { name: 'web3Score', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'citizen', type: 'address' }],
    name: 'getCitizenshipToken',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Certificate data interfaces
export interface CertificateData {
  courseId: string;
  courseName: string;
  completionDate: Date;
  score: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isValid: boolean;
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export interface CitizenshipData {
  mintDate: Date;
  pointsAtMint: number;
  isGenesis: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'genesis';
  isActive: boolean;
  lastTierUpdate: Date;
  web3Score: number;
}

export interface NFTMintResult {
  success: boolean;
  tokenId?: number;
  txHash?: string;
  error?: string;
  wasGasless?: boolean;
}

// Create public client for reading contract data
function getPublicClient() {
  const chain = getCurrentChain();
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Generate certificate metadata for IPFS
 */
export function generateCertificateMetadata(
  courseId: string,
  courseName: string,
  score: number,
  difficulty: string,
  _recipientAddress: string,
  completionDate: Date
): CertificateMetadata {
  // const difficultyColors = {
  //   basic: '#00FF88',
  //   intermediate: '#00AAFF',
  //   advanced: '#AA00FF',
  // };

  return {
    name: `${courseName} Certificate`,
    description: `Certificate of completion for ${courseName} course on Stakeados platform. Achieved ${score}% score on ${difficulty} difficulty level.`,
    image: `https://api.stakeados.com/certificates/images/${courseId}/${difficulty}.png`,
    attributes: [
      {
        trait_type: 'Course',
        value: courseName,
      },
      {
        trait_type: 'Difficulty',
        value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      },
      {
        trait_type: 'Score',
        value: score,
      },
      {
        trait_type: 'Completion Date',
        value: completionDate.toISOString().split('T')[0],
      },
      {
        trait_type: 'Platform',
        value: 'Stakeados',
      },
    ],
    external_url: `https://stakeados.com/certificates/${courseId}`,
  };
}

/**
 * Generate citizenship metadata for IPFS
 */
export function generateCitizenshipMetadata(
  tier: string,
  points: number,
  isGenesis: boolean,
  web3Score: number,
  mintDate: Date
): CertificateMetadata {
  // const tierColors = {
  //   bronze: '#CD7F32',
  //   silver: '#C0C0C0',
  //   gold: '#FFD700',
  //   genesis: '#00FF88',
  // };

  return {
    name: `Stakeados ${tier.charAt(0).toUpperCase() + tier.slice(1)} Citizenship`,
    description: `${isGenesis ? 'Genesis ' : ''}Citizenship NFT for Stakeados platform. Tier: ${tier.toUpperCase()}. Earned with ${points} points and Web3 score of ${web3Score}.`,
    image: `https://api.stakeados.com/citizenship/images/${tier}.png`,
    attributes: [
      {
        trait_type: 'Tier',
        value: tier.charAt(0).toUpperCase() + tier.slice(1),
      },
      {
        trait_type: 'Points at Mint',
        value: points,
      },
      {
        trait_type: 'Web3 Score',
        value: web3Score,
      },
      {
        trait_type: 'Genesis',
        value: isGenesis ? 'Yes' : 'No',
      },
      {
        trait_type: 'Mint Date',
        value: mintDate.toISOString().split('T')[0],
      },
      {
        trait_type: 'Platform',
        value: 'Stakeados',
      },
    ],
    external_url: 'https://stakeados.com/citizenship',
  };
}

/**
 * Upload metadata to IPFS (placeholder - implement with actual IPFS service)
 */
export async function uploadMetadataToIPFS(
  metadata: CertificateMetadata
): Promise<string> {
  // In production, this would upload to IPFS via Pinata, Infura, or similar
  // For now, we'll use a placeholder URL structure
  const hash = btoa(JSON.stringify(metadata))
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 46);
  return `https://ipfs.stakeados.com/${hash}`;
}

/**
 * Mint certificate NFT with automatic metadata generation
 */
export async function mintCertificate(
  recipientAddress: Address,
  courseId: string,
  courseName: string,
  score: number,
  difficulty: 'basic' | 'intermediate' | 'advanced',
  useGasless: boolean = true
): Promise<NFTMintResult> {
  try {
    // Generate metadata
    const metadata = generateCertificateMetadata(
      courseId,
      courseName,
      score,
      difficulty,
      recipientAddress,
      new Date()
    );

    // Upload metadata to IPFS
    const tokenURI = await uploadMetadataToIPFS(metadata);

    // Try gasless minting first
    if (useGasless) {
      const gaslessResult = await mintCertificateGasless(
        recipientAddress,
        courseId,
        courseName,
        score,
        difficulty,
        tokenURI
      );

      if (gaslessResult.success) {
        // Store in Supabase
        await storeCertificateInDatabase(
          recipientAddress,
          courseId,
          gaslessResult.txHash || '',
          0 // tokenId will be updated when we can read from contract
        );

        return {
          success: true,
          txHash: gaslessResult.txHash,
          wasGasless: true,
        };
      }
    }

    // Fallback to regular transaction (would need wallet client)
    throw new Error('Gasless minting failed and no wallet client available');
  } catch (error) {
    console.error('Error minting certificate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mint citizenship NFT
 */
export async function mintCitizenship(
  recipientAddress: Address,
  points: number,
  isGenesis: boolean,
  ethBalance: bigint,
  transactionCount: number,
  tier: 'bronze' | 'silver' | 'gold' | 'genesis',
  useGasless: boolean = true
): Promise<NFTMintResult> {
  try {
    // Generate metadata
    const metadata = generateCitizenshipMetadata(
      tier,
      points,
      isGenesis,
      Number(ethBalance),
      new Date()
    );

    // Upload metadata to IPFS
    const tokenURI = await uploadMetadataToIPFS(metadata);

    // Try gasless minting first
    if (useGasless) {
      const gaslessResult = await mintCitizenshipGasless(
        recipientAddress,
        points,
        isGenesis,
        ethBalance,
        transactionCount,
        tokenURI
      );

      if (gaslessResult.success) {
        return {
          success: true,
          txHash: gaslessResult.txHash,
          wasGasless: true,
        };
      }
    }

    // Fallback to regular transaction
    throw new Error('Gasless minting failed and no wallet client available');
  } catch (error) {
    console.error('Error minting citizenship:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's certificate NFTs
 */
export async function getUserCertificates(userAddress: Address): Promise<{
  certificates: Array<{ tokenId: number; data: CertificateData }>;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = getContractAddress('nftCertificate');

    // Get user's certificate token IDs
    const tokenIds = await publicClient.readContract({
      address: contractAddress as Address,
      abi: CERTIFICATE_ABI,
      functionName: 'getUserCertificates',
      args: [userAddress],
    });

    // Get certificate data for each token
    const certificates = await Promise.all(
      tokenIds.map(async tokenId => {
        const data = await publicClient.readContract({
          address: contractAddress as Address,
          abi: CERTIFICATE_ABI,
          functionName: 'getCertificate',
          args: [tokenId],
        });

        return {
          tokenId: Number(tokenId),
          data: {
            courseId: data.courseId,
            courseName: data.courseName,
            completionDate: new Date(Number(data.completionDate) * 1000),
            score: Number(data.score),
            difficulty: data.difficulty as
              | 'basic'
              | 'intermediate'
              | 'advanced',
            isValid: data.isValid,
          },
        };
      })
    );

    return { certificates };
  } catch (error) {
    console.error('Error getting user certificates:', error);
    return {
      certificates: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's citizenship NFT
 */
export async function getUserCitizenship(userAddress: Address): Promise<{
  citizenship: { tokenId: number; data: CitizenshipData } | null;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = getContractAddress('citizenshipNft');

    // Check if user has citizenship
    const tokenId = await publicClient.readContract({
      address: contractAddress as Address,
      abi: CITIZENSHIP_ABI,
      functionName: 'getCitizenshipToken',
      args: [userAddress],
    });

    if (!tokenId) {
      return { citizenship: null };
    }

    // Get citizenship data
    const data = await publicClient.readContract({
      address: contractAddress as Address,
      abi: CITIZENSHIP_ABI,
      functionName: 'getCitizenship',
      args: [tokenId],
    });

    return {
      citizenship: {
        tokenId: Number(tokenId),
        data: {
          mintDate: new Date(Number(data.mintDate) * 1000),
          pointsAtMint: Number(data.pointsAtMint),
          isGenesis: data.isGenesis,
          tier: data.tier as 'bronze' | 'silver' | 'gold' | 'genesis',
          isActive: data.isActive,
          lastTierUpdate: new Date(Number(data.lastTierUpdate) * 1000),
          web3Score: Number(data.web3Score),
        },
      },
    };
  } catch (error) {
    console.error('Error getting user citizenship:', error);
    return {
      citizenship: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get total certificates minted
 */
export async function getTotalCertificates(): Promise<number> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = getContractAddress('nftCertificate');

    const total = await publicClient.readContract({
      address: contractAddress as Address,
      abi: CERTIFICATE_ABI,
      functionName: 'totalCertificates',
      args: [],
    });

    return Number(total);
  } catch (error) {
    console.error('Error getting total certificates:', error);
    return 0;
  }
}

/**
 * Store certificate in Supabase database
 */
async function storeCertificateInDatabase(
  userAddress: Address,
  courseId: string,
  transactionHash: string,
  tokenId: number
): Promise<void> {
  try {
    // Get user profile
    // Tipar explícitamente la fila de perfiles para evitar never
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', userAddress.toLowerCase())
      .single<{ id: string }>();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Store certificate with tipado fuerte
    const insertPayload: DatabaseExtended['public']['Tables']['nft_certificates']['Insert'] = {
      user_id: profile.id,
      course_id: courseId,
      token_id: tokenId,
      contract_address: getContractAddress('nftCertificate'),
      transaction_hash: transactionHash,
    };

    // Insert certificate record
    const { error } = await supabase
      .from('nft_certificates')
      .insert(insertPayload);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing certificate in database:', error);
    // Don't throw - NFT minting succeeded even if DB storage failed
  }
}

/**
 * Batch mint certificates for multiple users
 */
export async function batchMintCertificates(
  recipients: Address[],
  courseId: string,
  courseName: string,
  scores: number[],
  difficulty: 'basic' | 'intermediate' | 'advanced'
): Promise<NFTMintResult> {
  try {
    if (recipients.length !== scores.length) {
      throw new Error('Recipients and scores arrays must have the same length');
    }

    // Generate metadata for each certificate
    const tokenURIs = await Promise.all(
      recipients.map(async (recipient, index) => {
        const metadata = generateCertificateMetadata(
          courseId,
          courseName,
          scores[index],
          difficulty,
          recipient,
          new Date()
        );
        return await uploadMetadataToIPFS(metadata);
      })
    );

    // Use gasless batch minting
    const result = await mintCertificateGasless(
      recipients[0], // executor address
      courseId,
      courseName,
      scores[0],
      difficulty,
      tokenURIs[0]
    );

    return {
      success: result.success,
      txHash: result.txHash,
      wasGasless: true,
      error: result.error,
    };
  } catch (error) {
    console.error('Error batch minting certificates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
