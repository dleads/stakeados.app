'use client';

import React, { useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';

interface ContributionWorkflowProps {
  className?: string;
}

export default function ContributionWorkflow({
  className = '',
}: ContributionWorkflowProps) {
  const { user, profile } = useAuthContext();

  const [userArticles] = useState<any[]>([]);
  const [isLoading] = useState(false);

  const getContributorLevel = () => {
    const publishedCount = userArticles.filter(
      a => a.status === 'published'
    ).length;
    if (publishedCount >= 10)
      return { level: 'Expert', color: 'text-stakeados-purple', icon: '🏆' };
    if (publishedCount >= 5)
      return { level: 'Advanced', color: 'text-stakeados-blue', icon: '⭐' };
    if (publishedCount >= 1)
      return {
        level: 'Contributor',
        color: 'text-stakeados-primary',
        icon: '✨',
      };
    return { level: 'Newcomer', color: 'text-stakeados-gray-300', icon: '🌱' };
  };

  const contributorLevel = getContributorLevel();

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-stakeados-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stakeados-gray-300">
            Loading your contribution data...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Join the Community
          </h3>
          <p className="text-stakeados-gray-400 mb-6">
            Sign in to start contributing articles and earn recognition
          </p>
          <button className="btn-primary">Sign In to Contribute</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contributor Status */}
      <div className="card-highlight">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{contributorLevel.icon}</div>
            <div>
              <h3 className="text-xl font-bold text-neon">
                Contributor Status
              </h3>
              <p className={`font-semibold ${contributorLevel.color}`}>
                {contributorLevel.level}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-stakeados-primary">
              {profile?.total_points || 0}
            </div>
            <div className="text-sm text-stakeados-gray-300">Total Points</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-lg font-bold text-white">
              {userArticles.length}
            </div>
            <div className="text-xs text-stakeados-gray-300">
              Total Articles
            </div>
          </div>
          <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-lg font-bold text-stakeados-primary">
              {userArticles.filter(a => a.status === 'published').length}
            </div>
            <div className="text-xs text-stakeados-gray-300">Published</div>
          </div>
          <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-lg font-bold text-stakeados-yellow">
              {userArticles.filter(a => a.status === 'review').length}
            </div>
            <div className="text-xs text-stakeados-gray-300">Under Review</div>
          </div>
          <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-lg font-bold text-stakeados-gray-400">
              {userArticles.filter(a => a.status === 'draft').length}
            </div>
            <div className="text-xs text-stakeados-gray-300">Drafts</div>
          </div>
        </div>
      </div>

      {/* Contribution Workflow Steps */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-6">
          Contribution Workflow
        </h3>

        <div className="space-y-4">
          {/* Step 1: Create */}
          <div className="flex items-start gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="w-8 h-8 bg-stakeados-primary rounded-full flex items-center justify-center text-stakeados-dark font-bold">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">Create Article</h4>
              <p className="text-stakeados-gray-300 text-sm mb-3">
                Write your article with valuable insights about Web3,
                blockchain, or cryptocurrency.
              </p>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-stakeados-primary" />
                <span className="text-sm text-stakeados-primary">
                  Draft Status
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Submit */}
          <div className="flex items-start gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="w-8 h-8 bg-stakeados-yellow rounded-full flex items-center justify-center text-stakeados-dark font-bold">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">
                Submit for Review
              </h4>
              <p className="text-stakeados-gray-300 text-sm mb-3">
                Submit your completed article for community review and quality
                assurance.
              </p>
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-stakeados-yellow" />
                <span className="text-sm text-stakeados-yellow">
                  Under Review
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Review */}
          <div className="flex items-start gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="w-8 h-8 bg-stakeados-blue rounded-full flex items-center justify-center text-stakeados-dark font-bold">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">
                Community Review
              </h4>
              <p className="text-stakeados-gray-300 text-sm mb-3">
                Our team reviews your article for quality, accuracy, and
                community value.
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-blue" />
                <span className="text-sm text-stakeados-blue">
                  Review Process
                </span>
              </div>
            </div>
          </div>

          {/* Step 4: Publish */}
          <div className="flex items-start gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="w-8 h-8 bg-stakeados-primary rounded-full flex items-center justify-center text-stakeados-dark font-bold">
              4
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">
                Publication & Rewards
              </h4>
              <p className="text-stakeados-gray-300 text-sm mb-3">
                Approved articles are published and you earn points and
                community recognition.
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                <span className="text-sm text-stakeados-primary">
                  Published
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards & Recognition */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-6">
          Rewards & Recognition
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Points System */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Points System
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-stakeados-gray-300">
                  Article Published:
                </span>
                <span className="text-stakeados-primary font-semibold">
                  +5 points
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-stakeados-gray-300">
                  High-Quality Article:
                </span>
                <span className="text-stakeados-blue font-semibold">
                  +10 points
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-stakeados-gray-300">
                  Featured Article:
                </span>
                <span className="text-stakeados-yellow font-semibold">
                  +20 points
                </span>
              </div>
            </div>
          </div>

          {/* Recognition Levels */}
          <div className="space-y-4">
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Recognition Levels
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-2xl">🌱</span>
                <div>
                  <div className="font-semibold text-white">Newcomer</div>
                  <div className="text-xs text-stakeados-gray-400">
                    0 published articles
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-stakeados-primary">
                    Contributor
                  </div>
                  <div className="text-xs text-stakeados-gray-400">
                    1+ published articles
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="font-semibold text-stakeados-blue">
                    Advanced
                  </div>
                  <div className="text-xs text-stakeados-gray-400">
                    5+ published articles
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-semibold text-stakeados-purple">
                    Expert
                  </div>
                  <div className="text-xs text-stakeados-gray-400">
                    10+ published articles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Sharing (Future Feature) */}
      <div className="card-gaming">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-stakeados-yellow" />
          <h3 className="text-xl font-bold text-neon">
            Revenue Sharing Program
          </h3>
          <span className="px-2 py-1 bg-stakeados-yellow/20 text-stakeados-yellow text-xs rounded border border-stakeados-yellow/30">
            COMING SOON
          </span>
        </div>

        <p className="text-stakeados-gray-300 mb-4">
          In the future, high-quality contributors will be able to monetize
          their content and earn revenue from premium articles and courses.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming opacity-60">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-stakeados-yellow">
                Premium Content
              </div>
              <div className="text-xs text-stakeados-gray-400 mt-1">
                Monetize advanced tutorials
              </div>
            </div>
          </div>
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming opacity-60">
            <div className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-stakeados-blue">
                Course Creation
              </div>
              <div className="text-xs text-stakeados-gray-400 mt-1">
                Create paid courses
              </div>
            </div>
          </div>
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming opacity-60">
            <div className="text-center">
              <div className="text-2xl mb-2">🤝</div>
              <div className="font-semibold text-stakeados-purple">
                Revenue Split
              </div>
              <div className="text-xs text-stakeados-gray-400 mt-1">
                70/30 creator/platform split
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-4">
          Community Guidelines
        </h3>

        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-stakeados-primary font-semibold mb-3">
                ✅ Do's
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• Write original, high-quality content</li>
                <li>• Provide practical examples and code</li>
                <li>• Use proper formatting and structure</li>
                <li>• Include relevant tags and categories</li>
                <li>• Fact-check your information</li>
                <li>• Engage respectfully with feedback</li>
              </ul>
            </div>

            <div>
              <h4 className="text-stakeados-red font-semibold mb-3">
                ❌ Don'ts
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• Plagiarize or copy content</li>
                <li>• Promote scams or unsafe practices</li>
                <li>• Use offensive or inappropriate language</li>
                <li>• Submit low-effort or spam content</li>
                <li>• Violate copyright or licensing</li>
                <li>• Share financial advice without disclaimers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        <button className="btn-primary flex-1">
          <FileText className="w-4 h-4 mr-2" />
          Write New Article
        </button>
        <button className="btn-secondary">
          <TrendingUp className="w-4 h-4 mr-2" />
          View My Articles
        </button>
      </div>
    </div>
  );
}
