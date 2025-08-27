export interface NewsSource {
  id: string;
  name: string;
  description?: string;
  url: string;
  source_type: 'rss' | 'api' | 'scraper';
  api_key?: string;
  api_endpoint?: string;
  headers: Record<string, string>;
  categories: string[];
  language: string;
  fetch_interval: number; // in seconds
  is_active: boolean;
  priority: number; // 1-10, higher = more priority
  quality_score: number; // 1-10
  last_fetched_at?: Date;
  last_successful_fetch_at?: Date;
  consecutive_failures: number;
  max_failures: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewsSourceCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: Date;
}

export interface NewsSourceHealth {
  id: string;
  source_id: string;
  check_timestamp: Date;
  status: 'healthy' | 'warning' | 'error' | 'timeout';
  response_time?: number; // in milliseconds
  articles_fetched: number;
  error_message?: string;
  http_status_code?: number;
  metadata: Record<string, any>;
}

export interface NewsSourceWithHealth extends NewsSource {
  health_status?: NewsSourceHealth;
  categories_info?: NewsSourceCategory[];
}

export interface CreateNewsSourceRequest {
  name: string;
  description?: string;
  url: string;
  source_type: 'rss' | 'api' | 'scraper';
  api_key?: string;
  api_endpoint?: string;
  headers?: Record<string, string>;
  categories?: string[];
  language?: string;
  fetch_interval?: number;
  priority?: number;
  quality_score?: number;
}

export interface UpdateNewsSourceRequest
  extends Partial<CreateNewsSourceRequest> {
  is_active?: boolean;
  max_failures?: number;
}

export interface NewsSourceFilters {
  source_type?: 'rss' | 'api' | 'scraper';
  language?: string;
  is_active?: boolean;
  categories?: string[];
  priority_min?: number;
  quality_score_min?: number;
}

export interface NewsSourceStats {
  total_sources: number;
  active_sources: number;
  healthy_sources: number;
  sources_with_errors: number;
  avg_quality_score: number;
  last_24h_fetches: number;
}

// Raw news article from external sources
export interface RawNewsArticle {
  title: string;
  content: string;
  summary?: string;
  url: string;
  published_at: Date;
  author?: string;
  image_url?: string;
  source_id: string;
  metadata?: Record<string, any>;
}

// Processed news article (after AI processing)
export interface ProcessedNewsArticle {
  id: string;
  title: Record<string, string>; // {en: "title", es: "título"}
  summary: Record<string, string>;
  content: Record<string, string>;
  source_url: string;
  source_name: string;
  author_name?: string;
  image_url?: string;
  categories: string[];
  keywords: string[];
  relevance_score?: number;
  trending_score?: number;
  engagement_score?: number;
  read_time?: number;
  related_articles?: string[];
  user_interactions: Record<string, any>;
  ai_processed_at?: Date;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface NewsAggregationJob {
  id: string;
  source_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  articles_fetched: number;
  articles_processed: number;
  error_message?: string;
  metadata: Record<string, any>;
}
