'use client';

import React, { useEffect, useState } from 'react';
import { useGaslessTransactions } from '@/hooks/useGaslessTransactions';
import {
  Zap,
  ZapOff,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { Address } from 'viem';

interface GaslessTransactionManagerProps {
  className?: string;
  showStatus?: boolean;
}

export default function GaslessTransactionManager({
  className = '',
  showStatus = true,
}: GaslessTransactionManagerProps) {
  const {
    isLoading,
    isGaslessAvailable,
    error,
    success,
    lastTxHash,
    wasGasless,
    mintCertificate,
    mintCitizenship,
    batchMintCertificates,
    checkGaslessAvailability,
    clearMessages,
    isConnected,
  } = useGaslessTransactions();

  const [testData, setTestData] = useState({
    recipient: '' as Address,
    courseId: 'blockchain-basics',
    courseName: 'Blockchain Basics',
    score: 85,
    difficulty: 'basic',
    points: 150,
    isGenesis: false,
  });

  useEffect(() => {
    checkGaslessAvailability();
  }, [checkGaslessAvailability]);

  const handleTestCertificateMint = async () => {
    if (!testData.recipient) return;

    await mintCertificate(
      testData.recipient,
      testData.courseId,
      testData.courseName,
      testData.score,
      testData.difficulty,
      `https://api.stakeados.com/certificates/metadata/${testData.courseId}.json`
    );
  };

  const handleTestCitizenshipMint = async () => {
    if (!testData.recipient) return;

    await mintCitizenship(
      testData.recipient,
      testData.points,
      testData.isGenesis,
      BigInt('1000000000000000'), // 0.001 ETH
      5,
      `https://api.stakeados.com/citizenship/metadata/bronze.json`
    );
  };

  const handleTestBatchMint = async () => {
    if (!testData.recipient) return;

    const recipients = [testData.recipient];
    const scores = [testData.score];
    const tokenURIs = [
      `https://api.stakeados.com/certificates/metadata/${testData.courseId}.json`,
    ];

    await batchMintCertificates(
      recipients,
      testData.courseId,
      testData.courseName,
      scores,
      testData.difficulty,
      tokenURIs
    );
  };

  return (
    <div className={`card-gaming ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {isGaslessAvailable ? (
            <Zap className="w-6 h-6 text-stakeados-primary" />
          ) : (
            <ZapOff className="w-6 h-6 text-stakeados-gray-500" />
          )}
          <h3 className="text-xl font-bold text-neon">Gasless Transactions</h3>
        </div>
        <p className="text-stakeados-gray-300">
          Mint NFTs without gas fees using Base Paymaster
        </p>
      </div>

      {/* Status Display */}
      {showStatus && (
        <div className="mb-6">
          <div
            className={`p-4 rounded-gaming border ${
              isGaslessAvailable
                ? 'bg-stakeados-primary/10 border-stakeados-primary/30'
                : 'bg-stakeados-gray-800 border-stakeados-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              {isGaslessAvailable ? (
                <CheckCircle className="w-5 h-5 text-stakeados-primary" />
              ) : (
                <XCircle className="w-5 h-5 text-stakeados-gray-400" />
              )}
              <div>
                <div
                  className={`font-semibold ${
                    isGaslessAvailable
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-gray-300'
                  }`}
                >
                  {isGaslessAvailable
                    ? 'Gasless Transactions Available'
                    : 'Gasless Transactions Unavailable'}
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  {isGaslessAvailable
                    ? 'NFT minting will be sponsored by Base Paymaster'
                    : 'Transactions will require gas fees'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="notification-error mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-red hover:text-stakeados-red/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="notification-success mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                  {wasGasless && (
                    <span className="text-xs bg-stakeados-primary/20 text-stakeados-primary px-2 py-1 rounded">
                      GASLESS
                    </span>
                  )}
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80 ml-2"
                >
                  ×
                </button>
              </div>
              {lastTxHash && (
                <div className="mt-2 text-sm">
                  <a
                    href={`https://basescan.org/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stakeados-blue hover:text-stakeados-primary transition-colors inline-flex items-center gap-1"
                  >
                    View Transaction <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Test Interface */}
      {isConnected && (
        <div className="space-y-6">
          <div className="form-gaming">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              type="text"
              id="recipient"
              value={testData.recipient}
              onChange={e =>
                setTestData(prev => ({
                  ...prev,
                  recipient: e.target.value as Address,
                }))
              }
              placeholder="0x..."
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-gaming">
              <label htmlFor="courseId">Course ID</label>
              <input
                type="text"
                id="courseId"
                value={testData.courseId}
                onChange={e =>
                  setTestData(prev => ({ ...prev, courseId: e.target.value }))
                }
              />
            </div>

            <div className="form-gaming">
              <label htmlFor="score">Score</label>
              <input
                type="number"
                id="score"
                value={testData.score}
                onChange={e =>
                  setTestData(prev => ({
                    ...prev,
                    score: parseInt(e.target.value),
                  }))
                }
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleTestCertificateMint}
              disabled={isLoading || !testData.recipient}
              className="btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Minting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Mint Certificate
                </div>
              )}
            </button>

            <button
              onClick={handleTestCitizenshipMint}
              disabled={isLoading || !testData.recipient}
              className="btn-secondary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Minting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Mint Citizenship
                </div>
              )}
            </button>

            <button
              onClick={handleTestBatchMint}
              disabled={isLoading || !testData.recipient}
              className="btn-ghost"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Minting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Batch Mint
                </div>
              )}
            </button>
          </div>

          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-stakeados-yellow" />
              <span className="font-semibold text-stakeados-yellow">
                Testing Interface
              </span>
            </div>
            <p className="text-sm text-stakeados-gray-300">
              This interface is for testing gasless transactions. In production,
              these functions would be called automatically when users complete
              courses or meet citizenship requirements.
            </p>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="text-center p-8">
          <ZapOff className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-stakeados-gray-400">
            Connect your wallet to test gasless transactions
          </p>
        </div>
      )}
    </div>
  );
}
