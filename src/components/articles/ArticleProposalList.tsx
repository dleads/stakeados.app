'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Check,
  X,
  Eye,
  Filter,
  Calendar,
  FileText,
  ExternalLink,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ContentService } from '@/lib/services/contentService';
import { formatRelativeTime } from '@/lib/utils';
import type {
  ArticleProposalWithProposer,
  ProposalStatus,
} from '@/types/content';

const getStatusBadge = (status: ProposalStatus) => {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      label: 'Pending',
    },
    approved: {
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      label: 'Approved',
    },
    rejected: {
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      label: 'Rejected',
    },
    changes_requested: {
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      label: 'Changes Requested',
    },
  };

  const safeStatus = status || 'pending';
  const config = statusConfig[safeStatus as keyof typeof statusConfig];
  return <Badge className={`${config.color} border`}>{config.label}</Badge>;
};

interface ProposalFilters {
  status: ProposalStatus | 'all';
  search: string;
  sortBy: 'created_at' | 'updated_at' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface ArticleProposalListProps {
  className?: string;
  onProposalSelect?: (proposal: ArticleProposalWithProposer) => void;
}

export default function ArticleProposalList({
  className = '',
  onProposalSelect,
}: ArticleProposalListProps) {
  const [filters, setFilters] = useState<ProposalFilters>({
    status: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [selectedProposal, setSelectedProposal] =
    useState<ArticleProposalWithProposer | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const queryClient = useQueryClient();

  // Fetch proposals
  const {
    data: proposalsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['article-proposals', filters, page],
    queryFn: async () => {
      const filterParams =
        filters.status !== 'all' ? { status: filters.status as string } : {};
      return ContentService.getArticleProposals(filterParams, page, 20);
    },
  });

  // Update proposal status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      proposalId,
      status,
      feedback,
    }: {
      proposalId: string;
      status: 'approved' | 'rejected' | 'changes_requested';
      feedback?: string;
    }) => {
      await ContentService.updateProposalStatus(proposalId, status, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-proposals'] });
      setSelectedProposal(null);
    },
  });

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({
      proposalIds,
      action,
    }: {
      proposalIds: string[];
      action: 'approve' | 'reject';
    }) => {
      const promises = proposalIds.map(id =>
        ContentService.updateProposalStatus(
          id,
          action === 'approve' ? 'approved' : 'rejected'
        )
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-proposals'] });
      setSelectedProposals(new Set());
    },
  });

  const proposals = proposalsData?.data || [];
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch =
      !filters.search ||
      proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      proposal.proposer_name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    return matchesSearch;
  });

  const handleStatusUpdate = (
    proposalId: string,
    status: 'approved' | 'rejected' | 'changes_requested',
    feedback?: string
  ) => {
    updateStatusMutation.mutate({ proposalId, status, feedback });
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    if (selectedProposals.size === 0) return;
    bulkActionMutation.mutate({
      proposalIds: Array.from(selectedProposals),
      action,
    });
  };

  const toggleProposalSelection = (proposalId: string) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(proposalId)) {
      newSelected.delete(proposalId);
    } else {
      newSelected.add(proposalId);
    }
    setSelectedProposals(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProposals.size === filteredProposals.length) {
      setSelectedProposals(new Set());
    } else {
      setSelectedProposals(new Set(filteredProposals.map(p => p.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stakeados-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stakeados-red/10 border border-stakeados-red/30 rounded-gaming p-4">
        <p className="text-stakeados-red">
          Failed to load proposals. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Article Proposals</h2>
          <p className="text-stakeados-gray-300 mt-1">
            Review and manage article proposals from the community
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedProposals.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stakeados-gray-300">
                {selectedProposals.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('approve')}
                disabled={bulkActionMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                disabled={bulkActionMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-stakeados-gray-800 rounded-gaming p-6 border border-stakeados-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search proposals..."
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters(prev => ({ ...prev, search: e.target.value }))
              }
            />

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filters.status || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value as ProposalStatus | 'all',
                }))
              }
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="changes_requested">Changes Requested</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filters.sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilters(prev => ({
                  ...prev,
                  sortBy: e.target.value as
                    | 'created_at'
                    | 'updated_at'
                    | 'title',
                }))
              }
            >
              <option value="created_at">Date Created</option>
              <option value="updated_at">Last Updated</option>
              <option value="title">Title</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filters.sortOrder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilters(prev => ({
                  ...prev,
                  sortOrder: e.target.value as 'asc' | 'desc',
                }))
              }
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-stakeados-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No proposals found
            </h3>
            <p className="text-stakeados-gray-400">
              {filters.search || filters.status !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No article proposals have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-stakeados-gray-800 rounded-gaming border border-stakeados-gray-600">
              <button
                onClick={toggleSelectAll}
                className="text-stakeados-gray-400 hover:text-white transition-colors"
              >
                {selectedProposals.size === filteredProposals.length ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm text-stakeados-gray-300">
                Select all ({filteredProposals.length} proposals)
              </span>
            </div>

            {/* Proposals */}
            {filteredProposals.map(proposal => (
              <div
                key={proposal.id}
                className={`bg-stakeados-gray-800 rounded-gaming p-6 border transition-all duration-200 ${
                  selectedProposals.has(proposal.id)
                    ? 'border-stakeados-primary bg-stakeados-primary/5'
                    : 'border-stakeados-gray-600 hover:border-stakeados-gray-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleProposalSelection(proposal.id)}
                    className="mt-1 text-stakeados-gray-400 hover:text-white transition-colors"
                  >
                    {selectedProposals.has(proposal.id) ? (
                      <CheckSquare className="w-5 h-5 text-stakeados-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  {/* Proposal Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                          {proposal.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-stakeados-gray-400 mb-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              displayName={proposal.proposer_name}
                              profileAvatarUrl={proposal.proposer_avatar}
                              size="sm"
                            />
                            <span>{proposal.proposer_name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatRelativeTime(
                                proposal.created_at || new Date()
                              )}
                            </span>
                          </div>

                          <Badge variant="secondary">
                            {proposal.suggested_level}
                          </Badge>

                          {proposal.estimated_read_time && (
                            <span>{proposal.estimated_read_time} min read</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(proposal.status)}
                      </div>
                    </div>

                    <p className="text-stakeados-gray-300 mb-4 line-clamp-2">
                      {proposal.summary}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (onProposalSelect) {
                              onProposalSelect(proposal);
                            } else {
                              setSelectedProposal(proposal);
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        {proposal.previous_work &&
                          proposal.previous_work.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  proposal.previous_work![0],
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Portfolio
                            </Button>
                          )}
                      </div>

                      {proposal.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(proposal.id, 'approved')
                            }
                            disabled={updateStatusMutation.isPending}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(proposal.id, 'rejected')
                            }
                            disabled={updateStatusMutation.isPending}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {proposalsData && proposalsData.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setPage(prev => prev + 1)}
            disabled={isLoading}
          >
            Load More
          </Button>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}

// Proposal Detail Modal Component
interface ProposalDetailModalProps {
  proposal: ArticleProposalWithProposer;
  onClose: () => void;
  onStatusUpdate: (
    proposalId: string,
    status: 'approved' | 'rejected' | 'changes_requested',
    feedback?: string
  ) => void;
  isUpdating: boolean;
}

function ProposalDetailModal({
  proposal,
  onClose,
  onStatusUpdate,
  isUpdating,
}: ProposalDetailModalProps) {
  const [feedback, setFeedback] = useState(proposal.feedback || '');
  const [selectedAction, setSelectedAction] = useState<
    'approved' | 'rejected' | 'changes_requested' | null
  >(null);

  const handleSubmit = () => {
    if (!selectedAction) return;
    onStatusUpdate(proposal.id, selectedAction, feedback.trim() || undefined);
  };

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-2 pr-4">
              {proposal.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-stakeados-gray-400">
              <div className="flex items-center gap-2">
                <UserAvatar
                  displayName={proposal.proposer_name}
                  profileAvatarUrl={proposal.proposer_avatar}
                  size="sm"
                />
                <span>{proposal.proposer_name}</span>
              </div>
              <span>
                {formatRelativeTime(proposal.created_at || new Date())}
              </span>
              {getStatusBadge(proposal.status)}
            </div>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
            <p className="text-stakeados-gray-300 leading-relaxed">
              {proposal.summary}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-stakeados-gray-200 mb-1">
                Difficulty Level
              </h4>
              <Badge variant="secondary" className="capitalize">
                {proposal.suggested_level}
              </Badge>
            </div>

            {proposal.suggested_category && (
              <div>
                <h4 className="text-sm font-medium text-stakeados-gray-200 mb-1">
                  Suggested Category
                </h4>
                <p className="text-stakeados-gray-300">
                  {proposal.suggested_category}
                </p>
              </div>
            )}

            {proposal.estimated_read_time && (
              <div>
                <h4 className="text-sm font-medium text-stakeados-gray-200 mb-1">
                  Estimated Read Time
                </h4>
                <p className="text-stakeados-gray-300">
                  {proposal.estimated_read_time} minutes
                </p>
              </div>
            )}
          </div>

          {/* Outline */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Article Outline
            </h3>
            <div className="bg-stakeados-gray-700 rounded-gaming p-4">
              <pre className="text-stakeados-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {proposal.outline}
              </pre>
            </div>
          </div>

          {/* Author Experience */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Author Experience
            </h3>
            <p className="text-stakeados-gray-300 leading-relaxed">
              {proposal.author_experience}
            </p>
          </div>

          {/* Previous Work */}
          {proposal.previous_work && proposal.previous_work.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Previous Work
              </h3>
              <div className="space-y-2">
                {proposal.previous_work.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Current Feedback */}
          {proposal.feedback && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Previous Feedback
              </h3>
              <div className="bg-stakeados-gray-700 rounded-gaming p-4">
                <p className="text-stakeados-gray-300">{proposal.feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Review Actions */}
        {proposal.status === 'pending' && (
          <div className="border-t border-stakeados-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Review Decision
            </h3>

            {/* Action Selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setSelectedAction('approved')}
                className={`p-4 rounded-gaming border-2 transition-all ${
                  selectedAction === 'approved'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-green-500/50'
                }`}
              >
                <Check className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Approve</div>
              </button>

              <button
                onClick={() => setSelectedAction('changes_requested')}
                className={`p-4 rounded-gaming border-2 transition-all ${
                  selectedAction === 'changes_requested'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-blue-500/50'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Request Changes</div>
              </button>

              <button
                onClick={() => setSelectedAction('rejected')}
                className={`p-4 rounded-gaming border-2 transition-all ${
                  selectedAction === 'rejected'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-red-500/50'
                }`}
              >
                <X className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Reject</div>
              </button>
            </div>

            {/* Feedback Input */}
            {(selectedAction === 'changes_requested' ||
              selectedAction === 'rejected') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-stakeados-gray-200 mb-2">
                  Feedback{' '}
                  {selectedAction === 'changes_requested'
                    ? '(Required)'
                    : '(Optional)'}
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder={
                    selectedAction === 'changes_requested'
                      ? 'Explain what changes are needed...'
                      : 'Explain why this proposal was rejected...'
                  }
                  rows={4}
                  className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-3 focus:ring-2 focus:ring-stakeados-primary/50 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedAction ||
                  isUpdating ||
                  (selectedAction === 'changes_requested' && !feedback.trim())
                }
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    {selectedAction === 'approved' && 'Approve Proposal'}
                    {selectedAction === 'changes_requested' &&
                      'Request Changes'}
                    {selectedAction === 'rejected' && 'Reject Proposal'}
                    {!selectedAction && 'Select Action'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
