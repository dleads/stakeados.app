// AI Content Processing Service - OpenAI integration for content processing

import OpenAI from 'openai';
import type { AIProcessingResult, Article, Locale } from '@/types/content';

export class AIContentService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Article Processing Methods
  async summarizeArticle(
    content: string,
    targetLength: number = 150,
    locale: Locale = 'en'
  ): Promise<string> {
    const language = locale === 'es' ? 'Spanish' : 'English';

    const prompt = `
      Summarize the following article in ${language}.
      Target length: ${targetLength} words.
      Focus on key insights and actionable information.
      Make it engaging and informative for readers interested in blockchain and cryptocurrency.
      
      Article: ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: targetLength * 2,
        temperature: 0.3,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Failed to summarize article:', error);
      throw new Error(
        `AI summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // News Processing Methods
  async processNewsArticle(
    title: string,
    content: string,
    _sourceUrl: string,
    _sourceName: string,
    locale: Locale = 'en'
  ): Promise<{
    summary: Record<Locale, string>;
    categories: string[];
    keywords: string[];
    relevanceScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    translatedContent?: Record<Locale, string>;
  }> {
    try {
      // Process in parallel for efficiency
      const [
        summary,
        categories,
        keywords,
        relevanceScore,
        sentiment,
        translation,
      ] = await Promise.all([
        this.generateNewsSummary(content, locale),
        this.categorizeNewsContent(title, content),
        this.extractNewsKeywords(title, content),
        this.calculateRelevanceScore(title, content),
        this.analyzeSentiment(content),
        locale === 'en'
          ? this.translateToSpanish(title, content)
          : this.translateToEnglish(title, content),
      ]);

      return {
        summary:
          locale === 'en'
            ? { en: summary, es: translation.summary }
            : { es: summary, en: translation.summary },
        categories,
        keywords,
        relevanceScore,
        sentiment,
        translatedContent:
          locale === 'en'
            ? { en: content, es: translation.content }
            : { es: content, en: translation.content },
      };
    } catch (error) {
      console.error('Failed to process news article:', error);
      throw new Error(
        `News processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateNewsSummary(
    content: string,
    locale: Locale = 'en',
    targetLength: number = 100
  ): Promise<string> {
    const language = locale === 'es' ? 'Spanish' : 'English';

    const prompt = `
      Create a concise news summary in ${language} for this cryptocurrency/blockchain article.
      Target length: ${targetLength} words.
      Focus on:
      - Key facts and developments
      - Market impact or implications
      - Important dates, numbers, or figures
      - Why this matters to the crypto community
      
      Make it informative and engaging for crypto enthusiasts.
      
      Article: ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: targetLength * 2,
        temperature: 0.3,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Failed to generate news summary:', error);
      throw new Error(
        `News summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async categorizeNewsContent(
    title: string,
    content: string
  ): Promise<string[]> {
    const availableCategories = [
      'DeFi',
      'NFTs',
      'Base Network',
      'Trading',
      'Technology',
      'Regulation',
      'Market Analysis',
      'Bitcoin',
      'Ethereum',
      'Altcoins',
      'Stablecoins',
      'Web3',
      'Gaming',
      'Metaverse',
      'Security',
      'Adoption',
      'Partnerships',
      'Funding',
    ];

    const prompt = `
      Categorize this cryptocurrency/blockchain news article into 1-3 most relevant categories.
      Available categories: ${availableCategories.join(', ')}
      
      Return only the category names, separated by commas.
      Choose the most specific and relevant categories.
      
      Title: ${title}
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1,
      });

      const result = response.choices[0].message.content || '';
      return result
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => availableCategories.includes(cat));
    } catch (error) {
      console.error('Failed to categorize news content:', error);
      return ['Technology']; // Default fallback
    }
  }

  async extractNewsKeywords(title: string, content: string): Promise<string[]> {
    const prompt = `
      Extract 5-10 relevant keywords from this cryptocurrency/blockchain news article.
      Focus on:
      - Cryptocurrency names and symbols
      - Blockchain networks and protocols
      - Technical terms and concepts
      - Company and project names
      - Important financial terms
      
      Return keywords separated by commas, in order of relevance.
      
      Title: ${title}
      Content: ${content.substring(0, 1500)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      });

      const result = response.choices[0].message.content || '';
      return result
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    } catch (error) {
      console.error('Failed to extract keywords:', error);
      return [];
    }
  }

  async calculateRelevanceScore(
    title: string,
    content: string
  ): Promise<number> {
    const prompt = `
      Rate the relevance of this news article for a cryptocurrency/blockchain educational platform on a scale of 1-10.
      
      Consider:
      - Educational value for crypto learners
      - Impact on the crypto/blockchain ecosystem
      - Relevance to DeFi, NFTs, Base network, or general crypto adoption
      - Timeliness and importance of the information
      - Quality and credibility of the content
      
      Return only a number between 1-10, where:
      1-3: Low relevance (spam, off-topic, or very niche)
      4-6: Medium relevance (somewhat related to crypto)
      7-8: High relevance (important crypto news)
      9-10: Critical relevance (major developments, breaking news)
      
      Title: ${title}
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      });

      const result = response.choices[0].message.content || '5';
      const score = parseFloat(result.trim());
      return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error('Failed to calculate relevance score:', error);
      return 5; // Default neutral score
    }
  }

  async analyzeSentiment(
    content: string
  ): Promise<'positive' | 'neutral' | 'negative'> {
    const prompt = `
      Analyze the sentiment of this cryptocurrency/blockchain news article.
      Consider the overall tone and implications for the crypto market.
      
      Return only one word: "positive", "neutral", or "negative"
      
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      });

      const result =
        response.choices[0].message.content?.toLowerCase().trim() || 'neutral';

      if (result.includes('positive')) return 'positive';
      if (result.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return 'neutral';
    }
  }

  async translateToSpanish(
    title: string,
    content: string
  ): Promise<{ title: string; content: string; summary: string }> {
    const prompt = `
      Translate this cryptocurrency/blockchain news article from English to Spanish.
      Maintain technical accuracy and use appropriate crypto terminology in Spanish.
      Keep the same tone and style.
      
      Provide the translation in this exact format:
      TITLE: [translated title]
      CONTENT: [translated content]
      SUMMARY: [brief summary in Spanish, 2-3 sentences]
      
      Original Title: ${title}
      Original Content: ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(4000, content.length * 2),
        temperature: 0.3,
      });

      const result = response.choices[0].message.content || '';

      // Parse the structured response
      const titleMatch = result.match(/TITLE:\s*(.+?)(?=\nCONTENT:|$)/s);
      const contentMatch = result.match(/CONTENT:\s*(.+?)(?=\nSUMMARY:|$)/s);
      const summaryMatch = result.match(/SUMMARY:\s*(.+?)$/s);

      return {
        title: titleMatch?.[1]?.trim() || title,
        content: contentMatch?.[1]?.trim() || content,
        summary: summaryMatch?.[1]?.trim() || '',
      };
    } catch (error) {
      console.error('Failed to translate to Spanish:', error);
      return { title, content, summary: '' };
    }
  }

  async translateToEnglish(
    title: string,
    content: string
  ): Promise<{ title: string; content: string; summary: string }> {
    const prompt = `
      Translate this cryptocurrency/blockchain news article from Spanish to English.
      Maintain technical accuracy and use appropriate crypto terminology in English.
      Keep the same tone and style.
      
      Provide the translation in this exact format:
      TITLE: [translated title]
      CONTENT: [translated content]
      SUMMARY: [brief summary in English, 2-3 sentences]
      
      Original Title: ${title}
      Original Content: ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(4000, content.length * 2),
        temperature: 0.3,
      });

      const result = response.choices[0].message.content || '';

      // Parse the structured response
      const titleMatch = result.match(/TITLE:\s*(.+?)(?=\nCONTENT:|$)/s);
      const contentMatch = result.match(/CONTENT:\s*(.+?)(?=\nSUMMARY:|$)/s);
      const summaryMatch = result.match(/SUMMARY:\s*(.+?)$/s);

      return {
        title: titleMatch?.[1]?.trim() || title,
        content: contentMatch?.[1]?.trim() || content,
        summary: summaryMatch?.[1]?.trim() || '',
      };
    } catch (error) {
      console.error('Failed to translate to English:', error);
      return { title, content, summary: '' };
    }
  }

  // Batch processing for efficiency
  async processNewsArticlesBatch(
    articles: Array<{
      id: string;
      title: string;
      content: string;
      sourceUrl: string;
      sourceName: string;
      locale?: Locale;
    }>
  ): Promise<
    Array<{
      id: string;
      processed: any;
      error?: string;
    }>
  > {
    try {
      const results = [];

      // Process in smaller batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);

        const batchPromises = batch.map(async article => {
          try {
            const processed = await this.processNewsArticle(
              article.title,
              article.content,
              article.sourceUrl,
              article.sourceName,
              article.locale || 'en'
            );

            return { id: article.id, processed };
          } catch (error) {
            return {
              id: article.id,
              processed: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < articles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Error summarizing article:', error);
      throw new Error('Failed to generate article summary');
    }
  }

  async translateContent(
    content: string,
    fromLocale: Locale,
    toLocale: Locale
  ): Promise<string> {
    if (fromLocale === toLocale) return content;

    const fromLanguage = fromLocale === 'es' ? 'Spanish' : 'English';
    const toLanguage = toLocale === 'es' ? 'Spanish' : 'English';

    const prompt = `
      Translate the following content from ${fromLanguage} to ${toLanguage}.
      Maintain the original tone, style, and technical accuracy.
      Keep blockchain and cryptocurrency terms consistent.
      Preserve markdown formatting if present.
      
      Content: ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(content.length * 2, 4000),
        temperature: 0.2,
      });

      return response.choices[0].message.content || content;
    } catch (error) {
      console.error('Error translating content:', error);
      throw new Error('Failed to translate content');
    }
  }

  async extractKeywords(content: string): Promise<string[]> {
    const prompt = `
      Extract 5-10 relevant keywords from the following content.
      Focus on blockchain, cryptocurrency, DeFi, NFT, and Web3 related terms.
      Return only the keywords, separated by commas.
      
      Content: ${content.substring(0, 2000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1,
      });

      const keywords =
        response.choices[0].message.content
          ?.split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0) || [];

      return keywords.slice(0, 10); // Limit to 10 keywords
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async categorizeContent(title: string, content: string): Promise<string[]> {
    const categories = [
      'DeFi',
      'NFTs',
      'Base Network',
      'Trading',
      'Technology',
      'Regulation',
      'Market Analysis',
      'Education',
    ];

    const prompt = `
      Categorize this content into one or more of these categories: ${categories.join(', ')}.
      Return only the category names that best fit, separated by commas.
      Maximum 3 categories.
      
      Title: ${title}
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1,
      });

      const selectedCategories =
        response.choices[0].message.content
          ?.split(',')
          .map(c => c.trim())
          .filter(c => categories.includes(c)) || [];

      return selectedCategories.slice(0, 3);
    } catch (error) {
      console.error('Error categorizing content:', error);
      return [];
    }
  }

  async generateMetaDescription(
    title: string,
    content: string,
    locale: Locale = 'en'
  ): Promise<string> {
    const language = locale === 'es' ? 'Spanish' : 'English';

    const prompt = `
      Generate a compelling meta description in ${language} for this article.
      Maximum 160 characters.
      Make it SEO-friendly and engaging for readers interested in blockchain and crypto.
      
      Title: ${title}
      Content: ${content.substring(0, 500)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.3,
      });

      const description = response.choices[0].message.content || '';
      return description.substring(0, 160); // Ensure max length
    } catch (error) {
      console.error('Error generating meta description:', error);
      return title.substring(0, 160);
    }
  }

  async detectSentiment(
    content: string
  ): Promise<'positive' | 'neutral' | 'negative'> {
    const prompt = `
      Analyze the sentiment of this content about blockchain/cryptocurrency.
      Respond with only one word: "positive", "neutral", or "negative".
      
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      });

      const sentiment = response.choices[0].message.content
        ?.toLowerCase()
        .trim();

      if (sentiment === 'positive' || sentiment === 'negative') {
        return sentiment;
      }
      return 'neutral';
    } catch (error) {
      console.error('Error detecting sentiment:', error);
      return 'neutral';
    }
  }

  async scoreRelevance(
    content: string,
    userInterests: string[]
  ): Promise<number> {
    if (userInterests.length === 0) return 0.5; // Default relevance

    const prompt = `
      Score the relevance of this content to a user interested in: ${userInterests.join(', ')}.
      Return a number between 0 and 1, where 1 is highly relevant and 0 is not relevant.
      Consider topic overlap, depth of coverage, and user interest alignment.
      
      Content: ${content.substring(0, 1000)}...
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].message.content || '0.5');
      return Math.max(0, Math.min(1, score)); // Ensure score is between 0 and 1
    } catch (error) {
      console.error('Error scoring relevance:', error);
      return 0.5;
    }
  }

  // Content Moderation
  async moderateContent(content: string): Promise<{
    approved: boolean;
    flags: string[];
    confidence: number;
    suggestedActions: string[];
  }> {
    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];
      const flags = Object.keys(result.categories).filter(
        key => result.categories[key as keyof typeof result.categories]
      );

      const confidence = Math.max(...Object.values(result.category_scores));

      return {
        approved: !result.flagged,
        flags,
        confidence,
        suggestedActions: result.flagged ? ['manual_review'] : ['auto_approve'],
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      // Default to manual review on error
      return {
        approved: false,
        flags: ['moderation_error'],
        confidence: 1,
        suggestedActions: ['manual_review'],
      };
    }
  }

  // Tag Suggestions
  async suggestTags(content: string, title?: string): Promise<string[]> {
    const prompt = `
      Analyze the following content and suggest relevant tags for categorization.
      Focus on blockchain, cryptocurrency, DeFi, NFTs, trading, and technology topics.
      Return 5-10 specific, relevant tags that would help users find this content.
      Tags should be lowercase, concise (1-3 words), and commonly used in the crypto space.
      
      ${title ? `Title: ${title}\n` : ''}
      Content: ${content.substring(0, 2000)}...
      
      Return only the tags, separated by commas, without explanations.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.2,
      });

      const tagsText = response.choices[0].message.content || '';
      return tagsText
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 30)
        .slice(0, 10);
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return [];
    }
  }

  async improveTagSuggestions(
    content: string,
    title: string,
    existingTags: string[]
  ): Promise<string[]> {
    const prompt = `
      Given this content and existing tags, suggest additional relevant tags that would improve discoverability.
      Avoid duplicating existing tags: ${existingTags.join(', ')}
      
      Title: ${title}
      Content: ${content.substring(0, 1500)}...
      
      Suggest 3-5 additional tags that complement the existing ones.
      Focus on specific aspects, difficulty levels, or subtopics not covered by existing tags.
      
      Return only the new tags, separated by commas.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      });

      const tagsText = response.choices[0].message.content || '';
      return tagsText
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && !existingTags.includes(tag))
        .slice(0, 5);
    } catch (error) {
      console.error('Error improving tag suggestions:', error);
      return [];
    }
  }

  // Content Enhancement
  async enhanceArticleOutline(outline: string): Promise<string> {
    const prompt = `
      Enhance this article outline for a blockchain/crypto educational article.
      Make it more detailed, structured, and engaging.
      Add specific points that would be valuable for readers.
      Maintain the original structure but expand on each section.
      
      Original outline: ${outline}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.4,
      });

      return response.choices[0].message.content || outline;
    } catch (error) {
      console.error('Error enhancing outline:', error);
      return outline;
    }
  }

  // Batch Processing
  async batchProcessArticles(
    articles: Article[]
  ): Promise<AIProcessingResult[]> {
    const results: AIProcessingResult[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      const batchPromises = batch.map(async article => {
        const startTime = Date.now();

        try {
          const [keywords, categories, sentiment] = await Promise.all([
            this.extractKeywords(article.content.en),
            this.categorizeContent(article.title.en, article.content.en),
            this.detectSentiment(article.content.en),
          ]);

          const summaryEn = await this.summarizeArticle(
            article.content.en,
            150,
            'en'
          );
          const summaryEs = await this.summarizeArticle(
            article.content.es || article.content.en,
            150,
            'es'
          );

          return {
            summary: { en: summaryEn, es: summaryEs },
            keywords,
            categories,
            sentiment,
            relevance_score: 0.8, // Default score for existing articles
            processing_time: Date.now() - startTime,
            model_used: 'gpt-4',
          };
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
          return {
            summary: { en: '', es: '' },
            keywords: [],
            categories: [],
            sentiment: 'neutral' as const,
            relevance_score: 0.5,
            processing_time: Date.now() - startTime,
            model_used: 'gpt-4',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Singleton instance
export const aiContentService = new AIContentService();
