import OpenAI from 'openai';
import { env } from '@/lib/env';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// News processing prompts
const NEWS_PROCESSING_PROMPTS = {
  summarize: `You are an expert crypto and blockchain news analyst. Summarize the following news article in a clear, concise manner. Focus on the key facts, implications, and relevance to the Web3/crypto community.

Article: {content}

Provide a summary in the following format:
- Main points (2-3 bullet points)
- Key implications for crypto/Web3
- Relevance score (1-10)

Summary:`,

  categorize: `You are a crypto news categorization expert. Analyze the following news article and categorize it into relevant crypto/blockchain categories.

Article: {title}
Content: {content}

Choose the most relevant categories from this list:
- Bitcoin
- Ethereum
- DeFi
- NFTs
- Layer2
- Regulation
- Adoption
- Technology
- Trading
- Stablecoins
- Web3
- Gaming
- Metaverse
- Infrastructure
- Security

Provide up to 3 most relevant categories as a JSON array.
Categories:`,

  extractKeywords: `You are a keyword extraction specialist for crypto and blockchain content. Extract the most relevant keywords from the following news article.

Article: {title}
Content: {content}

Extract 5-10 relevant keywords that would help users discover this article. Focus on:
- Crypto projects/tokens mentioned
- Technical concepts
- Key people/companies
- Important events/developments

Provide keywords as a JSON array.
Keywords:`,

  assessRelevance: `You are a crypto news relevance assessor. Rate how relevant and important this news article is to the crypto/Web3 community.

Article: {title}
Content: {content}

Consider:
- Impact on crypto markets
- Technological significance
- Regulatory implications
- Community interest
- Educational value

Provide a relevance score from 1-10 (10 being most relevant) and a brief explanation.

Score and explanation:`,

  detectDuplicate: `You are a duplicate content detector for crypto news. Compare these two articles and determine if they cover the same story or event.

Article 1:
Title: {title1}
Content: {content1}

Article 2:
Title: {title2}
Content: {content2}

Respond with:
- "DUPLICATE" if they cover the same story/event
- "SIMILAR" if they're related but different angles
- "DIFFERENT" if they're about different topics

Include a brief explanation.

Result:`,
};

// Interface for news processing result
export interface NewsProcessingResult {
  summary: {
    mainPoints: string[];
    implications: string;
    relevanceScore: number;
  };
  categories: string[];
  keywords: string[];
  relevanceAssessment: {
    score: number;
    explanation: string;
  };
  processedAt: Date;
}

// Interface for duplicate detection result
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarity: 'DUPLICATE' | 'SIMILAR' | 'DIFFERENT';
  explanation: string;
}

/**
 * Process news article with OpenAI
 */
export async function processNewsArticle(
  title: string,
  content: string
): Promise<NewsProcessingResult> {
  try {
    // Run all processing tasks in parallel
    const [summaryResult, categoriesResult, keywordsResult, relevanceResult] =
      await Promise.all([
        summarizeArticle(title, content),
        categorizeArticle(title, content),
        extractKeywords(title, content),
        assessRelevance(title, content),
      ]);

    return {
      summary: summaryResult,
      categories: categoriesResult,
      keywords: keywordsResult,
      relevanceAssessment: relevanceResult,
      processedAt: new Date(),
    };
  } catch (error) {
    console.error('Error processing news article:', error);
    throw new Error('Failed to process news article with AI');
  }
}

/**
 * Summarize news article
 */
export async function summarizeArticle(
  title: string,
  content: string
): Promise<{
  mainPoints: string[];
  implications: string;
  relevanceScore: number;
}> {
  try {
    const prompt = NEWS_PROCESSING_PROMPTS.summarize.replace(
      '{content}',
      `${title}\n\n${content}`
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert crypto and blockchain news analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content || '';

    // Parse the structured response
    const lines = result.split('\n').filter(line => line.trim());
    const mainPoints: string[] = [];
    let implications = '';
    let relevanceScore = 5;

    let currentSection = '';
    for (const line of lines) {
      if (line.includes('Main points:') || line.includes('- ')) {
        currentSection = 'points';
        if (line.includes('- ')) {
          mainPoints.push(line.replace('- ', '').trim());
        }
      } else if (line.includes('Key implications:')) {
        currentSection = 'implications';
      } else if (line.includes('Relevance score:')) {
        const scoreMatch = line.match(/(\d+)/);
        if (scoreMatch) {
          relevanceScore = parseInt(scoreMatch[1]);
        }
      } else if (currentSection === 'points' && line.includes('- ')) {
        mainPoints.push(line.replace('- ', '').trim());
      } else if (currentSection === 'implications' && line.trim()) {
        implications += line.trim() + ' ';
      }
    }

    return {
      mainPoints:
        mainPoints.length > 0 ? mainPoints : ['Article summary not available'],
      implications:
        implications.trim() || 'No specific implications identified',
      relevanceScore: Math.max(1, Math.min(10, relevanceScore)),
    };
  } catch (error) {
    console.error('Error summarizing article:', error);
    return {
      mainPoints: ['Summary not available'],
      implications: 'Unable to assess implications',
      relevanceScore: 5,
    };
  }
}

/**
 * Categorize news article
 */
export async function categorizeArticle(
  title: string,
  content: string
): Promise<string[]> {
  try {
    const prompt = NEWS_PROCESSING_PROMPTS.categorize
      .replace('{title}', title)
      .replace('{content}', content.substring(0, 1000));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a crypto news categorization expert. Respond only with a JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content || '[]';

    try {
      const categories = JSON.parse(result);
      return Array.isArray(categories) ? categories.slice(0, 3) : ['General'];
    } catch {
      // Fallback parsing
      const categories =
        result
          .match(/["']([^"']+)["']/g)
          ?.map(cat => cat.replace(/["']/g, '')) || [];
      return categories.length > 0 ? categories.slice(0, 3) : ['General'];
    }
  } catch (error) {
    console.error('Error categorizing article:', error);
    return ['General'];
  }
}

/**
 * Extract keywords from article
 */
export async function extractKeywords(
  title: string,
  content: string
): Promise<string[]> {
  try {
    const prompt = NEWS_PROCESSING_PROMPTS.extractKeywords
      .replace('{title}', title)
      .replace('{content}', content.substring(0, 1000));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a keyword extraction specialist. Respond only with a JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content || '[]';

    try {
      const keywords = JSON.parse(result);
      return Array.isArray(keywords) ? keywords.slice(0, 10) : [];
    } catch {
      // Fallback parsing
      const keywords =
        result.match(/["']([^"']+)["']/g)?.map(kw => kw.replace(/["']/g, '')) ||
        [];
      return keywords.length > 0 ? keywords.slice(0, 10) : [];
    }
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
}

/**
 * Assess article relevance
 */
export async function assessRelevance(
  title: string,
  content: string
): Promise<{ score: number; explanation: string }> {
  try {
    const prompt = NEWS_PROCESSING_PROMPTS.assessRelevance
      .replace('{title}', title)
      .replace('{content}', content.substring(0, 1000));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto news relevance assessor.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content || '';

    // Extract score and explanation
    const scoreMatch = result.match(/(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const explanation =
      result.replace(/Score:?\s*\d+/i, '').trim() || 'No explanation provided';

    return {
      score: Math.max(1, Math.min(10, score)),
      explanation,
    };
  } catch (error) {
    console.error('Error assessing relevance:', error);
    return {
      score: 5,
      explanation: 'Unable to assess relevance',
    };
  }
}

/**
 * Detect duplicate articles
 */
export async function detectDuplicateArticle(
  title1: string,
  content1: string,
  title2: string,
  content2: string
): Promise<DuplicateDetectionResult> {
  try {
    const prompt = NEWS_PROCESSING_PROMPTS.detectDuplicate
      .replace('{title1}', title1)
      .replace('{content1}', content1.substring(0, 500))
      .replace('{title2}', title2)
      .replace('{content2}', content2.substring(0, 500));

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a duplicate content detector for crypto news.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content || '';

    let similarity: 'DUPLICATE' | 'SIMILAR' | 'DIFFERENT' = 'DIFFERENT';
    if (result.includes('DUPLICATE')) {
      similarity = 'DUPLICATE';
    } else if (result.includes('SIMILAR')) {
      similarity = 'SIMILAR';
    }

    const explanation =
      result.replace(/(DUPLICATE|SIMILAR|DIFFERENT)/i, '').trim() ||
      'No explanation provided';

    return {
      isDuplicate: similarity === 'DUPLICATE',
      similarity,
      explanation,
    };
  } catch (error) {
    console.error('Error detecting duplicate:', error);
    return {
      isDuplicate: false,
      similarity: 'DIFFERENT',
      explanation: 'Unable to detect duplicates',
    };
  }
}

/**
 * Batch process multiple articles
 */
export async function batchProcessArticles(
  articles: Array<{ title: string; content: string; id?: string }>
): Promise<Array<NewsProcessingResult & { id?: string }>> {
  const results = [];

  // Process in batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async article => {
        try {
          const result = await processNewsArticle(
            article.title,
            article.content
          );
          return { ...result, id: article.id };
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
          return {
            summary: {
              mainPoints: ['Processing failed'],
              implications: 'Unable to process',
              relevanceScore: 1,
            },
            categories: ['General'],
            keywords: [],
            relevanceAssessment: {
              score: 1,
              explanation: 'Processing failed',
            },
            processedAt: new Date(),
            id: article.id,
          };
        }
      })
    );

    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Generate article translation
 */
export async function translateArticle(
  title: string,
  content: string,
  targetLanguage: 'es' | 'en'
): Promise<{ title: string; content: string }> {
  try {
    const languageName = targetLanguage === 'es' ? 'Spanish' : 'English';

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in crypto and blockchain content. Translate the following article to ${languageName}, maintaining technical accuracy and readability.`,
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent: ${content}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    const result = response.choices[0]?.message?.content || '';

    // Parse title and content
    const lines = result.split('\n');
    const titleLine = lines.find(
      line => line.includes('Title:') || line.includes('Título:')
    );
    const contentStart = lines.findIndex(
      line => line.includes('Content:') || line.includes('Contenido:')
    );

    const translatedTitle = titleLine
      ? titleLine.replace(/Title:|Título:/, '').trim()
      : title;

    const translatedContent =
      contentStart >= 0
        ? lines
            .slice(contentStart + 1)
            .join('\n')
            .trim()
        : result;

    return {
      title: translatedTitle,
      content: translatedContent,
    };
  } catch (error) {
    console.error('Error translating article:', error);
    return { title, content };
  }
}

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return !!env.OPENAI_API_KEY;
}

/**
 * Test OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Test connection. Respond with "OK".',
        },
      ],
      max_tokens: 10,
    });

    return response.choices[0]?.message?.content?.includes('OK') || false;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
