import { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface NotificationPreferences {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  digestFrequency?: 'none' | 'daily' | 'weekly';
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

// Alineado con los handlers: clase y métodos esperados
export class NotificationPreferencesServiceServer {
  private supabase?: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase;
  }

  private async getSupabase(): Promise<SupabaseClient> {
    if (this.supabase) return this.supabase;
    return await createClient();
  }

  // Devuelve preferencias del usuario (stub: valores por defecto si no hay tabla)
  async getUserPreferences(_userId: string): Promise<NotificationPreferences> {
    const _supabase = await this.getSupabase();
    // Si existiera la tabla user_notification_preferences, aquí se haría el select.
    // Para evitar fallos en build/entornos sin tabla, devolvemos defaults razonables.
    return {
      emailEnabled: true,
      pushEnabled: false,
      digestFrequency: 'weekly',
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }

  // Actualiza preferencias del usuario (stub: devuelve merge con defaults)
  async updateUserPreferences(
    userId: string,
    partial: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...partial } as NotificationPreferences;
    // Aquí se haría el upsert en DB si la tabla existe.
    return updated;
  }

  // Restaura valores por defecto
  async resetToDefaults(_userId: string): Promise<NotificationPreferences> {
    return {
      emailEnabled: true,
      pushEnabled: false,
      digestFrequency: 'weekly',
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }

  // Exporta preferencias como JSON (string)
  async exportPreferences(userId: string): Promise<string> {
    const prefs = await this.getUserPreferences(userId);
    return JSON.stringify(prefs);
  }

  // Importa preferencias desde un JSON (string) y devuelve el objeto resultante
  async importPreferences(
    userId: string,
    preferencesJson: string
  ): Promise<NotificationPreferences> {
    try {
      const parsed = JSON.parse(preferencesJson) as Partial<NotificationPreferences>;
      const updated = await this.updateUserPreferences(userId, parsed);
      return updated;
    } catch (e) {
      throw new Error('Invalid preferences JSON');
    }
  }
}

// Singleton instance for convenience imports
export const notificationPreferencesService = new NotificationPreferencesServiceServer();

