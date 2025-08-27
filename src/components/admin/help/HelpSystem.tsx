'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  Book,
  Video,
  MessageCircle,
  Search,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  lastUpdated: string;
  rating: number;
  videoUrl?: string;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'article-creation',
    title: 'Creating Your First Article',
    content: `Learn how to create engaging articles using our advanced editor. This guide covers everything from basic formatting to SEO optimization.

## Getting Started
1. Navigate to Articles > Create New Article
2. Fill in the basic information (title, summary)
3. Use the rich text editor to create your content
4. Optimize for SEO with meta tags and descriptions
5. Choose appropriate categories and tags
6. Preview and publish your article

## Best Practices
- Write compelling headlines that grab attention
- Use headers to structure your content
- Include relevant images with alt text
- Optimize for search engines
- Preview before publishing`,
    category: 'Content Management',
    tags: ['articles', 'editor', 'publishing'],
    difficulty: 'beginner',
    estimatedTime: 5,
    lastUpdated: '2024-01-15',
    rating: 4.8,
    videoUrl: '/videos/article-creation-workflow.mp4',
  },
  {
    id: 'ai-news-processing',
    title: 'Understanding AI News Processing',
    content: `Our AI system automatically processes news from RSS feeds, providing translation, summarization, and categorization.

## How It Works
The AI processing pipeline includes:
- Content fetching from RSS sources
- Language detection and translation
- Automatic summarization
- Category suggestion
- Duplicate detection
- Relevance scoring

## Configuration
Access AI settings through Settings > AI Processing to:
- Configure OpenAI API settings
- Adjust processing parameters
- Set quality thresholds
- Monitor usage and costs

## Review Process
All AI-processed content goes through a review queue where you can:
- Approve high-quality content
- Edit and improve AI suggestions
- Reject irrelevant content
- Provide feedback for improvement`,
    category: 'News Management',
    tags: ['ai', 'news', 'automation'],
    difficulty: 'intermediate',
    estimatedTime: 10,
    lastUpdated: '2024-01-20',
    rating: 4.6,
    videoUrl: '/videos/ai-news-processing.mp4',
  },
  {
    id: 'analytics-dashboard',
    title: 'Understanding Analytics and Reports',
    content: `The analytics dashboard provides comprehensive insights into your content performance and user engagement.

## Key Metrics
- **Content Performance**: Views, engagement, shares
- **Author Productivity**: Articles per author, performance
- **Category Analysis**: Popular categories, engagement
- **Traffic Sources**: Where readers come from
- **Trending Content**: Most popular articles and news

## Custom Reports
Create custom reports by:
1. Selecting date ranges
2. Filtering by content type
3. Choosing specific metrics
4. Exporting in various formats

## Automated Reports
Set up automated reports to be delivered via email on a schedule.`,
    category: 'Analytics',
    tags: ['analytics', 'reports', 'metrics'],
    difficulty: 'intermediate',
    estimatedTime: 8,
    lastUpdated: '2024-01-18',
    rating: 4.7,
  },
];

const videoTutorials: VideoTutorial[] = [
  {
    id: 'admin-overview',
    title: 'Admin Panel Overview',
    description: 'Get familiar with the admin interface and navigation',
    duration: '5:30',
    difficulty: 'beginner',
    thumbnailUrl: '/thumbnails/admin-overview.jpg',
    videoUrl: '/videos/admin-overview.mp4',
    category: 'Getting Started',
  },
  {
    id: 'article-workflow',
    title: 'Complete Article Creation Workflow',
    description: 'Learn the entire process from creation to publication',
    duration: '10:15',
    difficulty: 'beginner',
    thumbnailUrl: '/thumbnails/article-workflow.jpg',
    videoUrl: '/videos/article-workflow.mp4',
    category: 'Content Management',
  },
  {
    id: 'ai-processing',
    title: 'AI News Processing Deep Dive',
    description: 'Master AI-powered news processing and review',
    duration: '15:20',
    difficulty: 'intermediate',
    thumbnailUrl: '/thumbnails/ai-processing.jpg',
    videoUrl: '/videos/ai-processing.mp4',
    category: 'News Management',
  },
];

const faqs: FAQ[] = [
  {
    id: 'login-issues',
    question: 'I cannot access the admin panel. What should I do?',
    answer: `If you're having trouble logging in:
1. Verify your credentials are correct
2. Check if your account is active
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Contact your system administrator if issues persist`,
    category: 'Account & Access',
    helpful: 45,
  },
  {
    id: 'content-not-saving',
    question: 'My articles are not saving. How can I fix this?',
    answer: `If content isn't saving:
1. Check your internet connection
2. Verify you have sufficient permissions
3. Try refreshing the page
4. Check browser console for errors
5. The system auto-saves every 30 seconds, so recent changes should be preserved`,
    category: 'Content Management',
    helpful: 32,
  },
  {
    id: 'ai-processing-failed',
    question: 'Why is AI processing failing for my news articles?',
    answer: `AI processing failures can occur due to:
1. Invalid or expired API keys
2. Rate limit exceeded
3. Poor source content quality
4. Network connectivity issues
5. Check the AI processing monitor for detailed error messages`,
    category: 'News Management',
    helpful: 28,
  },
];

export default function HelpSystem() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredArticles, setFilteredArticles] = useState(helpArticles);
  const [filteredFAQs, setFilteredFAQs] = useState(faqs);

  useEffect(() => {
    let filtered = helpArticles;

    if (searchQuery) {
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        article => article.category === selectedCategory
      );
    }

    setFilteredArticles(filtered);

    // Filter FAQs
    let filteredFAQList = faqs;
    if (searchQuery) {
      filteredFAQList = filteredFAQList.filter(
        faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredFAQs(filteredFAQList);
  }, [searchQuery, selectedCategory]);

  const categories = [
    'all',
    ...Array.from(new Set(helpArticles.map(article => article.category))),
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Admin Help Center
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles, tutorials, and FAQs..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="articles" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            {/* Help Articles */}
            <TabsContent value="articles" className="overflow-y-auto max-h-96">
              <div className="space-y-4">
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getDifficultyColor(article.difficulty)}
                        >
                          {article.difficulty}
                        </Badge>
                        {article.videoUrl && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Video className="h-3 w-3" />
                            Video
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.estimatedTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {article.rating}/5
                      </span>
                      <span>Updated {article.lastUpdated}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-gray-700 mb-3">
                      {article.content.split('\n')[0].substring(0, 150)}...
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        Read More
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      {article.videoUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Video className="h-3 w-3" />
                          Watch Video
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Video Tutorials */}
            <TabsContent value="videos" className="overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoTutorials.map(video => (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{video.title}</h3>
                        <Badge className={getDifficultyColor(video.difficulty)}>
                          {video.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {video.category}
                        </span>
                        <Button size="sm" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="overflow-y-auto max-h-96">
              <div className="space-y-4">
                {filteredFAQs.map(faq => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <div className="text-gray-700 whitespace-pre-line mb-3">
                      {faq.answer}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {faq.category}
                      </span>
                      <span>{faq.helpful} people found this helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Need more help? Contact our support team
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
