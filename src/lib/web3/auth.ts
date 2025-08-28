import { createClient } from '@/lib/supabase/client';
import { signMessage } from '@wagmi/core';
import { wagmiConfig } from './config';
import type { Address } from 'viem';

// Message template for wallet verification
const VERIFICATION_MESSAGE = (address: string, nonce: string) =>
  `Welcome to Stakeados!\n\nPlease sign this message to verify your wallet ownership.\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

// Generate a random nonce for signature verification
export function generateNonce(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Sign message with connected wallet
export async function signVerificationMessage(
  address: Address
): Promise<{ signature: string; message: string; nonce: string }> {
  const nonce = generateNonce();
  const message = VERIFICATION_MESSAGE(address, nonce);

  try {
    const signature = await signMessage(wagmiConfig, {
      message,
    });

    return { signature, message, nonce };
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign verification message');
  }
}

// Verify wallet ownership and link to user profile
export async function verifyAndLinkWallet(
  userId: string,
  address: Address,
  _signature: string,
  _message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a production environment, you would verify the signature server-side
    // For now, we'll trust the client-side signature

    // Update user profile with wallet address
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_address: address.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error linking wallet to profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in verifyAndLinkWallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Unlink wallet from user profile
export async function unlinkWallet(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_address: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error unlinking wallet from profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in unlinkWallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check if wallet address is already linked to another user
export async function checkWalletAvailability(
  address: Address,
  currentUserId?: string
): Promise<{
  available: boolean;
  linkedUserId?: string;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking wallet availability:', error);
      return { available: false, error: error.message };
    }

    // If no profile found, wallet is available
    if (!data) {
      return { available: true };
    }

    // If wallet is linked to current user, it's available for them
    if (currentUserId && data.id === currentUserId) {
      return { available: true };
    }

    // Wallet is linked to another user
    return {
      available: false,
      linkedUserId: data.id,
    };
  } catch (error) {
    console.error('Error in checkWalletAvailability:', error);
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get user profile by wallet address
export async function getUserByWalletAddress(address: Address) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error getting user by wallet address:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByWalletAddress:', error);
    return null;
  }
}

// Wallet-based authentication flow
export async function authenticateWithWallet(address: Address): Promise<{
  success: boolean;
  user?: any;
  requiresSignUp?: boolean;
  error?: string;
}> {
  try {
    // Check if wallet is linked to an existing user
    const profile = await getUserByWalletAddress(address);

    if (profile) {
      // User exists, they can sign in
      return {
        success: true,
        user: profile,
      };
    } else {
      // No user found, they need to sign up first
      return {
        success: false,
        requiresSignUp: true,
      };
    }
  } catch (error) {
    console.error('Error in authenticateWithWallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}
