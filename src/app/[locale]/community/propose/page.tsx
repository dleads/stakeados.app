'use client';

import React from 'react';
import ArticleProposalForm from '@/components/articles/ArticleProposalForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FileText, Check, Award } from 'lucide-react';

export default function ProposeArticlePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <FileText className="w-16 h-16 text-stakeados-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-neon mb-4">
              Propose an Article
            </h1>
            <p className="text-xl text-stakeados-gray-300">
              Share your knowledge and contribute to the Stakeados community.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="card-gaming">
                <ArticleProposalForm />
              </div>
            </div>

            {/* Guidelines Section */}
            <div className="space-y-8">
              <div className="card-primary">
                <h3 className="text-lg font-bold text-neon mb-4">
                  Proposal Guidelines
                </h3>
                <ul className="space-y-3 text-stakeados-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-stakeados-primary mt-1 flex-shrink-0" />
                    <span>
                      Ensure your topic is relevant to Web3, blockchain, or
                      cryptocurrency.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-stakeados-primary mt-1 flex-shrink-0" />
                    <span>
                      Provide a clear and detailed outline. This helps us
                      understand your vision.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-stakeados-primary mt-1 flex-shrink-0" />
                    <span>
                      Be honest about your experience. We welcome contributors
                      of all levels.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-stakeados-primary mt-1 flex-shrink-0" />
                    <span>
                      All content must be original and not published elsewhere.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card-primary">
                <h3 className="text-lg font-bold text-neon mb-4">
                  Contributor Benefits
                </h3>
                <ul className="space-y-3 text-stakeados-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-stakeados-yellow mt-1 flex-shrink-0" />
                    <span>
                      Earn points and climb the community leaderboard.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-stakeados-yellow mt-1 flex-shrink-0" />
                    <span>Receive a contributor badge on your profile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-stakeados-yellow mt-1 flex-shrink-0" />
                    <span>
                      Get featured in our newsletter and social media.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-stakeados-yellow mt-1 flex-shrink-0" />
                    <span>Potential for revenue sharing in the future.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
