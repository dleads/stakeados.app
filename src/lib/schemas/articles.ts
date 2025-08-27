import * as z from 'zod';

export const articleSchema = z.object({
  title: z.object({
    en: z.string().min(10),
    es: z.string().optional(),
  }),
  content: z.object({
    en: z.string().min(100),
    es: z.string().optional(),
  }),
  category: z.string().min(3),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published']).optional(),
});

export const articleProposalSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must be less than 500 characters'),
  outline: z
    .string()
    .min(100, 'Outline must be at least 100 characters')
    .max(2000, 'Outline must be less than 2000 characters'),
  author_experience: z
    .string()
    .min(50, 'Please describe your experience (minimum 50 characters)')
    .max(1000, 'Experience description must be less than 1000 characters'),
  previous_work: z.array(z.string().url('Please enter valid URLs')).optional(),
  suggested_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select a difficulty level',
  }),
  suggested_category: z.string().optional(),
  estimated_read_time: z
    .number()
    .min(1, 'Estimated read time must be at least 1 minute')
    .max(60, 'Estimated read time must be less than 60 minutes')
    .optional(),
});

// Enhanced admin article schema for full article management
export const adminArticleSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  summary: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  language: z.enum(['es', 'en']).default('es'),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  featured_image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  reading_time: z.number().optional(),
  published_at: z.string().datetime().optional(),
  author_id: z.string().uuid().optional(),
});

// Schema for updating articles
export const updateArticleSchema = adminArticleSchema.partial();

// Schema for article scheduling
export const articleScheduleSchema = z.object({
  scheduled_at: z.string().datetime('Invalid datetime format'),
  timezone: z.string().default('UTC'),
  recurring_pattern: z.string().optional(),
  auto_publish: z.boolean().default(true),
  publish_channels: z.array(z.string()).default(['web']),
  notes: z.string().optional(),
});

// Schema for article history filters
export const articleHistoryQuerySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  change_type: z.string().optional(),
});

// Schema for admin article list filters
export const adminArticleQuerySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  author_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'published_at', 'title'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Schema for article review submission
export const articleReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  reviewer_notes: z.string().optional(),
  suggested_changes: z
    .array(
      z.object({
        section: z.string(),
        comment: z.string(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    )
    .optional(),
  assign_to: z.string().uuid().optional(),
});

// Schema for article approval
export const articleApprovalSchema = z.object({
  publish_immediately: z.boolean().default(true),
  scheduled_at: z.string().datetime().optional(),
  approval_notes: z.string().optional(),
  notify_author: z.boolean().default(true),
  publish_channels: z.array(z.string()).default(['web']),
  seo_optimizations: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

// Schema for article rejection
export const articleRejectionSchema = z.object({
  reason: z.string().min(20, 'Rejection reason must be at least 20 characters'),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  suggested_improvements: z
    .array(
      z.object({
        category: z.enum([
          'content',
          'structure',
          'seo',
          'style',
          'accuracy',
          'other',
        ]),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        examples: z.string().optional(),
      })
    )
    .optional(),
  allow_resubmission: z.boolean().default(true),
  notify_author: z.boolean().default(true),
  reviewer_notes: z.string().optional(),
  return_to_draft: z.boolean().default(true),
});

// Schema for reviewer assignment
export const reviewerAssignmentSchema = z.object({
  reviewer_id: z.string().uuid('Invalid reviewer ID'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deadline: z.string().datetime().optional(),
  assignment_notes: z.string().optional(),
  notify_reviewer: z.boolean().default(true),
  notify_author: z.boolean().default(false),
  review_type: z.enum(['content', 'technical', 'seo', 'full']).default('full'),
  estimated_review_time: z.number().min(5).max(480).default(30),
});

// Schema for review queue query parameters
export const reviewQueueQuerySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  author_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  days_pending: z.coerce.number().min(0).optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'priority', 'author'])
    .default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  assigned_to: z.string().uuid().optional(),
  include_stats: z.coerce.boolean().default(true),
});
