// Application constants for Stakeados Platform

export const APP_CONFIG = {
  name: 'Stakeados',
  description: 'Web3 Educational Platform with NFT Certifications',
  version: '0.1.0',
  author: 'Stakeados Team',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Stakeados Brand Colors (matching design requirements)
export const COLORS = {
  primary: '#00FF88', // Neon Green
  primaryDark: '#00CC6A',
  primaryLight: '#33FF99',

  // Gaming/Futuristic Palette
  dark: '#0A0A0A',
  gray: {
    900: '#111111',
    800: '#1A1A1A',
    700: '#2A2A2A',
    600: '#3A3A3A',
    500: '#5A5A5A',
    400: '#7A7A7A',
    300: '#9A9A9A',
    200: '#BABABA',
    100: '#DADADA',
  },

  // Accent Colors
  blue: '#00AAFF',
  purple: '#AA00FF',
  orange: '#FF6600',
  red: '#FF3366',
  yellow: '#FFCC00',
} as const;

// Supported locales
export const LOCALES = ['en', 'es'] as const;
export const DEFAULT_LOCALE = 'es' as const;

// Route paths for internationalization
export const ROUTES = {
  home: '/',
  courses: {
    en: '/courses',
    es: '/cursos',
  },
  community: {
    en: '/community',
    es: '/comunidad',
  },
  news: {
    en: '/news',
    es: '/noticias',
  },
  profile: {
    en: '/profile',
    es: '/perfil',
  },
  genesis: {
    en: '/genesis',
    es: '/genesis',
  },
} as const;

// Points system configuration
export const POINTS_SYSTEM = {
  COMPLETE_PROFILE: 5,
  COMPLETE_BASIC_COURSE: 5,
  COMPLETE_INTERMEDIATE_COURSE: 10,
  COMPLETE_ADVANCED_COURSE: 15,
  PARTICIPATE_DISCUSSION: 2, // per discussion, max 10 points
  WRITE_APPROVED_ARTICLE: 5,
  DAILY_LOGIN: 1, // max 20 points per month
  GENESIS_CLAIM: 30,
  CITIZENSHIP_REQUIREMENT: 100, // points needed for citizenship NFT
} as const;

// Web3 Configuration
export const WEB3_CONFIG = {
  baseChainId: 8453, // Base Mainnet
  baseSepoliaChainId: 84532, // Base Sepolia Testnet
  requiredEthBalance: '0.001', // ETH required for citizenship
  minContractInteractions: 2,
} as const;

// Course difficulty levels
export const COURSE_DIFFICULTY = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// Article statuses
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
} as const;

// Proposal statuses
export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: '/api/auth',
  courses: '/api/courses',
  articles: '/api/articles',
  users: '/api/users',
  web3: '/api/web3',
  news: '/api/news',
  analytics: '/api/analytics',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred',
  NETWORK: 'Network error, please try again',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION: 'Please check your input and try again',
  WEB3_CONNECTION: 'Failed to connect to wallet',
  TRANSACTION_FAILED: 'Transaction failed',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  COURSE_COMPLETED: 'Course completed successfully',
  ARTICLE_PUBLISHED: 'Article published successfully',
  NFT_MINTED: 'NFT certificate minted successfully',
  WALLET_CONNECTED: 'Wallet connected successfully',
} as const;
