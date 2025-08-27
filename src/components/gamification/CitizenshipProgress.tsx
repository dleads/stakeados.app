'use client';

import { useCitizenshipProgress } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Shield,
  CheckCircle,
  Clock,
  Target,
  Trophy,
  FileText,
  Star,
  Award,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface CitizenshipProgressProps {
  userId: string;
  showActions?: boolean;
}

export function CitizenshipProgress({
  userId,
  showActions = true,
}: CitizenshipProgressProps) {
  const { data: progress, isLoading, error } = useCitizenshipProgress(userId);
  const locale = useLocale();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load citizenship progress</p>
        </CardContent>
      </Card>
    );
  }

  const requirements = [
    {
      id: 'content_points',
      name: 'Content Points',
      description: 'Earn points through content contributions',
      current: progress.totalContentPoints,
      target: progress.requiredContentPoints,
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      id: 'articles',
      name: 'Articles Published',
      description: 'Publish high-quality articles',
      current: progress.articlesPublished,
      target: progress.requiredArticles,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'quality',
      name: 'Quality Score',
      description: 'Maintain high content quality',
      current: progress.averageQualityScore,
      target: progress.requiredQualityScore,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isDecimal: true,
    },
    {
      id: 'reviews',
      name: 'Reviews Completed',
      description: 'Help review community content',
      current: progress.reviewsCompleted,
      target: progress.requiredReviews,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const isRequirementMet = (current: number, target: number) => {
    return current >= target;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card
        className={`${progress.isEligible ? 'border-green-500 bg-green-50' : ''}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield
              className={`h-6 w-6 ${progress.isEligible ? 'text-green-600' : 'text-gray-600'}`}
            />
            <span>Citizenship NFT Progress</span>
            {progress.isEligible && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Eligible
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {progress.progressPercentage}%
                </span>
              </div>
              <Progress
                value={progress.progressPercentage}
                className={`h-3 ${progress.isEligible ? 'bg-green-100' : ''}`}
              />
            </div>

            {/* Status Message */}
            <div className="text-center">
              {progress.isEligible ? (
                <div className="text-green-700">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">
                    Congratulations! You're eligible for Citizenship NFT
                  </p>
                  <p className="text-sm">
                    You've met all the requirements for citizenship
                  </p>
                </div>
              ) : (
                <div className="text-gray-600">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">
                    Keep contributing to earn your citizenship!
                  </p>
                  <p className="text-sm">
                    Complete the requirements below to become eligible
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map(req => {
          const progressPercent = getProgressPercentage(
            req.current,
            req.target
          );
          const isMet = isRequirementMet(req.current, req.target);
          const Icon = req.icon;

          return (
            <Card
              key={req.id}
              className={`${isMet ? 'border-green-500' : req.borderColor}`}
            >
              <CardContent className="p-4">
                <div className={`${req.bgColor} rounded-lg p-4`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`p-2 rounded-full ${isMet ? 'bg-green-100' : 'bg-white'}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isMet ? 'text-green-600' : req.color}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {req.name}
                      </h3>
                      <p className="text-sm text-gray-600">{req.description}</p>
                    </div>
                    {isMet && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {req.isDecimal
                          ? `${req.current.toFixed(1)} / ${req.target.toFixed(1)}`
                          : `${req.current} / ${req.target}`}
                      </span>
                      <span className="text-sm text-gray-600">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={progressPercent}
                      className={`h-2 ${isMet ? 'bg-green-100' : ''}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Milestone */}
      {!progress.isEligible && progress.nextMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Next Milestone</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {progress.nextMilestone.requirement}
                </h3>
                <p className="text-sm text-blue-700">
                  {progress.nextMilestone.current} /{' '}
                  {progress.nextMilestone.target}
                </p>
                <p className="text-xs text-blue-600">
                  Worth {progress.nextMilestone.pointsValue} points
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {progress.nextMilestone.target -
                    progress.nextMilestone.current}
                </p>
                <p className="text-sm text-blue-700">remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {showActions && (
        <Card>
          <CardHeader>
            <CardTitle>Earn Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/${locale}/articles/propose`}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Write Article</p>
                    <p className="text-xs text-gray-500">+15 points</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href={`/${locale}/admin/proposals`}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Award className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Review Content</p>
                    <p className="text-xs text-gray-500">+5 points</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                disabled
              >
                <Star className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Quality Bonus</p>
                  <p className="text-xs text-gray-500">High engagement</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citizenship Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Citizenship Benefits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Exclusive NFT</h4>
                <p className="text-sm text-gray-600">
                  Unique citizenship NFT with special artwork
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Trophy className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Special Recognition</h4>
                <p className="text-sm text-gray-600">
                  Citizen badge on your profile and content
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Priority Access</h4>
                <p className="text-sm text-gray-600">
                  Early access to new features and content
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Award className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Governance Rights</h4>
                <p className="text-sm text-gray-600">
                  Vote on platform decisions and improvements
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CitizenshipProgressSummaryProps {
  userId: string;
  compact?: boolean;
}

export function CitizenshipProgressSummary({
  userId,
  compact = false,
}: CitizenshipProgressSummaryProps) {
  const { data: progress, isLoading } = useCitizenshipProgress(userId);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!progress) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Citizenship Progress</span>
          <span className="text-sm text-gray-600">
            {progress.progressPercentage}%
          </span>
        </div>
        <Progress value={progress.progressPercentage} className="h-2" />
        {progress.isEligible && (
          <Badge variant="default" className="bg-green-600 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Eligible for NFT
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Shield
            className={`h-5 w-5 ${progress.isEligible ? 'text-green-600' : 'text-gray-600'}`}
          />
          <div className="flex-1">
            <h3 className="font-medium">Citizenship Progress</h3>
            <p className="text-sm text-gray-600">
              {progress.progressPercentage}% complete
            </p>
          </div>
          {progress.isEligible && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Eligible
            </Badge>
          )}
        </div>

        <Progress value={progress.progressPercentage} className="mb-3" />

        {!progress.isEligible && progress.nextMilestone && (
          <p className="text-xs text-gray-500">
            Next: {progress.nextMilestone.requirement} (
            {progress.nextMilestone.target - progress.nextMilestone.current}{' '}
            remaining)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
