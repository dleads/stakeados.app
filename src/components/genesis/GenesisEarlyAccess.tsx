'use client';

import React, { useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { formatDate } from '@/lib/utils';
import {
  Zap,
  Lock,
  Star,
  Calendar,
  Users,
  BookOpen,
  Newspaper,
  Settings,
  Crown,
  Eye,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface EarlyAccessFeature {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'course' | 'content' | 'tool';
  status: 'available' | 'coming_soon' | 'beta';
  releaseDate: string;
  icon: React.ReactNode;
  benefits: string[];
}

interface GenesisEarlyAccessProps {
  className?: string;
}

export default function GenesisEarlyAccess({
  className = '',
}: GenesisEarlyAccessProps) {
  const { isGenesisHolder, isAuthenticated } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'available' | 'coming_soon'>(
    'available'
  );

  // Mock early access features - in production this would come from a CMS or database
  const earlyAccessFeatures: EarlyAccessFeature[] = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30';
      case 'beta':
        return 'bg-stakeados-blue/20 text-stakeados-blue border-stakeados-blue/30';
      case 'coming_soon':
        return 'bg-stakeados-yellow/20 text-stakeados-yellow border-stakeados-yellow/30';
      default:
        return 'bg-stakeados-gray-700 text-stakeados-gray-300 border-stakeados-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Settings className="w-4 h-4" />;
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'content':
        return <Newspaper className="w-4 h-4" />;
      case 'tool':
        return <Star className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const availableFeatures = earlyAccessFeatures.filter(
    f => f.status === 'available' || f.status === 'beta'
  );
  const comingSoonFeatures = earlyAccessFeatures.filter(
    f => f.status === 'coming_soon'
  );

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to view early access features
          </p>
        </div>
      </div>
    );
  }

  if (!isGenesisHolder) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Genesis Access Required
          </h3>
          <p className="text-stakeados-gray-400 mb-6">
            Early access features are exclusive to Genesis community members
          </p>
          <button className="btn-primary">Learn About Genesis</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Zap className="w-12 h-12 text-stakeados-primary" />
          <h2 className="text-3xl font-bold text-neon">Genesis Early Access</h2>
        </div>
        <p className="text-xl text-stakeados-gray-300">
          Exclusive features and content for Genesis community members
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-primary mb-1">
            {availableFeatures.length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Available Now</div>
        </div>
        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-yellow mb-1">
            {comingSoonFeatures.length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Coming Soon</div>
        </div>
        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-blue mb-1">
            {earlyAccessFeatures.filter(f => f.status === 'beta').length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Beta Features</div>
        </div>
        <div className="card-primary text-center">
          <div className="text-2xl font-bold text-stakeados-purple mb-1">
            30min
          </div>
          <div className="text-sm text-stakeados-gray-300">Early Access</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-6 py-3 rounded-gaming font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-stakeados-primary text-stakeados-dark'
              : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-2 inline" />
          Available Now ({availableFeatures.length})
        </button>
        <button
          onClick={() => setActiveTab('coming_soon')}
          className={`px-6 py-3 rounded-gaming font-medium transition-colors ${
            activeTab === 'coming_soon'
              ? 'bg-stakeados-yellow text-stakeados-dark'
              : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
          }`}
        >
          <Clock className="w-4 h-4 mr-2 inline" />
          Coming Soon ({comingSoonFeatures.length})
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(activeTab === 'available'
          ? availableFeatures
          : comingSoonFeatures
        ).map(feature => (
          <div
            key={feature.id}
            className="card-primary hover:card-highlight transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-gaming ${
                    feature.status === 'available'
                      ? 'bg-stakeados-primary/20'
                      : feature.status === 'beta'
                        ? 'bg-stakeados-blue/20'
                        : 'bg-stakeados-yellow/20'
                  }`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-stakeados-primary transition-colors">
                    {feature.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(feature.status)}`}
                    >
                      {feature.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-stakeados-gray-400">
                      {getTypeIcon(feature.type)}
                      <span>{feature.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-stakeados-gray-300 mb-4">
              {feature.description}
            </p>

            <div className="mb-4">
              <h4 className="font-semibold text-stakeados-primary mb-2">
                Benefits:
              </h4>
              <ul className="space-y-1">
                {feature.benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="text-sm text-stakeados-gray-300 flex items-center gap-2"
                  >
                    <Star className="w-3 h-3 text-stakeados-yellow flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stakeados-gray-700">
              <div className="flex items-center gap-2 text-sm text-stakeados-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {feature.status === 'available'
                    ? 'Available since'
                    : 'Expected'}{' '}
                  {formatDate(feature.releaseDate)}
                </span>
              </div>

              {feature.status === 'available' ? (
                <button className="btn-primary">
                  <Eye className="w-4 h-4 mr-2" />
                  Access Now
                </button>
              ) : feature.status === 'beta' ? (
                <button className="btn-secondary">
                  <Zap className="w-4 h-4 mr-2" />
                  Join Beta
                </button>
              ) : (
                <button className="btn-ghost" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Early Access Benefits */}
      <div className="card-gaming">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-6 h-6 text-stakeados-yellow" />
          <h3 className="text-xl font-bold text-neon">
            Genesis Early Access Benefits
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Immediate Benefits
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                Access to all beta features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                30-minute early news access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                Exclusive Genesis courses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                Advanced analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                Priority customer support
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Future Benefits
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-yellow" />
                Governance platform access
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-yellow" />
                NFT marketplace privileges
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-yellow" />
                Revenue sharing opportunities
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-yellow" />
                Exclusive partnership access
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stakeados-yellow" />
                Advanced AI features
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">
          Genesis Feedback Channel
        </h3>
        <p className="text-stakeados-gray-300 mb-4">
          As a Genesis member, your feedback shapes the future of Stakeados.
          Share your thoughts on new features and help us prioritize
          development.
        </p>
        <div className="flex items-center gap-4">
          <button className="btn-primary">
            <Star className="w-4 h-4 mr-2" />
            Submit Feedback
          </button>
          <button className="btn-secondary">
            <Users className="w-4 h-4 mr-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
