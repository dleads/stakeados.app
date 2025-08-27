import { z } from 'zod';

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .default('https://zjnohvjyktvousakkfax.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .default(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqbm9odmp5a3R2b3VzYWtrZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTI0MjYsImV4cCI6MjA2ODcyODQyNn0.IfW6LgwXngMYN-XrJKlst3zSbRiUv_bQ8uFDCxGeMhs'
    ),
  NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID: z.string().optional(),

  // Private
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .default(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqbm9odmp5a3R2b3VzYWtrZmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE1MjQyNiwiZXhwIjoyMDY4NzI4NDI2fQ.0yusTaWVqmk7aTs5YXA42azyS1o33x8S17gv-WNkTEI'
    ),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
