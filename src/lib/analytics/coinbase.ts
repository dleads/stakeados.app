// Coinbase Developer Platform Analytics
export const COINBASE_CONFIG = {
  apiKey: '',
  enabled: false,
  baseUrl: 'https://api.developer.coinbase.com/platform/v1',
} as const;

// Web3 analytics interfaces
export interface Web3Transaction {
  hash: string;
  type: 'nft_mint' | 'token_transfer' | 'contract_interaction';
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  success: boolean;
  timestamp: Date;
  userAddress: string;
  contractAddress?: string;
}

export interface Web3Analytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasUsed: string;
  averageGasPrice: string;
  uniqueUsers: number;
  nftsMinted: number;
  gaslessTransactions: number;
}

// Track Web3 transactions
export async function trackWeb3Transaction(
  transaction: Web3Transaction
): Promise<void> {
  if (!COINBASE_CONFIG.enabled) {
    console.log(
      'Coinbase analytics not configured, logging transaction locally:',
      transaction
    );
    return;
  }

  try {
    const response = await fetch(
      `${COINBASE_CONFIG.baseUrl}/analytics/transactions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${COINBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_hash: transaction.hash,
          transaction_type: transaction.type,
          value: transaction.value,
          gas_used: transaction.gasUsed,
          gas_price: transaction.gasPrice,
          success: transaction.success,
          timestamp: transaction.timestamp.toISOString(),
          user_address: transaction.userAddress,
          contract_address: transaction.contractAddress,
          platform: 'stakeados',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error tracking Web3 transaction:', error);
  }
}

// Track wallet connections
export async function trackWalletConnection(
  walletType: string,
  userAddress: string,
  chainId: number
): Promise<void> {
  if (!COINBASE_CONFIG.enabled) {
    console.log(
      'Coinbase analytics not configured, logging wallet connection locally:',
      {
        walletType,
        userAddress,
        chainId,
      }
    );
    return;
  }

  try {
    const response = await fetch(
      `${COINBASE_CONFIG.baseUrl}/analytics/wallet-connections`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${COINBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_type: walletType,
          user_address: userAddress,
          chain_id: chainId,
          timestamp: new Date().toISOString(),
          platform: 'stakeados',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error tracking wallet connection:', error);
  }
}

// Track NFT minting
export async function trackNFTMint(
  contractAddress: string,
  tokenId: string,
  userAddress: string,
  mintType: 'certificate' | 'citizenship',
  gasless: boolean
): Promise<void> {
  if (!COINBASE_CONFIG.enabled) {
    console.log(
      'Coinbase analytics not configured, logging NFT mint locally:',
      {
        contractAddress,
        tokenId,
        userAddress,
        mintType,
        gasless,
      }
    );
    return;
  }

  try {
    const response = await fetch(
      `${COINBASE_CONFIG.baseUrl}/analytics/nft-mints`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${COINBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_address: contractAddress,
          token_id: tokenId,
          user_address: userAddress,
          mint_type: mintType,
          gasless,
          timestamp: new Date().toISOString(),
          platform: 'stakeados',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error tracking NFT mint:', error);
  }
}

// Get Web3 analytics
export async function getWeb3Analytics(
  timeframe: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<Web3Analytics | null> {
  if (!COINBASE_CONFIG.enabled) {
    // Return mock data for development
    return {
      totalTransactions: 156,
      successfulTransactions: 148,
      failedTransactions: 8,
      totalGasUsed: '0.0234',
      averageGasPrice: '0.000000015',
      uniqueUsers: 89,
      nftsMinted: 67,
      gaslessTransactions: 45,
    };
  }

  try {
    const response = await fetch(
      `${COINBASE_CONFIG.baseUrl}/analytics/summary?timeframe=${timeframe}&platform=stakeados`,
      {
        headers: {
          Authorization: `Bearer ${COINBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Web3 analytics:', error);
    return null;
  }
}

// Track Base network specific metrics
export async function trackBaseNetworkUsage(
  action: 'transaction' | 'contract_deploy' | 'nft_mint',
  details: Record<string, any>
): Promise<void> {
  if (!COINBASE_CONFIG.enabled) {
    console.log(
      'Coinbase analytics not configured, logging Base usage locally:',
      {
        action,
        details,
      }
    );
    return;
  }

  try {
    const response = await fetch(
      `${COINBASE_CONFIG.baseUrl}/analytics/base-usage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${COINBASE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          details,
          timestamp: new Date().toISOString(),
          platform: 'stakeados',
          network: 'base',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error tracking Base network usage:', error);
  }
}

// Stakeados-specific Web3 analytics
export const StakeadosWeb3Analytics = {
  // Certificate minting
  certificateMinted: (
    contractAddress: string,
    tokenId: string,
    userAddress: string,
    courseId: string,
    gasless: boolean
  ) => {
    trackNFTMint(contractAddress, tokenId, userAddress, 'certificate', gasless);
    trackBaseNetworkUsage('nft_mint', {
      type: 'certificate',
      course_id: courseId,
      gasless,
    });
  },

  // Citizenship minting
  citizenshipMinted: (
    contractAddress: string,
    tokenId: string,
    userAddress: string,
    tier: string,
    gasless: boolean
  ) => {
    trackNFTMint(contractAddress, tokenId, userAddress, 'citizenship', gasless);
    trackBaseNetworkUsage('nft_mint', {
      type: 'citizenship',
      tier,
      gasless,
    });
  },

  // Wallet connections
  walletConnected: (
    walletType: string,
    userAddress: string,
    chainId: number
  ) => {
    trackWalletConnection(walletType, userAddress, chainId);
  },

  // Transaction tracking
  transactionCompleted: (transaction: Web3Transaction) => {
    trackWeb3Transaction(transaction);
    trackBaseNetworkUsage('transaction', {
      type: transaction.type,
      success: transaction.success,
      gas_used: transaction.gasUsed,
    });
  },
};
