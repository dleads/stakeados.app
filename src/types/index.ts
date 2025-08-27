// Global type definitions for Stakeados Platform

export type Locale = 'en' | 'es';

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  walletAddress?: string;
  isGenesis: boolean;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  nftContractAddress?: string;
  estimatedTime: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  title: Record<Locale, string>;
  content: Record<Locale, string>;
  authorId: string;
  status: 'draft' | 'review' | 'published';
  category: string;
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTCertificate {
  id: string;
  userId: string;
  courseId?: string;
  tokenId: number;
  contractAddress: string;
  transactionHash: string;
  mintedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  contentId: string;
  completedAt?: Date;
  score?: number;
  createdAt: Date;
}

export interface NewsArticle {
  id: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  content: Record<Locale, string>;
  sourceUrl: string;
  sourceName: string;
  categories: string[];
  keywords: string[];
  relevanceScore?: number;
  aiProcessedAt?: Date;
  publishedAt: Date;
}

// Web3 Types
export type Address = `0x${string}`;

export interface Web3Error extends Error {
  code?: number;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Environment Variables
export interface EnvironmentVariables {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string;
  NEXT_PUBLIC_BASE_CHAIN_ID: string;
  OPENAI_API_KEY: string;
  RESEND_API_KEY: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
  NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID: string;

  NODE_ENV: 'development' | 'production' | 'test';
}
