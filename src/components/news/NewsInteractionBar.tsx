'use client';

import React, { useState } from 'react';

import { copyToClipboard } from '@/lib/utils';
import {
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Eye,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Check,
} from 'lucide-react';

interface NewsInteractionBarProps {
  articleId: string;
  title: string;
  summary: string;
  url?: string;
  initialLikes?: number;
  initialBookmarks?: number;
  initialViews?: number;
  onLike?: (articleId: string) => void;
  onBookmark?: (articleId: string) => void;
  onShare?: (articleId: string, platform: string) => void;
  className?: string;
}

export default function NewsInteractionBar({
  articleId,
  title,
  summary,
  url,
  initialLikes = 0,
  initialBookmarks = 0,
  initialViews = 0,
  onLike,
  onBookmark,
  onShare,
  className = '',
}: NewsInteractionBarProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);

  const currentUrl = url || window.location.href;
  const shareText = `${title} - ${summary.substring(0, 100)}...`;

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev => (newLikedState ? prev + 1 : prev - 1));
    onLike?.(articleId);
  };

  const handleBookmark = () => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    setBookmarks(prev => (newBookmarkedState ? prev + 1 : prev - 1));
    onBookmark?.(articleId);
  };

  const handleShare = async (
    platform?: 'twitter' | 'facebook' | 'linkedin' | 'copy'
  ) => {
    if (platform) {
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
            '_blank'
          );
          break;
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
            '_blank'
          );
          break;
        case 'copy':
          const success = await copyToClipboard(currentUrl);
          if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          }
          break;
      }
      onShare?.(articleId, platform);
      setShareMenuOpen(false);
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: summary,
            url: currentUrl,
          });
          onShare?.(articleId, 'native');
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        setShareMenuOpen(!shareMenuOpen);
      }
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 bg-stakeados-gray-800 rounded-gaming ${className}`}
    >
      {/* Left side - Interaction buttons */}
      <div className="flex items-center gap-4">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
            isLiked
              ? 'text-stakeados-red bg-stakeados-red/10'
              : 'text-stakeados-gray-400 hover:text-stakeados-red hover:bg-stakeados-red/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likes}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
            isBookmarked
              ? 'text-stakeados-yellow bg-stakeados-yellow/10'
              : 'text-stakeados-gray-400 hover:text-stakeados-yellow hover:bg-stakeados-yellow/10'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`}
          />
          <span className="text-sm font-medium">{bookmarks}</span>
        </button>

        {/* Comments (placeholder) */}
        <button className="flex items-center gap-2 px-3 py-2 text-stakeados-gray-400 hover:text-stakeados-blue hover:bg-stakeados-blue/10 rounded-gaming transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">0</span>
        </button>
      </div>

      {/* Right side - Views and Share */}
      <div className="flex items-center gap-4">
        {/* Views */}
        <div className="flex items-center gap-2 text-stakeados-gray-400">
          <Eye className="w-4 h-4" />
          <span className="text-sm">{initialViews.toLocaleString()} views</span>
        </div>

        {/* Share */}
        <div className="relative">
          <button
            onClick={() => handleShare()}
            className="flex items-center gap-2 px-3 py-2 text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Share Menu */}
          {shareMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg z-10 min-w-[200px]">
              <div className="p-2">
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Share on Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Share on Facebook
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  Share on LinkedIn
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
