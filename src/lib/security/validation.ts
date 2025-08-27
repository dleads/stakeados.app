// Input validation and sanitization utilities

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format');

// User input schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name too long')
    .optional(),
  username: usernameSchema.optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(50, 'Display name too long').optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatarUrl: z.string().url('Invalid URL format').optional(),
});

// Course schemas
export const courseCreateSchema = z.object({
  title: z.record(z.string().min(1, 'Title is required')),
  description: z.record(z.string().min(1, 'Description is required')),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
  estimatedTime: z.number().min(1, 'Estimated time must be positive'),
  isPublished: z.boolean().default(false),
  nftContractAddress: walletAddressSchema.optional(),
});

// Article schemas
export const articleCreateSchema = z.object({
  title: z.record(z.string().min(1, 'Title is required')),
  content: z.record(z.string().min(1, 'Content is required')),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category too long'),
  tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Too many tags'),
  status: z.enum(['draft', 'review', 'published']).default('draft'),
});

// Comment schemas
export const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long'),
  parentId: z.string().uuid().optional(),
});

// Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  filters: z
    .object({
      categories: z.array(z.string()).optional(),
      difficulty: z.enum(['basic', 'intermediate', 'advanced']).optional(),
      type: z.enum(['course', 'article', 'news', 'user']).optional(),
    })
    .optional(),
});

// Web3 schemas
export const nftMintSchema = z.object({
  recipient: walletAddressSchema,
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
});

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/\s+/g, ' ').substring(0, 10000); // Limit length
}

export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return url.toString();
  } catch {
    return '';
  }
}

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  };
}

// Rate limiting configuration
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload limit exceeded, please try again later',
  },
  web3: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 Web3 operations per window
    message: 'Too many Web3 operations, please try again later',
  },
} as const;

// XSS protection
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SQL injection protection (for raw queries)
export function escapeSql(input: string): string {
  return input.replace(/'/g, "''");
}

// CSRF token generation
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Content validation
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}

// IP validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;
