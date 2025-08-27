import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { env } from '@/lib/env';

// Web3 configuration constants
export const WEB3_CONFIG = {
  baseChainId: 8453, // Base Mainnet
  baseSepoliaChainId: 84532, // Base Sepolia Testnet
  requiredEthBalance: '0.001', // ETH required for citizenship
  minContractInteractions: 2,
} as const;

export const CITIZENSHIP_REQUIREMENTS = {
  minPoints: 100,
  minEthBalance: 0.001, // ETH
  minTransactions: 2,
  requiredCourses: 1,
} as const;

// Supported chains
export const chains = [base, baseSepolia] as const;

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Smart Wallet as primary option
    coinbaseWallet({
      appName: env.NEXT_PUBLIC_APP_URL || 'Stakeados',
      appLogoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
      preference: 'smartWalletOnly', // Use Smart Wallet by default
    }),

    // WalletConnect for other wallets
    // ...(env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? [
    //   walletConnect({
    //     projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    //     metadata: {
    //       name: env.NEXT_PUBLIC_APP_URL || 'Stakeados',
    //       description: 'Web3 Educational Platform with NFT Certifications',
    //       url: env.NEXT_PUBLIC_APP_URL,
    //       icons: [`${env.NEXT_PUBLIC_APP_URL}/logo.png`],
    //     },
    //   })
    // ] : []),

    // Injected wallet (MetaMask, etc.)
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

// Helper function to get current chain
export function getCurrentChain() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? baseSepolia : base;
}

// Helper function to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return chains.some(chain => chain.id === chainId);
}

// Contract addresses (will be updated when contracts are deployed)
export const CONTRACT_ADDRESSES = {
  // NFT Certificate Contract
  nftCertificate: {
    [base.id]: '0x0000000000000000000000000000000000000000', // To be deployed
    [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // To be deployed
  },

  // Citizenship NFT Contract
  citizenshipNft: {
    [base.id]: '0x0000000000000000000000000000000000000000', // To be deployed
    [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // To be deployed
  },

  // Base Paymaster Contract
  paymaster: {
    [base.id]: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6
    [baseSepolia.id]: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6
  },
} as const;

// Helper function to get contract address
export function getContractAddress(
  contract: keyof typeof CONTRACT_ADDRESSES,
  chainId?: number
): string {
  const currentChainId = chainId || getCurrentChain().id;
  return CONTRACT_ADDRESSES[contract][
    currentChainId as keyof (typeof CONTRACT_ADDRESSES)[typeof contract]
  ];
}
