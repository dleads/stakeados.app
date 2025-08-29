import { createClient } from '@/lib/supabase/server';

export class SearchServiceServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  // TODO: Implement methods as needed
  // This is a placeholder service to prevent build errors
}

export const searchServiceServiceServer = new SearchServiceServiceServer();
