import { createPublicClient, http, encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'viem/chains';
// import { env } from '@/lib/env';

// Paymaster configuration
const PAYMASTER_CONFIG = {
  base: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    bundlerUrl: 'https://bundler.base.org',
    paymasterUrl: 'https://paymaster.base.org',
  },
  baseSepolia: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    bundlerUrl: 'https://bundler.base-sepolia.org',
    paymasterUrl: 'https://paymaster.base-sepolia.org',
  },
} as const;

// Smart Account configuration
// const SMART_ACCOUNT_CONFIG: Record<number, any> = {
//   [base.id]: {
//     factory: '0x0000000000000000000000000000000000000000', // To be deployed
//     entryPoint: PAYMASTER_CONFIG.base.entryPoint,
//   },
//   [baseSepolia.id]: {
//     factory: '0x0000000000000000000000000000000000000000', // To be deployed
//     entryPoint: PAYMASTER_CONFIG.baseSepolia.entryPoint,
//   },
// };

// Certificate contract ABI for gasless minting
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
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'courseId', type: 'string' },
      { name: 'courseName', type: 'string' },
      { name: 'scores', type: 'uint256[]' },
      { name: 'difficulty', type: 'string' },
      { name: 'tokenURIs', type: 'string[]' },
    ],
    name: 'batchMintCertificates',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Citizenship contract ABI for gasless minting
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
] as const;

// Helper function to create paymaster clients
export function createPaymasterClients() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const chain = isDevelopment ? baseSepolia : base;
  const config =
    PAYMASTER_CONFIG[chain.id === base.id ? 'base' : 'baseSepolia'];

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  return {
    publicClient,
    bundlerUrl: config.bundlerUrl,
    paymasterUrl: config.paymasterUrl,
    entryPoint: config.entryPoint,
  };
}

// User Operation interface
export interface UserOperation {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

// Paymaster response interface
export interface PaymasterResponse {
  paymasterAndData: `0x${string}`;
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
}

// Gasless transaction interface
export interface GaslessTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

// Helper function to estimate gas for user operation
export async function estimateUserOperationGas(userOp: UserOperation): Promise<{
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
}> {
  const { bundlerUrl } = createPaymasterClients();

  try {
    const response = await fetch(`${bundlerUrl}/eth_estimateUserOperationGas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateUserOperationGas',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      preVerificationGas: BigInt(result.result.preVerificationGas),
      verificationGasLimit: BigInt(result.result.verificationGasLimit),
      callGasLimit: BigInt(result.result.callGasLimit),
    };
  } catch (error) {
    console.error('Error estimating user operation gas:', error);
    throw error;
  }
}

// Helper function to get paymaster data
export async function getPaymasterData(
  userOp: UserOperation
): Promise<PaymasterResponse> {
  const { paymasterUrl } = createPaymasterClients();

  try {
    const response = await fetch(`${paymasterUrl}/eth_paymasterAndData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_paymasterAndData',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      paymasterAndData: result.result.paymasterAndData,
      preVerificationGas: BigInt(result.result.preVerificationGas || '0'),
      verificationGasLimit: BigInt(result.result.verificationGasLimit || '0'),
      callGasLimit: BigInt(result.result.callGasLimit || '0'),
    };
  } catch (error) {
    console.error('Error getting paymaster data:', error);
    throw error;
  }
}

// Helper function to send user operation
export async function sendUserOperation(
  userOp: UserOperation
): Promise<{ userOpHash: `0x${string}` }> {
  const { bundlerUrl } = createPaymasterClients();

  try {
    const response = await fetch(`${bundlerUrl}/eth_sendUserOperation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      userOpHash: result.result,
    };
  } catch (error) {
    console.error('Error sending user operation:', error);
    throw error;
  }
}

// Helper function to wait for user operation
export async function waitForUserOperation(
  userOpHash: `0x${string}`
): Promise<{ success: boolean; receipt?: any }> {
  const { bundlerUrl } = createPaymasterClients();

  try {
    const response = await fetch(`${bundlerUrl}/eth_getUserOperationReceipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.result) {
      return {
        success: true,
        receipt: result.result,
      };
    }

    return {
      success: false,
    };
  } catch (error) {
    console.error('Error waiting for user operation:', error);
    throw error;
  }
}

// Helper function to create gasless transaction
export async function createGaslessTransaction(
  transaction: GaslessTransaction,
  sender: `0x${string}`
): Promise<UserOperation> {
  // This is a simplified implementation
  // In a real implementation, you would need to:
  // 1. Get the nonce from the smart account
  // 2. Encode the transaction data
  // 3. Get paymaster data
  // 4. Estimate gas

  const nonce = BigInt(0); // This should be fetched from the smart account
  const callData = transaction.data;
  const callGasLimit = BigInt(100000);
  const verificationGasLimit = BigInt(200000);
  const preVerificationGas = BigInt(50000);
  const maxFeePerGas = BigInt(20000000000); // 20 gwei
  const maxPriorityFeePerGas = BigInt(2000000000); // 2 gwei

  const userOp: UserOperation = {
    sender,
    nonce,
    initCode: '0x',
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    paymasterAndData: '0x',
    signature: '0x',
  };

  // Get paymaster data
  const paymasterData = await getPaymasterData(userOp);

  // Update user operation with paymaster data
  userOp.paymasterAndData = paymasterData.paymasterAndData;
  userOp.preVerificationGas = paymasterData.preVerificationGas;
  userOp.verificationGasLimit = paymasterData.verificationGasLimit;
  userOp.callGasLimit = paymasterData.callGasLimit;

  return userOp;
}

/**
 * Mint certificate with gasless transaction
 */
export async function mintCertificateGasless(
  recipient: `0x${string}`,
  courseId: string,
  courseName: string,
  score: number,
  difficulty: string,
  tokenURI: string
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    const contractAddress = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'; // This should be fetched from config

    const callData = encodeFunctionData({
      abi: CERTIFICATE_ABI,
      functionName: 'mintCertificate',
      args: [
        recipient,
        courseId,
        courseName,
        BigInt(score),
        difficulty,
        tokenURI,
      ],
    });

    const userOp = await createGaslessTransaction(
      {
        to: contractAddress as `0x${string}`,
        data: callData,
        value: BigInt(0),
      },
      recipient
    );

    const { userOpHash } = await sendUserOperation(userOp);
    const { receipt } = await waitForUserOperation(userOpHash);

    if (receipt?.status === 'success') {
      return {
        success: true,
        txHash: userOpHash,
      };
    } else {
      return {
        success: false,
        error: 'Minting certificate failed',
      };
    }
  } catch (error) {
    console.error('Error minting certificate gasless:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to mint certificate',
    };
  }
}

/**
 * Mint citizenship with gasless transaction
 */
export async function mintCitizenshipGasless(
  recipient: `0x${string}`,
  points: number,
  isGenesis: boolean,
  ethBalance: bigint,
  transactionCount: number,
  tokenURI: string
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    const contractAddress = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'; // This should be fetched from config

    const callData = encodeFunctionData({
      abi: CITIZENSHIP_ABI,
      functionName: 'mintCitizenship',
      args: [
        recipient,
        BigInt(points),
        isGenesis,
        ethBalance,
        BigInt(transactionCount),
        tokenURI,
      ],
    });

    const userOp = await createGaslessTransaction(
      {
        to: contractAddress as `0x${string}`,
        data: callData,
        value: BigInt(0),
      },
      recipient
    );

    const { userOpHash } = await sendUserOperation(userOp);
    const { receipt } = await waitForUserOperation(userOpHash);

    if (receipt?.status === 'success') {
      return {
        success: true,
        txHash: userOpHash,
      };
    } else {
      return {
        success: false,
        error: 'Minting citizenship failed',
      };
    }
  } catch (error) {
    console.error('Error minting citizenship gasless:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to mint citizenship',
    };
  }
}

/**
 * Batch mint certificates with gasless transaction
 */
export async function batchMintCertificatesGasless(
  recipients: `0x${string}`[],
  courseId: string,
  courseName: string,
  scores: number[],
  difficulty: string,
  tokenURIs: string[],
  executor: `0x${string}`
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    const contractAddress = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'; // This should be fetched from config

    const callData = encodeFunctionData({
      abi: CERTIFICATE_ABI,
      functionName: 'batchMintCertificates',
      args: [
        recipients,
        courseId,
        courseName,
        scores.map(s => BigInt(s)),
        difficulty,
        tokenURIs,
      ],
    });

    const userOp = await createGaslessTransaction(
      {
        to: contractAddress as `0x${string}`,
        data: callData,
        value: BigInt(0),
      },
      executor
    );

    const { userOpHash } = await sendUserOperation(userOp);
    const { receipt } = await waitForUserOperation(userOpHash);

    if (receipt?.status === 'success') {
      return {
        success: true,
        txHash: userOpHash,
      };
    } else {
      return {
        success: false,
        error: 'Batch minting certificates failed',
      };
    }
  } catch (error) {
    console.error('Error batch minting certificates gasless:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to batch mint certificates',
    };
  }
}

/**
 * Check if gasless transactions are available
 */
export async function isGaslessAvailable(): Promise<boolean> {
  try {
    const { paymasterUrl } = createPaymasterClients();

    const response = await fetch(`${paymasterUrl}/pm_getPaymasterStubData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_getPaymasterStubData',
        params: [],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking gasless availability:', error);
    return false;
  }
}

/**
 * Fallback to regular transaction when gasless fails
 */
export async function executeRegularTransaction(
  request: GaslessTransaction,
  walletClient: any
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    const txHash = await walletClient.sendTransaction({
      to: request.to,
      data: request.data,
      value: request.value || 0n,
    });

    return {
      success: true,
      txHash,
    };
  } catch (error) {
    console.error('Regular transaction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Smart transaction executor with gasless fallback
 */
export async function executeSmartTransaction(
  request: GaslessTransaction,
  _userAddress: `0x${string}`,
  walletClient?: any
): Promise<{
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
  wasGasless: boolean;
}> {
  // Try gasless first
  const gaslessAvailable = await isGaslessAvailable();

  if (gaslessAvailable) {
    const gaslessResult = await mintCertificateGasless(
      request.to,
      'testCourse',
      'Test Course',
      100,
      'Easy',
      'uri1'
    ); // Placeholder for actual gasless execution

    if (gaslessResult.success) {
      return {
        ...gaslessResult,
        wasGasless: true,
      };
    }

    console.warn(
      'Gasless transaction failed, falling back to regular transaction'
    );
  }

  // Fallback to regular transaction
  if (walletClient) {
    const regularResult = await executeRegularTransaction(
      request,
      walletClient
    );
    return {
      ...regularResult,
      wasGasless: false,
    };
  }

  return {
    success: false,
    error: 'No wallet client available for fallback transaction',
    wasGasless: false,
  };
}
