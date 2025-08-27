'use client';

import React, { useState } from 'react';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  type?: 'info' | 'help' | 'warning';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export default function Tooltip({
  content,
  type = 'info',
  position = 'top',
  children,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'help':
        return (
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        );
      case 'warning':
        return (
          <AlertCircle className="h-4 w-4 text-yellow-500 hover:text-yellow-600" />
        );
      default:
        return <Info className="h-4 w-4 text-blue-500 hover:text-blue-600" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: // top
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-800';
      default: // top
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
      >
        {children || getIcon()}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg">
            {content}
            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
          </div>
        </div>
      )}
    </div>
  );
}

// Predefined tooltips for common admin features
export const AdminTooltips = {
  // Article Management
  articleTitle:
    'Enter a descriptive title that clearly explains what your article is about. This will be used for SEO and social sharing.',
  articleSummary:
    'A brief summary that appears in search results and article previews. Keep it under 160 characters for optimal SEO.',
  articleSlug:
    'The URL path for your article. Use lowercase letters, numbers, and hyphens only. This affects SEO and sharing.',
  seoTitle:
    'The title that appears in search engine results. Should be 50-60 characters for optimal display.',
  metaDescription:
    'Description shown in search results. Should be compelling and 150-160 characters long.',
  featuredImage:
    'Main image for your article. Used in social sharing and article previews. Recommended size: 1200x630px.',
  autoSave:
    'Your content is automatically saved every 30 seconds. You can also save manually with Ctrl+S.',

  // News Management
  rssUrl:
    'The RSS feed URL to fetch news from. Must be a valid RSS or Atom feed.',
  fetchFrequency:
    'How often to check this source for new content. More frequent checks use more resources.',
  sourcePriority:
    'Higher priority sources are processed first. Use 1-5 scale (5 = highest priority).',
  autoPublish:
    'When enabled, high-quality processed articles are automatically published without review.',
  aiProcessing:
    'AI will translate, summarize, and categorize content from this source automatically.',

  // AI Configuration
  apiKey:
    'Your OpenAI API key. Keep this secure and never share it. Used for content processing.',
  aiModel:
    'GPT-4 provides higher quality but costs more. GPT-3.5-turbo is faster and cheaper.',
  temperature:
    'Controls AI creativity. Lower values (0.1-0.3) for consistent results, higher (0.7-1.0) for creative content.',
  maxTokens:
    'Maximum length of AI responses. Higher values allow longer content but cost more.',
  batchSize:
    'Number of articles to process simultaneously. Higher values are faster but use more API quota.',

  // Categories and Tags
  categoryColor:
    'Visual identifier for this category. Used in the interface and potentially on the frontend.',
  categoryIcon:
    'Optional icon to represent this category. Choose from available icon library.',
  parentCategory:
    'Create a hierarchy by selecting a parent category. Leave empty for top-level categories.',
  tagMerge:
    'Combine similar tags to reduce duplication and improve content organization.',

  // Analytics
  dateRange:
    'Select the time period for analytics data. Longer ranges show trends but may load slower.',
  exportFormat:
    'Choose the format for exported data. CSV for spreadsheets, PDF for reports, JSON for developers.',
  realTimeData:
    'Data updates automatically every few minutes. Refresh manually for immediate updates.',

  // User Management
  userRole:
    'Determines what actions this user can perform. Higher roles include permissions of lower roles.',
  userStatus:
    'Active users can log in and perform actions. Inactive users are blocked from the system.',
  lastLogin:
    'When this user last accessed the admin panel. Helps identify inactive accounts.',

  // System Settings
  backupFrequency:
    'How often to create automatic backups. More frequent backups provide better protection.',
  storageUsage:
    'Current storage consumption. Monitor to avoid running out of space.',
  apiUsage:
    'Current API usage and limits. Monitor to avoid service interruptions.',

  // Performance
  cacheStatus:
    'Cache improves performance by storing frequently accessed data. Clear if experiencing issues.',
  indexStatus:
    'Database indexes speed up queries. Rebuild if experiencing slow performance.',
  queueStatus: 'Background job queue status. Monitor for processing delays.',
};

// Helper component for common tooltip patterns
interface FieldTooltipProps {
  field: keyof typeof AdminTooltips;
  type?: 'info' | 'help' | 'warning';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function FieldTooltip({
  field,
  type = 'help',
  position = 'top',
  className,
}: FieldTooltipProps) {
  return (
    <Tooltip
      content={AdminTooltips[field]}
      type={type}
      position={position}
      className={className}
    />
  );
}
