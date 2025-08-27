import { createPublicClient, http, namehash } from 'viem';
import { normalize } from 'viem/ens';
import { base, baseSepolia } from 'viem/chains';
import { getCurrentChain } from './config';
import type { Address } from 'viem';

// Base Name Service contract addresses
const BASE_REGISTRY_ADDRESSES = {
  [base.id]: '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5', // Base Mainnet
  [baseSepolia.id]: '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5', // Base Sepolia (placeholder)
} as const;

// const BASE_RESOLVER_ADDRESSES = {
//   [base.id]: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD', // Base Mainnet
//   [baseSepolia.id]: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD', // Base Sepolia (placeholder)
// } as const;

// Create public client for Base Name Service queries
function getPublicClient() {
  const chain = getCurrentChain();
  return createPublicClient({
    chain,
    transport: http(),
  });
}

// Base Name Service Registry ABI (minimal)
const REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Base Name Service Resolver ABI (minimal)
const RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Resolve Base name to address
export async function resolveBaseName(name: string): Promise<Address | null> {
  try {
    const client = getPublicClient();
    const chain = getCurrentChain();

    // Normalize the name (remove .base.eth if present, add if missing)
    const normalizedName = name.endsWith('.base.eth')
      ? name
      : `${name}.base.eth`;

    const node = namehash(normalize(normalizedName));

    // Get resolver address from registry
    const resolverAddress = await client.readContract({
      address: BASE_REGISTRY_ADDRESSES[chain.id],
      abi: REGISTRY_ABI,
      functionName: 'resolver',
      args: [node],
    });

    if (
      !resolverAddress ||
      resolverAddress === '0x0000000000000000000000000000000000000000'
    ) {
      return null;
    }

    // Get address from resolver
    const address = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: 'addr',
      args: [node],
    });

    return address && address !== '0x0000000000000000000000000000000000000000'
      ? (address as Address)
      : null;
  } catch (error) {
    console.error('Error resolving Base name:', error);
    return null;
  }
}

// Reverse resolve address to Base name
export async function reverseResolveAddress(
  address: Address
): Promise<string | null> {
  try {
    const client = getPublicClient();
    const chain = getCurrentChain();

    // Create reverse lookup node (addr.reverse format)
    const reverseNode = namehash(
      `${address.slice(2).toLowerCase()}.addr.reverse`
    );

    // Get resolver for reverse lookup
    const resolverAddress = await client.readContract({
      address: BASE_REGISTRY_ADDRESSES[chain.id],
      abi: REGISTRY_ABI,
      functionName: 'resolver',
      args: [reverseNode],
    });

    if (
      !resolverAddress ||
      resolverAddress === '0x0000000000000000000000000000000000000000'
    ) {
      return null;
    }

    // Get name from resolver
    const name = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: 'text',
      args: [reverseNode, 'name'],
    });

    // Verify the name resolves back to the same address
    if (name) {
      const resolvedAddress = await resolveBaseName(name);
      if (resolvedAddress?.toLowerCase() === address.toLowerCase()) {
        return name;
      }
    }

    return null;
  } catch (error) {
    console.error('Error reverse resolving address:', error);
    return null;
  }
}

// Get avatar URL from Base name
export async function getBaseNameAvatar(name: string): Promise<string | null> {
  try {
    const client = getPublicClient();
    const chain = getCurrentChain();

    const normalizedName = name.endsWith('.base.eth')
      ? name
      : `${name}.base.eth`;

    const node = namehash(normalize(normalizedName));

    // Get resolver address
    const resolverAddress = await client.readContract({
      address: BASE_REGISTRY_ADDRESSES[chain.id],
      abi: REGISTRY_ABI,
      functionName: 'resolver',
      args: [node],
    });

    if (
      !resolverAddress ||
      resolverAddress === '0x0000000000000000000000000000000000000000'
    ) {
      return null;
    }

    // Get avatar text record
    const avatar = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: 'text',
      args: [node, 'avatar'],
    });

    return avatar || null;
  } catch (error) {
    console.error('Error getting Base name avatar:', error);
    return null;
  }
}

// Get text record from Base name
export async function getBaseNameTextRecord(
  name: string,
  key: string
): Promise<string | null> {
  try {
    const client = getPublicClient();
    const chain = getCurrentChain();

    const normalizedName = name.endsWith('.base.eth')
      ? name
      : `${name}.base.eth`;

    const node = namehash(normalize(normalizedName));

    // Get resolver address
    const resolverAddress = await client.readContract({
      address: BASE_REGISTRY_ADDRESSES[chain.id],
      abi: REGISTRY_ABI,
      functionName: 'resolver',
      args: [node],
    });

    if (
      !resolverAddress ||
      resolverAddress === '0x0000000000000000000000000000000000000000'
    ) {
      return null;
    }

    // Get text record
    const textRecord = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: 'text',
      args: [node, key],
    });

    return textRecord || null;
  } catch (error) {
    console.error(`Error getting Base name text record for key ${key}:`, error);
    return null;
  }
}

// Check if a Base name is available
export async function isBaseNameAvailable(name: string): Promise<boolean> {
  try {
    const client = getPublicClient();
    const chain = getCurrentChain();

    const normalizedName = name.endsWith('.base.eth')
      ? name
      : `${name}.base.eth`;

    const node = namehash(normalize(normalizedName));

    // Check if name has an owner
    const owner = await client.readContract({
      address: BASE_REGISTRY_ADDRESSES[chain.id],
      abi: REGISTRY_ABI,
      functionName: 'owner',
      args: [node],
    });

    return !owner || owner === '0x0000000000000000000000000000000000000000';
  } catch (error) {
    console.error('Error checking Base name availability:', error);
    return false;
  }
}

// Validate Base name format
export function isValidBaseName(name: string): boolean {
  // Remove .base.eth suffix if present
  const cleanName = name.replace(/\.base\.eth$/, '');

  // Check length (3-63 characters)
  if (cleanName.length < 3 || cleanName.length > 63) {
    return false;
  }

  // Check format: only lowercase letters, numbers, and hyphens
  // Cannot start or end with hyphen
  const nameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return nameRegex.test(cleanName);
}

// Format Base name for display
export function formatBaseName(name: string): string {
  if (!name) return '';

  // Add .base.eth suffix if not present
  return name.endsWith('.base.eth') ? name : `${name}.base.eth`;
}

// Get short display format for Base name
export function getShortBaseName(name: string): string {
  if (!name) return '';

  // Remove .base.eth suffix for short display
  return name.replace(/\.base\.eth$/, '');
}
