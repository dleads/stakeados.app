// Re-export client factory (no module-scoped client to keep SSR safe)
export { createClient } from './client';

// Re-export server factory
export { createClient as createServerClient } from './server';

// Re-export auth functions
export { getUser, getCurrentUser } from './auth';

import type { DatabaseExtended } from '@/types/database-extended';
import type { SupabaseClient } from '@supabase/supabase-js';

// Additional utility functions
export async function getUserProfile(
  userId: string
): Promise<DatabaseExtended['public']['Tables']['profiles']['Row']> {
  const { createClient } = await import('./client');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data!;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<DatabaseExtended['public']['Tables']['profiles']['Update']>
): Promise<DatabaseExtended['public']['Tables']['profiles']['Row']> {
  const { createClient } = await import('./client');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data!;
}

export async function getUserPoints(userId: string): Promise<number> {
  const { createClient } = await import('./client');
  const supabase = createClient();
  type Row = {
    total_points: number;
  };
  const { data, error } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', userId)
    .single<Row>();

  if (error) throw error;
  return data?.total_points ?? 0;
}

export async function isGenesisHolder(userId: string): Promise<boolean> {
  const { createClient } = await import('./client');
  const supabase = createClient();
  type Row = {
    genesis_nft_verified: boolean;
  };
  const { data, error } = await supabase
    .from('profiles')
    .select('genesis_nft_verified')
    .eq('id', userId)
    .single<Row>();

  if (error) throw error;
  return data?.genesis_nft_verified ?? false;
}

// Admin client with service role key tipado
export const supabaseAdmin = async (): Promise<
  SupabaseClient<DatabaseExtended>
> => {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient<DatabaseExtended>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
