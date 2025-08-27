import OpenAI from 'openai';
import { EditorialService } from './editorialService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: {
    hate: number;
    'hate/threatening': number;
    harassment: number;
    'harassment/threatening': number;
    'self-harm': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    sexual: number;
    'sexual/minors': number;
    violence: number;
    'violence/graphic': number;
  };
}

export interface ContentAnalysis {
  moderation: ModerationResult;
  quality_score: number;
  readability_score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  language_detected: string;
  word_count: number;
  potential_issues: string[];
}

export class ContentModerationService {
  /**
   * Moderate content using OpenAI's moderation API
   */
  static async moderateContent(content: string): Promise<ModerationResult> {
    try {
      const response = await openai.moderations.create({
        input: content,
      });

      return response.results[0] as ModerationResult;
    } catch (error) {
      console.error('Error moderating content:', error);
      throw new Error('Failed to moderate content');
    }
  }

  /**
   * Analyze content quality and characteristics
   */
  static async analyzeContent(
    content: string,
    title?: string
  ): Promise<ContentAnalysis> {
    try {
      const [moderation, analysis] = await Promise.all([
        this.moderateContent(content),
        this.performContentAnalysis(content, title),
      ]);

      return {
        moderation,
        ...analysis,
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Perform detailed content analysis using AI
   */
  private static async performContentAnalysis(content: string, title?: string) {
    const prompt = `
      Analyze the following content and provide a JSON response with these fields:
      - quality_score: number (1-10, overall content quality)
      - readability_score: number (1-10, how easy it is to read)
      - sentiment: string ("positive", "neutral", or "negative")
      - topics: array of strings (main topics covered)
      - language_detected: string (detected language code)
      - word_count: number (approximate word count)
      - potential_issues: array of strings (any quality or policy issues found)

      Title: ${title || 'No title provided'}
      Content: ${content.substring(0, 4000)}...

      Respond only with valid JSON.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1,
      });

      const result = response.choices[0].message.content;
      if (!result) throw new Error('No analysis result');

      return JSON.parse(result);
    } catch (error) {
      console.error('Error in content analysis:', error);
      // Return default values if AI analysis fails
      return {
        quality_score: 5,
        readability_score: 5,
        sentiment: 'neutral' as const,
        topics: [],
        language_detected: 'en',
        word_count: content.split(' ').length,
        potential_issues: [],
      };
    }
  }

  /**
   * Auto-moderate content and add to moderation queue if needed
   */
  static async autoModerateContent(
    contentId: string,
    contentType: 'article' | 'news' | 'proposal' | 'comment',
    content: string,
    title?: string
  ) {
    try {
      const analysis = await this.analyzeContent(content, title);

      // Determine if content needs moderation
      const needsModeration = this.shouldModerate(analysis);

      if (needsModeration) {
        const priority = this.calculatePriority(analysis);
        const flags = this.extractFlags(analysis);

        await EditorialService.addToModerationQueue({
          content_id: contentId,
          content_type: contentType,
          priority,
          status: 'pending',
          reason: 'ai_flagged',
          ai_confidence: this.calculateConfidence(analysis),
          ai_flags: flags,
        });

        return {
          flagged: true,
          analysis,
          priority,
          flags,
        };
      }

      return {
        flagged: false,
        analysis,
      };
    } catch (error) {
      console.error('Error in auto-moderation:', error);

      // If auto-moderation fails, add to queue for manual review
      await EditorialService.addToModerationQueue({
        content_id: contentId,
        content_type: contentType,
        priority: 'medium',
        status: 'pending',
        reason: 'manual_review',
      });

      throw error;
    }
  }

  /**
   * Determine if content should be moderated
   */
  private static shouldModerate(analysis: ContentAnalysis): boolean {
    // Flag if OpenAI moderation flagged it
    if (analysis.moderation.flagged) return true;

    // Flag if quality score is very low
    if (analysis.quality_score < 3) return true;

    // Flag if there are potential issues
    if (analysis.potential_issues.length > 0) return true;

    // Flag if sentiment is very negative (might indicate harmful content)
    if (analysis.sentiment === 'negative' && analysis.quality_score < 5)
      return true;

    return false;
  }

  /**
   * Calculate moderation priority based on analysis
   */
  private static calculatePriority(
    analysis: ContentAnalysis
  ): 'low' | 'medium' | 'high' | 'urgent' {
    // Urgent: OpenAI flagged with high confidence
    if (analysis.moderation.flagged) {
      const maxScore = Math.max(
        ...Object.values(analysis.moderation.category_scores)
      );
      if (maxScore > 0.8) return 'urgent';
      if (maxScore > 0.5) return 'high';
      return 'medium';
    }

    // High: Multiple quality issues
    if (analysis.potential_issues.length > 2) return 'high';

    // Medium: Some quality issues
    if (analysis.potential_issues.length > 0 || analysis.quality_score < 4)
      return 'medium';

    return 'low';
  }

  /**
   * Calculate AI confidence score
   */
  private static calculateConfidence(analysis: ContentAnalysis): number {
    if (analysis.moderation.flagged) {
      return Math.max(...Object.values(analysis.moderation.category_scores));
    }

    // Base confidence on quality score and issues found
    const qualityFactor = (10 - analysis.quality_score) / 10;
    const issuesFactor = Math.min(analysis.potential_issues.length / 5, 1);

    return Math.max(qualityFactor, issuesFactor);
  }

  /**
   * Extract flags from analysis
   */
  private static extractFlags(analysis: ContentAnalysis): string[] {
    const flags: string[] = [];

    // Add OpenAI moderation flags
    if (analysis.moderation.flagged) {
      Object.entries(analysis.moderation.categories).forEach(
        ([category, flagged]) => {
          if (flagged) flags.push(category);
        }
      );
    }

    // Add quality flags
    if (analysis.quality_score < 3) flags.push('low_quality');
    if (analysis.readability_score < 3) flags.push('poor_readability');
    if (analysis.word_count < 100) flags.push('too_short');
    if (analysis.word_count > 10000) flags.push('too_long');

    // Add issue flags
    flags.push(...analysis.potential_issues);

    return flags;
  }

  /**
   * Batch moderate multiple content items
   */
  static async batchModerate(
    items: Array<{
      id: string;
      type: 'article' | 'news' | 'proposal' | 'comment';
      content: string;
      title?: string;
    }>
  ) {
    const results = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(item =>
          this.autoModerateContent(item.id, item.type, item.content, item.title)
        )
      );

      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(
    _timeframe: 'day' | 'week' | 'month' = 'week'
  ) {
    // TODO: Implement when moderation_queue table is available
    console.warn(
      'Moderation stats not implemented yet - missing moderation_queue table'
    );

    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      by_reason: {},
      by_priority: {},
    };
  }

  /**
   * Clean up old moderation entries
   */
  static async cleanupOldEntries(_daysOld: number = 30) {
    // TODO: Implement when moderation_queue table is available
    console.warn(
      'Moderation cleanup not implemented yet - missing moderation_queue table'
    );
  }
}
