'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  FileText,
  MessageSquare,
  Clock,
  ExternalLink,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ContentService } from '@/lib/services/contentService';
import { formatRelativeTime } from '@/lib/utils';
import type { ArticleProposalWithProposer } from '@/types/content';

interface ProposalReviewInterfaceProps {
  proposal: ArticleProposalWithProposer;
  onStatusUpdate?: (proposalId: string, status: string) => void;
  className?: string;
}

export default function ProposalReviewInterface({
  proposal,
  onStatusUpdate,
  className = '',
}: ProposalReviewInterfaceProps) {
  const [selectedAction, setSelectedAction] = useState<
    'approved' | 'rejected' | 'changes_requested' | null
  >(null);
  const [feedback, setFeedback] = useState(proposal.feedback || '');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      feedback,
    }: {
      status: 'approved' | 'rejected' | 'changes_requested';
      feedback?: string;
    }) => {
      await ContentService.updateProposalStatus(proposal.id, status, feedback);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-proposals'] });
      setSelectedAction(null);
      setShowFeedbackForm(false);
      setFeedback('');
      onStatusUpdate?.(proposal.id, variables.status);
    },
  });

  const handleQuickAction = (
    action: 'approved' | 'rejected' | 'changes_requested'
  ) => {
    if (action === 'approved') {
      updateStatusMutation.mutate({ status: action });
    } else {
      setSelectedAction(action);
      setShowFeedbackForm(true);
    }
  };

  const handleSubmitWithFeedback = () => {
    if (!selectedAction) return;

    const trimmedFeedback = feedback.trim();
    if (selectedAction === 'changes_requested' && !trimmedFeedback) {
      return; // Feedback is required for changes requested
    }

    updateStatusMutation.mutate({
      status: selectedAction,
      feedback: trimmedFeedback || undefined,
    });
  };

  const getActionButtonConfig = (
    action: 'approved' | 'rejected' | 'changes_requested'
  ) => {
    const configs = {
      approved: {
        icon: Check,
        label: 'Approve',
        description:
          'Approve this proposal and allow the author to start writing',
        color: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
        bgColor: 'bg-green-500/10 border-green-500/30',
      },
      changes_requested: {
        icon: FileText,
        label: 'Request Changes',
        description: 'Ask the author to revise their proposal',
        color: 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
      },
      rejected: {
        icon: X,
        label: 'Reject',
        description: 'Reject this proposal with feedback',
        color: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
        bgColor: 'bg-red-500/10 border-red-500/30',
      },
    };
    return configs[action];
  };

  return (
    <div
      className={`bg-stakeados-gray-800 rounded-gaming border border-stakeados-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-stakeados-gray-600">
        <div className="flex items-start justify-between mb-4">
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
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {formatRelativeTime(proposal.created_at || new Date())}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                proposal.status === 'approved'
                  ? 'default'
                  : proposal.status === 'rejected'
                    ? 'destructive'
                    : proposal.status === 'changes_requested'
                      ? 'secondary'
                      : 'outline'
              }
            >
              {(proposal.status || 'pending').replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Proposal Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-stakeados-gray-400">Difficulty:</span>
            <span className="ml-2 text-white capitalize">
              {proposal.suggested_level}
            </span>
          </div>
          {proposal.estimated_read_time && (
            <div>
              <span className="text-stakeados-gray-400">Est. Read Time:</span>
              <span className="ml-2 text-white">
                {proposal.estimated_read_time} min
              </span>
            </div>
          )}
          {proposal.suggested_category && (
            <div>
              <span className="text-stakeados-gray-400">Category:</span>
              <span className="ml-2 text-white">
                {proposal.suggested_category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Content */}
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
          <p className="text-stakeados-gray-300 leading-relaxed">
            {proposal.summary}
          </p>
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

        {/* Previous Feedback */}
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
        <div className="p-6 border-t border-stakeados-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">
            Review Actions
          </h3>

          {!showFeedbackForm ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['approved', 'changes_requested', 'rejected'] as const).map(
                action => {
                  const config = getActionButtonConfig(action);
                  const Icon = config.icon;

                  return (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      disabled={updateStatusMutation.isPending}
                      className={`p-4 rounded-gaming border-2 border-stakeados-gray-600 transition-all hover:border-opacity-50 ${config.color}`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium mb-1">
                        {config.label}
                      </div>
                      <div className="text-xs text-stakeados-gray-400 leading-tight">
                        {config.description}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stakeados-primary">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  {selectedAction === 'changes_requested'
                    ? 'Request Changes'
                    : 'Reject Proposal'}
                </span>
              </div>

              <Textarea
                label={`Feedback ${selectedAction === 'changes_requested' ? '(Required)' : '(Optional)'}`}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={
                  selectedAction === 'changes_requested'
                    ? 'Explain what changes are needed for approval...'
                    : 'Explain why this proposal is being rejected...'
                }
                rows={4}
                error={
                  selectedAction === 'changes_requested' && !feedback.trim()
                    ? 'Feedback is required when requesting changes'
                    : undefined
                }
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setSelectedAction(null);
                    setFeedback(proposal.feedback || '');
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitWithFeedback}
                  disabled={
                    updateStatusMutation.isPending ||
                    (selectedAction === 'changes_requested' && !feedback.trim())
                  }
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {selectedAction === 'changes_requested'
                        ? 'Request Changes'
                        : 'Reject Proposal'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Message for Non-Pending Proposals */}
      {proposal.status !== 'pending' && (
        <div className="p-6 border-t border-stakeados-gray-600">
          <div className="flex items-center gap-2 text-stakeados-gray-400">
            <MessageSquare className="w-5 h-5" />
            <span>
              This proposal has been{' '}
              {(proposal.status || 'pending').replace('_', ' ')} and is no
              longer pending review.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
