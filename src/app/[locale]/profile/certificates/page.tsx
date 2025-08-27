'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NFTGallery from '@/components/nft/NFTGallery';
import CertificateMinter from '@/components/nft/CertificateMinter';
import { Award } from 'lucide-react';

export default function CertificatesPage() {
  const t = useTranslations();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="w-12 h-12 text-stakeados-yellow" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  {t('profile.nftCertificates')}
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Your blockchain-verified educational achievements
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content - NFT Gallery */}
              <div className="lg:col-span-3">
                <NFTGallery showFilters={true} />
              </div>

              {/* Sidebar - Certificate Minter */}
              <div className="lg:col-span-1">
                <CertificateMinter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
