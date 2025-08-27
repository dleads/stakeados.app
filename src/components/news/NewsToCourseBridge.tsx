'use client';

import React from 'react';

import { BookOpen, ArrowRight, Star, Clock, Target } from 'lucide-react';
import { Link } from '@/lib/utils/navigation';

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number;
  relevanceScore: number;
  category: string;
}

interface NewsToCourseBridgeProps {
  newsKeywords: string[];
  className?: string;
}

export default function NewsToCourseBridge({
  newsKeywords,
  className = '',
}: NewsToCourseBridgeProps) {
  // Mock course recommendations based on news content
  const getCourseRecommendations = (): CourseRecommendation[] => {
    const recommendations: CourseRecommendation[] = [];

    // DeFi related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('defi'))) {
      recommendations.push({
        id: 'defi-fundamentals',
        title: 'DeFi Fundamentals',
        description:
          'Learn the basics of Decentralized Finance, including lending, borrowing, and yield farming.',
        difficulty: 'intermediate',
        estimatedTime: 120,
        relevanceScore: 95,
        category: 'DeFi',
      });
    }

    // NFT related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('nft'))) {
      recommendations.push({
        id: 'nft-technology',
        title: 'NFT Technology & Applications',
        description:
          'Understand Non-Fungible Tokens beyond digital art - utility, gaming, and real-world applications.',
        difficulty: 'basic',
        estimatedTime: 90,
        relevanceScore: 88,
        category: 'NFTs',
      });
    }

    // Bitcoin related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('bitcoin'))) {
      recommendations.push({
        id: 'bitcoin-basics',
        title: 'Bitcoin Fundamentals',
        description:
          'Master the fundamentals of Bitcoin, from basic concepts to advanced technical analysis.',
        difficulty: 'basic',
        estimatedTime: 150,
        relevanceScore: 92,
        category: 'Bitcoin',
      });
    }

    // Ethereum related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('ethereum'))) {
      recommendations.push({
        id: 'ethereum-development',
        title: 'Ethereum Smart Contract Development',
        description:
          'Learn to build and deploy smart contracts on Ethereum using Solidity.',
        difficulty: 'advanced',
        estimatedTime: 200,
        relevanceScore: 90,
        category: 'Ethereum',
      });
    }

    // Layer2 related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('layer'))) {
      recommendations.push({
        id: 'layer2-scaling',
        title: 'Layer 2 Scaling Solutions',
        description:
          'Explore Layer 2 solutions like Base, Arbitrum, and Optimism for Ethereum scaling.',
        difficulty: 'intermediate',
        estimatedTime: 100,
        relevanceScore: 85,
        category: 'Layer2',
      });
    }

    // Web3 related courses
    if (newsKeywords.some(k => k.toLowerCase().includes('web3'))) {
      recommendations.push({
        id: 'web3-fundamentals',
        title: 'Web3 Fundamentals',
        description:
          'Introduction to Web3 concepts, decentralized applications, and the future of the internet.',
        difficulty: 'basic',
        estimatedTime: 80,
        relevanceScore: 87,
        category: 'Web3',
      });
    }

    // Sort by relevance score and return top 3
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  };

  const recommendations = getCourseRecommendations();

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30';
      case 'intermediate':
        return 'bg-stakeados-blue/20 text-stakeados-blue border-stakeados-blue/30';
      case 'advanced':
        return 'bg-stakeados-purple/20 text-stakeados-purple border-stakeados-purple/30';
      default:
        return 'bg-stakeados-gray-700 text-stakeados-gray-300 border-stakeados-gray-600';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-stakeados-primary" />
          <h3 className="text-xl font-bold text-neon">Continue Learning</h3>
        </div>

        <p className="text-stakeados-gray-300 mb-6">
          Expand your knowledge with our comprehensive course library covering
          all aspects of blockchain and cryptocurrency.
        </p>

        <Link href="/courses" className="btn-primary">
          <BookOpen className="w-4 h-4 mr-2" />
          Browse All Courses
        </Link>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-stakeados-primary" />
        <h3 className="text-xl font-bold text-neon">Related Learning</h3>
      </div>

      <p className="text-stakeados-gray-300 mb-6">
        Deepen your understanding of this topic with these recommended courses:
      </p>

      <div className="space-y-4">
        {recommendations.map(course => (
          <div
            key={course.id}
            className="p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getDifficultyBadgeClass(course.difficulty)}`}
                  >
                    {course.difficulty.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-stakeados-orange/20 text-stakeados-orange rounded text-xs font-semibold">
                    {course.relevanceScore}% MATCH
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white group-hover:text-stakeados-primary transition-colors mb-2">
                  {course.title}
                </h4>

                <p className="text-stakeados-gray-300 text-sm mb-3">
                  {course.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-stakeados-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor(course.estimatedTime / 60)}h{' '}
                      {course.estimatedTime % 60}m
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{course.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{course.relevanceScore}% relevant</span>
                  </div>
                </div>
              </div>

              <Link href={`/courses/${course.id}`} className="btn-ghost ml-4">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-stakeados-gray-700">
        <Link href="/courses" className="btn-secondary w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Explore All Courses
        </Link>
      </div>
    </div>
  );
}
