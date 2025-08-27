'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  X,
  ChevronRight,
  Book,
  Video,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

interface ContextualHelpProps {
  page: string;
  section?: string;
  className?: string;
}

interface HelpContent {
  title: string;
  description: string;
  tips: string[];
  commonIssues?: {
    issue: string;
    solution: string;
  }[];
  relatedArticles?: {
    title: string;
    url: string;
  }[];
  videoTutorial?: {
    title: string;
    url: string;
    duration: string;
  };
}

const helpContentMap: Record<string, HelpContent> = {
  articles: {
    title: 'Article Management',
    description:
      'Create, edit, and manage articles with our advanced content management system.',
    tips: [
      'Use descriptive titles that include relevant keywords',
      'Add a compelling summary to improve SEO and user engagement',
      'Choose appropriate categories and tags for better discoverability',
      'Preview your article before publishing to check formatting',
      'Use the auto-save feature to prevent losing your work',
    ],
    commonIssues: [
      {
        issue: 'Article not saving',
        solution:
          'Check your internet connection and ensure you have proper permissions. The system auto-saves every 30 seconds.',
      },
      {
        issue: 'Images not uploading',
        solution:
          'Ensure images are under 5MB and in supported formats (JPG, PNG, WebP). Check your storage quota.',
      },
    ],
    relatedArticles: [
      { title: 'SEO Best Practices', url: '/help/seo-best-practices' },
      { title: 'Content Style Guide', url: '/help/content-style-guide' },
    ],
    videoTutorial: {
      title: 'Complete Article Creation Workflow',
      url: '/videos/article-creation-workflow.mp4',
      duration: '10:15',
    },
  },
  'articles/editor': {
    title: 'Article Editor',
    description:
      'Master the rich text editor to create engaging, well-formatted content.',
    tips: [
      'Use headers (H2, H3) to structure your content for better readability',
      'Add alt text to images for accessibility and SEO',
      'Use the preview function to see how your article will appear to readers',
      'Take advantage of auto-save, but manually save important changes',
      'Use internal links to connect related content on your site',
    ],
    commonIssues: [
      {
        issue: 'Formatting not working',
        solution:
          'Try refreshing the editor or switching to HTML mode temporarily. Clear browser cache if issues persist.',
      },
      {
        issue: 'Editor loading slowly',
        solution:
          'Check your internet connection. Large articles may take longer to load. Consider breaking very long articles into parts.',
      },
    ],
    videoTutorial: {
      title: 'Advanced Editor Features',
      url: '/videos/advanced-editor-features.mp4',
      duration: '8:30',
    },
  },
  news: {
    title: 'News Management',
    description:
      'Manage RSS sources and AI-processed news content efficiently.',
    tips: [
      'Configure RSS sources with appropriate fetch frequencies',
      'Review AI-processed content before publishing',
      'Set up duplicate detection to avoid redundant content',
      'Use category mapping to automatically organize news',
      'Monitor processing status to catch issues early',
    ],
    commonIssues: [
      {
        issue: 'RSS feed not updating',
        solution:
          'Check if the RSS URL is valid and accessible. Verify fetch frequency settings and source status.',
      },
      {
        issue: 'AI processing failing',
        solution:
          "Verify your OpenAI API key is valid and you haven't exceeded rate limits. Check processing logs for details.",
      },
    ],
    relatedArticles: [
      { title: 'RSS Source Configuration', url: '/help/rss-configuration' },
      { title: 'AI Processing Guide', url: '/help/ai-processing' },
    ],
    videoTutorial: {
      title: 'AI News Processing Deep Dive',
      url: '/videos/ai-news-processing.mp4',
      duration: '15:20',
    },
  },
  categories: {
    title: 'Category Management',
    description:
      'Organize your content with a well-structured category hierarchy.',
    tips: [
      'Create a logical hierarchy that makes sense to your users',
      'Use descriptive names that clearly indicate the category purpose',
      'Assign colors and icons to make categories visually distinct',
      'Regularly review category usage and merge underused categories',
      'Set up automatic categorization rules for efficiency',
    ],
    commonIssues: [
      {
        issue: 'Cannot delete category',
        solution:
          'Categories with existing content cannot be deleted. Move content to another category first, or archive the category.',
      },
    ],
    relatedArticles: [
      {
        title: 'Content Organization Best Practices',
        url: '/help/content-organization',
      },
    ],
  },
  analytics: {
    title: 'Analytics Dashboard',
    description:
      'Understand your content performance with comprehensive analytics.',
    tips: [
      'Use date range filters to analyze specific time periods',
      'Compare different content types to understand what works best',
      'Export data for deeper analysis in external tools',
      'Set up automated reports for regular monitoring',
      'Focus on engagement metrics, not just view counts',
    ],
    commonIssues: [
      {
        issue: 'Data not updating',
        solution:
          'Analytics data updates every few minutes. For real-time data, use the refresh button. Check if tracking is properly configured.',
      },
    ],
    videoTutorial: {
      title: 'Understanding Analytics',
      url: '/videos/analytics-overview.mp4',
      duration: '12:45',
    },
  },
  settings: {
    title: 'System Settings',
    description:
      'Configure system-wide settings for optimal performance and functionality.',
    tips: [
      'Regularly backup your configuration settings',
      'Test changes in a staging environment first',
      'Monitor system performance after configuration changes',
      'Keep API keys secure and rotate them regularly',
      'Document any custom configurations for your team',
    ],
    commonIssues: [
      {
        issue: 'Settings not saving',
        solution:
          'Ensure you have admin permissions and check for validation errors. Some settings require system restart to take effect.',
      },
    ],
    relatedArticles: [
      { title: 'Security Best Practices', url: '/help/security-practices' },
      {
        title: 'Performance Optimization',
        url: '/help/performance-optimization',
      },
    ],
  },
};

export default function ContextualHelp({
  page,
  section,
  className = '',
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [helpContent, setHelpContent] = useState<HelpContent | null>(null);

  useEffect(() => {
    const key = section ? `${page}/${section}` : page;
    const content = helpContentMap[key] || helpContentMap[page];
    setHelpContent(content);
  }, [page, section]);

  if (!helpContent) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{helpContent.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            {helpContent.description}
          </p>

          {/* Tips Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-sm">Quick Tips</span>
            </div>
            <ul className="space-y-1">
              {helpContent.tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Issues */}
          {helpContent.commonIssues && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-sm">Common Issues</span>
              </div>
              <div className="space-y-2">
                {helpContent.commonIssues.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-gray-800">
                      {item.issue}
                    </div>
                    <div className="text-gray-600 mt-1">{item.solution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Tutorial */}
          {helpContent.videoTutorial && (
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm text-blue-800">
                      {helpContent.videoTutorial.title}
                    </div>
                    <div className="text-xs text-blue-600">
                      {helpContent.videoTutorial.duration}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                >
                  Watch
                </Button>
              </div>
            </div>
          )}

          {/* Related Articles */}
          {helpContent.relatedArticles && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Book className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Related Articles</span>
              </div>
              <div className="space-y-1">
                {helpContent.relatedArticles.map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                  >
                    <span>{article.title}</span>
                    <ChevronRight className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
              onClick={() => {
                // Open full help system
                setIsOpen(false);
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Open Full Help Center
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for programmatic help content
export function useContextualHelp(page: string, section?: string) {
  const key = section ? `${page}/${section}` : page;
  const content = helpContentMap[key] || helpContentMap[page];

  return {
    content,
    hasHelp: !!content,
    getTips: () => content?.tips || [],
    getCommonIssues: () => content?.commonIssues || [],
    getVideoTutorial: () => content?.videoTutorial,
    getRelatedArticles: () => content?.relatedArticles || [],
  };
}
