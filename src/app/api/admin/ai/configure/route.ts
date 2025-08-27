import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for AI configuration
const aiConfigSchema = z.object({
  processing: z
    .object({
      batch_size: z.number().min(1).max(100).default(10),
      max_concurrent_jobs: z.number().min(1).max(10).default(3),
      retry_attempts: z.number().min(0).max(5).default(2),
      timeout_seconds: z.number().min(30).max(300).default(120),
      rate_limit_per_minute: z.number().min(1).max(1000).default(60),
    })
    .optional(),

  content_analysis: z
    .object({
      min_content_length: z.number().min(50).max(10000).default(100),
      max_content_length: z.number().min(1000).max(100000).default(50000),
      summary_target_length: z.number().min(50).max(1000).default(200),
      keyword_count: z.number().min(3).max(20).default(8),
      relevance_threshold: z.number().min(0).max(100).default(60),
      confidence_threshold: z.number().min(0).max(1).default(0.7),
    })
    .optional(),

  duplicate_detection: z
    .object({
      similarity_threshold: z.number().min(0.1).max(1).default(0.8),
      title_weight: z.number().min(0).max(1).default(0.6),
      content_weight: z.number().min(0).max(1).default(0.4),
      time_window_days: z.number().min(1).max(365).default(30),
      max_comparisons: z.number().min(100).max(10000).default(1000),
    })
    .optional(),

  translation: z
    .object({
      enabled: z.boolean().default(false),
      auto_translate: z.boolean().default(false),
      target_languages: z.array(z.enum(['es', 'en'])).default(['es', 'en']),
      confidence_threshold: z.number().min(0).max(1).default(0.8),
      preserve_formatting: z.boolean().default(true),
    })
    .optional(),

  categorization: z
    .object({
      enabled: z.boolean().default(true),
      auto_assign: z.boolean().default(false),
      confidence_threshold: z.number().min(0).max(1).default(0.7),
      max_categories: z.number().min(1).max(5).default(2),
      custom_rules: z
        .array(
          z.object({
            keywords: z.array(z.string()),
            category: z.string(),
            weight: z.number().min(0).max(1).default(1),
          })
        )
        .optional(),
    })
    .optional(),

  notifications: z
    .object({
      job_completion: z.boolean().default(true),
      job_failure: z.boolean().default(true),
      high_duplicate_rate: z.boolean().default(true),
      low_quality_content: z.boolean().default(false),
      webhook_url: z.string().url().optional(),
      email_recipients: z.array(z.string().email()).optional(),
    })
    .optional(),
});

// Default AI configuration
const defaultConfig = {
  processing: {
    batch_size: 10,
    max_concurrent_jobs: 3,
    retry_attempts: 2,
    timeout_seconds: 120,
    rate_limit_per_minute: 60,
  },
  content_analysis: {
    min_content_length: 100,
    max_content_length: 50000,
    summary_target_length: 200,
    keyword_count: 8,
    relevance_threshold: 60,
    confidence_threshold: 0.7,
  },
  duplicate_detection: {
    similarity_threshold: 0.8,
    title_weight: 0.6,
    content_weight: 0.4,
    time_window_days: 30,
    max_comparisons: 1000,
  },
  translation: {
    enabled: false,
    auto_translate: false,
    target_languages: ['es', 'en'],
    confidence_threshold: 0.8,
    preserve_formatting: true,
  },
  categorization: {
    enabled: true,
    auto_assign: false,
    confidence_threshold: 0.7,
    max_categories: 2,
    custom_rules: [
      {
        keywords: ['bitcoin', 'crypto', 'blockchain', 'ethereum'],
        category: 'cryptocurrency',
        weight: 1.0,
      },
      {
        keywords: [
          'ai',
          'artificial intelligence',
          'machine learning',
          'inteligencia artificial',
        ],
        category: 'technology',
        weight: 0.9,
      },
      {
        keywords: [
          'election',
          'government',
          'policy',
          'elección',
          'gobierno',
          'política',
        ],
        category: 'politics',
        weight: 0.8,
      },
    ],
  },
  notifications: {
    job_completion: true,
    job_failure: true,
    high_duplicate_rate: true,
    low_quality_content: false,
  },
  last_updated: new Date().toISOString(),
  updated_by: null,
};

// In-memory config storage (in production, use database)
let currentConfig = { ...defaultConfig };

async function checkAdminPermissions(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .single();

  return profile && ['admin'].includes(profile.role) ? profile : null;
}

function validateConfigConsistency(config: any) {
  const errors = [];

  // Check that weights sum appropriately
  if (config.duplicate_detection) {
    const titleWeight = config.duplicate_detection.title_weight;
    const contentWeight = config.duplicate_detection.content_weight;
    if (Math.abs(titleWeight + contentWeight - 1.0) > 0.01) {
      errors.push(
        'duplicate_detection: title_weight and content_weight must sum to 1.0'
      );
    }
  }

  // Check content length consistency
  if (config.content_analysis) {
    if (
      config.content_analysis.min_content_length >=
      config.content_analysis.max_content_length
    ) {
      errors.push(
        'content_analysis: min_content_length must be less than max_content_length'
      );
    }
  }

  // Check processing limits
  if (config.processing) {
    if (
      config.processing.batch_size > config.processing.rate_limit_per_minute
    ) {
      errors.push(
        'processing: batch_size should not exceed rate_limit_per_minute'
      );
    }
  }

  return errors;
}

function mergeConfigs(
  current: Record<string, any>,
  updates: Record<string, any>
): Record<string, any> {
  const merged = JSON.parse(JSON.stringify(current));

  for (const [section, sectionUpdates] of Object.entries(updates)) {
    if (
      merged[section] &&
      typeof merged[section] === 'object' &&
      !Array.isArray(merged[section])
    ) {
      merged[section] = {
        ...(merged[section] as Record<string, any>),
        ...(sectionUpdates as Record<string, any>),
      };
    } else {
      merged[section] = sectionUpdates;
    }
  }

  return merged;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminProfile = await checkAdminPermissions(supabase, user.id);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section && (currentConfig as any)[section]) {
      return NextResponse.json({
        section,
        config: (currentConfig as any)[section],
        last_updated: currentConfig.last_updated,
      });
    }

    return NextResponse.json({
      config: currentConfig,
      metadata: {
        total_sections: Object.keys(currentConfig).length - 2, // Exclude metadata fields
        last_updated: currentConfig.last_updated,
        updated_by: currentConfig.updated_by,
      },
    });
  } catch (error) {
    console.error('AI config GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminProfile = await checkAdminPermissions(supabase, user.id);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedConfig = aiConfigSchema.parse(body);

    // Validate configuration consistency
    const validationErrors = validateConfigConsistency(validatedConfig);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Configuration validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Merge with current configuration
    const mergedConfig = mergeConfigs(currentConfig, validatedConfig);
    mergedConfig.last_updated = new Date().toISOString();
    mergedConfig.updated_by = {
      id: user.id,
      email: adminProfile.email,
      timestamp: new Date().toISOString(),
    };

    // Log configuration change
    console.log(`AI configuration updated by ${adminProfile.email}:`, {
      sections_updated: Object.keys(validatedConfig),
      timestamp: mergedConfig.last_updated,
    });

    // In production, save to database and trigger configuration reload
    // await saveConfigToDatabase(mergedConfig)
    // await notifyServicesOfConfigChange(mergedConfig)

    return NextResponse.json({
      message: 'AI configuration updated successfully',
      config: mergedConfig,
      changes: {
        sections_updated: Object.keys(validatedConfig),
        updated_by: adminProfile.email,
        updated_at: currentConfig.last_updated,
      },
    });
  } catch (error) {
    console.error('AI config PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Configuration validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST endpoint to reset configuration to defaults
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminProfile = await checkAdminPermissions(supabase, user.id);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, section } = body;

    if (action === 'reset') {
      if (section && (defaultConfig as any)[section]) {
        // Reset specific section
        (currentConfig as any)[section] = JSON.parse(
          JSON.stringify((defaultConfig as any)[section])
        );
        (currentConfig as any).last_updated = new Date().toISOString();
        (currentConfig as any).updated_by = {
          id: user.id,
          email: adminProfile.email,
          timestamp: new Date().toISOString(),
        };

        console.log(
          `AI configuration section '${section}' reset to defaults by ${adminProfile.email}`
        );

        return NextResponse.json({
          message: `Configuration section '${section}' reset to defaults`,
          section,
          config: (currentConfig as any)[section],
          reset_by: adminProfile.email,
          reset_at: currentConfig.last_updated,
        });
      } else {
        // Reset entire configuration
        currentConfig = JSON.parse(JSON.stringify(defaultConfig));
        (currentConfig as any).last_updated = new Date().toISOString();
        (currentConfig as any).updated_by = {
          id: user.id,
          email: adminProfile.email,
          timestamp: new Date().toISOString(),
        };

        console.log(
          `Entire AI configuration reset to defaults by ${adminProfile.email}`
        );

        return NextResponse.json({
          message: 'Entire AI configuration reset to defaults',
          config: currentConfig,
          reset_by: adminProfile.email,
          reset_at: currentConfig.last_updated,
        });
      }
    }

    return NextResponse.json(
      {
        error: 'Invalid action. Supported actions: reset',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('AI config POST error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for incremental updates
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminProfile = await checkAdminPermissions(supabase, user.id);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { section, updates } = body;

    if (!section || !updates || !(currentConfig as any)[section]) {
      return NextResponse.json(
        {
          error: 'Invalid request. Provide section and updates',
        },
        { status: 400 }
      );
    }

    // Apply incremental updates to specific section
    const previousSectionConfig = JSON.parse(
      JSON.stringify((currentConfig as any)[section])
    );
    (currentConfig as any)[section] = {
      ...(currentConfig as any)[section],
      ...updates,
    };
    (currentConfig as any).last_updated = new Date().toISOString();
    (currentConfig as any).updated_by = {
      id: user.id,
      email: adminProfile.email,
      timestamp: new Date().toISOString(),
    };

    // Validate the updated configuration
    const tempConfig = { [section]: (currentConfig as any)[section] };
    const validationErrors = validateConfigConsistency(tempConfig);

    if (validationErrors.length > 0) {
      // Rollback changes
      (currentConfig as any)[section] = previousSectionConfig;
      return NextResponse.json(
        {
          error: 'Configuration validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    console.log(
      `AI configuration section '${section}' updated by ${adminProfile.email}:`,
      updates
    );

    return NextResponse.json({
      message: `Configuration section '${section}' updated successfully`,
      section,
      config: (currentConfig as any)[section],
      changes: updates,
      updated_by: adminProfile.email,
      updated_at: currentConfig.last_updated,
    });
  } catch (error) {
    console.error('AI config PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
