'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { AIContentService } from '@/lib/services/aiContentService';
import type { Article, Locale } from '@/types/content';

interface SEOScore {
  score: number;
  category: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  color: string;
}

interface SEOCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;
  maxScore: number;
  suggestions: string[];
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  count: number;
  recommended: boolean;
  positions: number[];
}

interface SEOOptimizerProps {
  article: Article;
  locale: Locale;
  onOptimize?: (optimizedData: Partial<Article>) => void;
  className?: string;
}

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  article,
  locale,
  onOptimize,
  className = '',
}) => {
  const t = useTranslations('seo');

  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [seoChecks, setSeoChecks] = useState<SEOCheck[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [overallScore, setOverallScore] = useState<SEOScore>({
    score: 0,
    category: 'poor',
    color: '#EF4444',
  });
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [generatedSuggestions, setGeneratedSuggestions] = useState<{
    title: string;
    metaDescription: string;
    keywords: string[];
  } | null>(null);

  // Perform SEO analysis
  const performSEOAnalysis = useCallback(async () => {
    try {
      setLoading(true);

      const title = article.title[currentLocale];
      const content = article.content[currentLocale];
      const metaDescription = article.meta_description[currentLocale];
      const wordCount = content
        .split(/\s+/)
        .filter(word => word.length > 0).length;

      // Initialize SEO checks
      const checks: SEOCheck[] = [];

      // Title length check
      const titleLength = title.length;
      checks.push({
        id: 'title_length',
        name: t('title_length_check'),
        description: t('title_length_description'),
        status:
          titleLength >= 30 && titleLength <= 60
            ? 'pass'
            : titleLength < 30
              ? 'warning'
              : 'fail',
        score:
          titleLength >= 30 && titleLength <= 60
            ? 10
            : titleLength < 30
              ? 5
              : 0,
        maxScore: 10,
        suggestions:
          titleLength < 30
            ? [t('title_too_short')]
            : titleLength > 60
              ? [t('title_too_long')]
              : [],
      });

      // Meta description check
      const metaLength = metaDescription.length;
      checks.push({
        id: 'meta_description',
        name: t('meta_description_check'),
        description: t('meta_description_description'),
        status:
          metaLength >= 120 && metaLength <= 160
            ? 'pass'
            : metaLength < 120
              ? 'warning'
              : 'fail',
        score:
          metaLength >= 120 && metaLength <= 160
            ? 10
            : metaLength < 120
              ? 5
              : 0,
        maxScore: 10,
        suggestions:
          metaLength < 120
            ? [t('meta_too_short')]
            : metaLength > 160
              ? [t('meta_too_long')]
              : [],
      });

      // Content length check
      checks.push({
        id: 'content_length',
        name: t('content_length_check'),
        description: t('content_length_description'),
        status:
          wordCount >= 300 ? 'pass' : wordCount >= 150 ? 'warning' : 'fail',
        score: wordCount >= 300 ? 10 : wordCount >= 150 ? 5 : 0,
        maxScore: 10,
        suggestions:
          wordCount < 300
            ? [t('content_too_short', { current: wordCount, minimum: 300 })]
            : [],
      });

      // Heading structure check
      const headings = content.match(/^#{1,6}\s.+$/gm) || [];
      const hasH1 = headings.some(h => h.startsWith('# '));
      const hasH2 = headings.some(h => h.startsWith('## '));

      checks.push({
        id: 'heading_structure',
        name: t('heading_structure_check'),
        description: t('heading_structure_description'),
        status: hasH1 && hasH2 ? 'pass' : hasH1 || hasH2 ? 'warning' : 'fail',
        score: hasH1 && hasH2 ? 10 : hasH1 || hasH2 ? 5 : 0,
        maxScore: 10,
        suggestions: !hasH1
          ? [t('missing_h1')]
          : !hasH2
            ? [t('missing_h2')]
            : [],
      });

      // Internal links check
      const internalLinks = (content.match(/\[.*?\]\(\/.*?\)/g) || []).length;
      checks.push({
        id: 'internal_links',
        name: t('internal_links_check'),
        description: t('internal_links_description'),
        status:
          internalLinks >= 2 ? 'pass' : internalLinks >= 1 ? 'warning' : 'fail',
        score: internalLinks >= 2 ? 10 : internalLinks >= 1 ? 5 : 0,
        maxScore: 10,
        suggestions: internalLinks < 2 ? [t('add_internal_links')] : [],
      });

      // External links check
      const externalLinks = (content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || [])
        .length;
      checks.push({
        id: 'external_links',
        name: t('external_links_check'),
        description: t('external_links_description'),
        status: externalLinks >= 1 ? 'pass' : 'warning',
        score: externalLinks >= 1 ? 10 : 5,
        maxScore: 10,
        suggestions: externalLinks < 1 ? [t('add_external_links')] : [],
      });

      // Image alt text check
      const images = content.match(/!\[.*?\]/g) || [];
      const imagesWithAlt = images.filter(img => img.length > 4).length; // More than just ![
      checks.push({
        id: 'image_alt_text',
        name: t('image_alt_text_check'),
        description: t('image_alt_text_description'),
        status:
          images.length === 0
            ? 'pass'
            : imagesWithAlt === images.length
              ? 'pass'
              : 'warning',
        score: images.length === 0 || imagesWithAlt === images.length ? 10 : 5,
        maxScore: 10,
        suggestions: imagesWithAlt < images.length ? [t('add_alt_text')] : [],
      });

      // Keyword analysis
      if (targetKeyword) {
        const keywordRegex = new RegExp(targetKeyword, 'gi');
        const matches = content.match(keywordRegex) || [];
        const density = (matches.length / wordCount) * 100;

        const keywordCheck: SEOCheck = {
          id: 'keyword_density',
          name: t('keyword_density_check'),
          description: t('keyword_density_description'),
          status:
            density >= 0.5 && density <= 2.5
              ? 'pass'
              : density < 0.5
                ? 'warning'
                : 'fail',
          score: density >= 0.5 && density <= 2.5 ? 10 : density < 0.5 ? 5 : 0,
          maxScore: 10,
          suggestions:
            density < 0.5
              ? [t('keyword_too_low')]
              : density > 2.5
                ? [t('keyword_too_high')]
                : [],
        };
        checks.push(keywordCheck);

        // Update keyword analysis
        setKeywordAnalysis([
          {
            keyword: targetKeyword,
            density: density,
            count: matches.length,
            recommended: density >= 0.5 && density <= 2.5,
            positions: [], // In a real implementation, this would track positions
          },
        ]);
      }

      setSeoChecks(checks);

      // Calculate overall score
      const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
      const maxTotalScore = checks.reduce(
        (sum, check) => sum + check.maxScore,
        0
      );
      const percentage = Math.round((totalScore / maxTotalScore) * 100);

      let category: SEOScore['category'] = 'poor';
      let color = '#EF4444';

      if (percentage >= 90) {
        category = 'excellent';
        color = '#10B981';
      } else if (percentage >= 75) {
        category = 'good';
        color = '#F59E0B';
      } else if (percentage >= 50) {
        category = 'needs_improvement';
        color = '#F97316';
      }

      setOverallScore({ score: percentage, category, color });
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setLoading(false);
    }
  }, [article, currentLocale, targetKeyword, t]);

  // Generate AI-powered SEO suggestions
  const generateSEOSuggestions = useCallback(async () => {
    try {
      setOptimizing(true);

      const content = article.content[currentLocale];
      const currentTitle = article.title[currentLocale];

      // Generate optimized title
      const aiService = new AIContentService();
      const optimizedTitle = await aiService.generateMetaDescription(
        currentTitle,
        content,
        currentLocale
      );

      // Generate optimized meta description
      const optimizedMeta = await aiService.generateMetaDescription(
        currentTitle,
        content,
        currentLocale
      );

      // Extract keywords
      const keywords = await aiService.extractKeywords(content);

      setGeneratedSuggestions({
        title: optimizedTitle,
        metaDescription: optimizedMeta,
        keywords: keywords.slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to generate SEO suggestions:', error);
    } finally {
      setOptimizing(false);
    }
  }, [article, currentLocale]);

  // Apply SEO optimizations
  const applySEOOptimizations = useCallback(() => {
    if (!generatedSuggestions || !onOptimize) return;

    const optimizedData: Partial<Article> = {
      title: {
        ...article.title,
        [currentLocale]: generatedSuggestions.title,
      },
      meta_description: {
        ...article.meta_description,
        [currentLocale]: generatedSuggestions.metaDescription,
      },
      tags: [...new Set([...article.tags, ...generatedSuggestions.keywords])],
    };

    onOptimize(optimizedData);
    setGeneratedSuggestions(null);
  }, [generatedSuggestions, onOptimize, article, currentLocale]);

  // Run analysis when component mounts or locale changes
  useEffect(() => {
    performSEOAnalysis();
  }, [performSEOAnalysis]);

  const getStatusIcon = (status: SEOCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'fail':
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: SEOCheck['status']) => {
    switch (status) {
      case 'pass':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Search className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('seo_optimizer')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('seo_optimizer_description')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setCurrentLocale('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setCurrentLocale('es')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'es'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ES
              </button>
            </div>

            <button
              type="button"
              onClick={performSEOAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? t('analyzing') : t('reanalyze')}
            </button>
          </div>
        </div>

        {/* Overall SEO Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                {t('overall_seo_score')}
              </h4>
              <p className="text-sm text-gray-600">{t('score_description')}</p>
            </div>

            <div className="text-right">
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: overallScore.color }}
              >
                {overallScore.score}%
              </div>
              <div className="text-sm font-medium text-gray-600">
                {t(overallScore.category)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEO Checks */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              {t('seo_checks')}
            </h4>

            <div className="space-y-3">
              {seoChecks.map(check => (
                <div
                  key={check.id}
                  className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(check.status)}

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-sm">{check.name}</h5>
                        <span className="text-xs font-medium">
                          {check.score}/{check.maxScore}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mb-2">
                        {check.description}
                      </p>

                      {check.suggestions.length > 0 && (
                        <ul className="text-xs space-y-1">
                          {check.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="text-gray-400">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Tools */}
          <div className="space-y-6">
            {/* Target Keyword */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                {t('target_keyword')}
              </h4>

              <div className="space-y-3">
                <input
                  type="text"
                  value={targetKeyword}
                  onChange={e => setTargetKeyword(e.target.value)}
                  placeholder={t('enter_target_keyword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {keywordAnalysis.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    {keywordAnalysis.map((analysis, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-sm">
                            {analysis.keyword}
                          </span>
                          <div className="text-xs text-gray-600">
                            {analysis.count} {t('occurrences')} •{' '}
                            {analysis.density.toFixed(1)}% {t('density')}
                          </div>
                        </div>

                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.recommended
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {analysis.recommended
                            ? t('optimal')
                            : t('needs_adjustment')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  {t('ai_suggestions')}
                </h4>

                <button
                  type="button"
                  onClick={generateSEOSuggestions}
                  disabled={optimizing}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <TrendingUp size={14} />
                  {optimizing ? t('generating') : t('generate_suggestions')}
                </button>
              </div>

              {generatedSuggestions && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">
                      {t('suggested_title')}
                    </h5>
                    <p className="text-sm text-blue-800 mb-3">
                      {generatedSuggestions.title}
                    </p>

                    <h5 className="font-medium text-blue-900 mb-2">
                      {t('suggested_meta')}
                    </h5>
                    <p className="text-sm text-blue-800 mb-3">
                      {generatedSuggestions.metaDescription}
                    </p>

                    <h5 className="font-medium text-blue-900 mb-2">
                      {t('suggested_keywords')}
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {generatedSuggestions.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={applySEOOptimizations}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('apply_suggestions')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                {t('quick_tips')}
              </h4>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={14}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>{t('tip_title_length')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={14}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>{t('tip_meta_description')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={14}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>{t('tip_headings')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={14}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>{t('tip_internal_links')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOOptimizer;
