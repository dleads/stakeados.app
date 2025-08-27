'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import ArticleProposalList from '@/components/articles/ArticleProposalList';
import ProposalReviewInterface from '@/components/articles/ProposalReviewInterface';
import { ContentService } from '@/lib/services/contentService';
import type { ArticleProposalWithProposer } from '@/types/content';

export default function AdminProposalsPage() {
  const [selectedProposal, setSelectedProposal] =
    useState<ArticleProposalWithProposer | null>(null);

  // Fetch proposal statistics
  const { data: stats } = useQuery({
    queryKey: ['proposal-stats'],
    queryFn: async () => {
      const [pending, approved, rejected, changesRequested] = await Promise.all(
        [
          ContentService.getArticleProposals({ status: 'pending' }, 0, 1),
          ContentService.getArticleProposals({ status: 'approved' }, 0, 1),
          ContentService.getArticleProposals({ status: 'rejected' }, 0, 1),
          ContentService.getArticleProposals(
            { status: 'changes_requested' },
            0,
            1
          ),
        ]
      );

      return {
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count,
        changesRequested: changesRequested.count,
        total:
          pending.count +
          approved.count +
          rejected.count +
          changesRequested.count,
      };
    },
  });

  const handleProposalSelect = (proposal: ArticleProposalWithProposer) => {
    setSelectedProposal(proposal);
  };

  const handleStatusUpdate = (_proposalId: string, _status: string) => {
    // Refresh the list and close the detail view
    setSelectedProposal(null);
  };

  return (
    <div className="min-h-screen bg-stakeados-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Article Proposal Management
          </h1>
          <p className="text-stakeados-gray-300">
            Review and manage article proposals from the community
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-stakeados-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    Total Proposals
                  </p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-stakeados-primary" />
              </div>
            </div>

            <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    Changes Requested
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.changesRequested}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposals List */}
          <div className="lg:col-span-2">
            <ArticleProposalList onProposalSelect={handleProposalSelect} />
          </div>

          {/* Proposal Detail/Review */}
          <div className="lg:col-span-1">
            {selectedProposal ? (
              <div className="sticky top-8">
                <ProposalReviewInterface
                  proposal={selectedProposal}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            ) : (
              <div className="bg-stakeados-gray-800 rounded-gaming p-8 border border-stakeados-gray-600 text-center">
                <FileText className="w-12 h-12 text-stakeados-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Select a Proposal
                </h3>
                <p className="text-stakeados-gray-400">
                  Choose a proposal from the list to review its details and take
                  action.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-8 bg-stakeados-gray-800 rounded-gaming p-6 border border-stakeados-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {stats?.pending || 0}
              </div>
              <div className="text-sm text-stakeados-gray-400">
                Proposals awaiting your review
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-stakeados-primary mb-1">
                {stats
                  ? Math.round((stats.approved / stats.total) * 100) || 0
                  : 0}
                %
              </div>
              <div className="text-sm text-stakeados-gray-400">
                Approval rate this month
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {stats ? stats.approved + stats.changesRequested : 0}
              </div>
              <div className="text-sm text-stakeados-gray-400">
                Proposals in progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
