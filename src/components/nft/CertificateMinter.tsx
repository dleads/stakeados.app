'use client';

import React, { useState } from 'react';

import { useNFTManagement } from '@/hooks/useNFTManagement';
import { Award, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';
import type { Address } from 'viem';

interface CertificateMinterProps {
  className?: string;
  courseId?: string;
  courseName?: string;
  onSuccess?: (tokenId?: number) => void;
}

export default function CertificateMinter({
  className = '',
  courseId: defaultCourseId,
  courseName: defaultCourseName,
  onSuccess,
}: CertificateMinterProps) {
  const {
    mintCertificateNFT,
    isMinting,
    error,
    success,
    clearMessages,
    isConnected,
  } = useNFTManagement();

  const [formData, setFormData] = useState({
    recipient: '' as Address,
    courseId: defaultCourseId || 'blockchain-basics',
    courseName: defaultCourseName || 'Blockchain Basics',
    score: 85,
    difficulty: 'basic' as 'basic' | 'intermediate' | 'advanced',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!formData.recipient) {
      return;
    }

    const result = await mintCertificateNFT(
      formData.courseId,
      formData.courseName,
      formData.score,
      formData.difficulty,
      formData.recipient
    );

    if (result.success && onSuccess) {
      onSuccess(result.tokenId);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'score' ? parseInt(value) : value,
    }));
  };

  if (!isConnected) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-stakeados-gray-400">
            Connect your wallet to mint certificates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-6 h-6 text-stakeados-yellow" />
          <h3 className="text-xl font-bold text-neon">Mint Certificate NFT</h3>
        </div>
        <p className="text-stakeados-gray-300">
          Create a verifiable certificate NFT on Base network
        </p>
      </div>

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
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Address */}
        <div className="form-gaming">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            type="text"
            id="recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            placeholder="0x..."
            className="font-mono"
            required
          />
        </div>

        {/* Course Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-gaming">
            <label htmlFor="courseId">Course ID</label>
            <input
              type="text"
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-gaming">
            <label htmlFor="courseName">Course Name</label>
            <input
              type="text"
              id="courseName"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Score and Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-gaming">
            <label htmlFor="score">Score (0-100)</label>
            <input
              type="number"
              id="score"
              name="score"
              value={formData.score}
              onChange={handleChange}
              min="0"
              max="100"
              required
            />
          </div>

          <div className="form-gaming">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              required
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isMinting || !formData.recipient}
          className="btn-primary w-full"
        >
          {isMinting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Minting Certificate...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Mint Certificate NFT
            </div>
          )}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-stakeados-gray-800 rounded-gaming">
        <h4 className="font-semibold text-stakeados-primary mb-2">
          About Certificate NFTs
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Certificates are minted on Base network</li>
          <li>• Gasless minting when available</li>
          <li>• Metadata stored on IPFS</li>
          <li>• Verifiable proof of course completion</li>
          <li>• Cannot be duplicated for same course</li>
        </ul>
      </div>
    </div>
  );
}
