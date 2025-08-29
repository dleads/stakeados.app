import { createClient } from '@/lib/supabase/server';

export class PushNotificationServiceServiceServer {
  private async getSupabase() {
    return await createClient();
  }

  // TODO: Implement methods as needed
  // This is a placeholder service to prevent build errors
}

export const pushNotificationServiceServiceServer = new PushNotificationServiceServiceServer();
