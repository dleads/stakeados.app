import type { Database, Json } from '@/types/supabase';

// Extiende el tipo generado para incluir tablas que existen en el código/migraciones
// pero aún no aparecen en el proyecto remoto (p.ej., nft_certificates).
// Esto permite tipado fuerte sin tocar el archivo generado automáticamente.

export type DatabaseExtended = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      // Solo agregar tablas que realmente no existen en los tipos generados
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: any;
          message: any;
          data: any;
          is_read: boolean;
          delivery_status: any;
          scheduled_for: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title?: any;
          message?: any;
          data?: any;
          is_read?: boolean;
          delivery_status?: any;
          scheduled_for?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: any;
          message?: any;
          data?: any;
          is_read?: boolean;
          delivery_status?: any;
          scheduled_for?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      admin_notifications: {
        Row: {
          id: string;
          admin_id: string;
          type: string;
          title: string;
          message: string;
          data: any;
          is_read: boolean;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          admin_id: string;
          type: string;
          title: string;
          message: string;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          admin_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      background_jobs: {
        Row: {
          id: string;
          job_type: string;
          status: string;
          data: any;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          job_type: string;
          status?: string;
          data?: any;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          job_type?: string;
          status?: string;
          data?: any;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
      role_audit_log: {
        Row: {
          id: string;
          user_id: string;
          old_role: string;
          new_role: string;
          changed_by: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          old_role: string;
          new_role: string;
          changed_by: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          old_role?: string;
          new_role?: string;
          changed_by?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: any;
          last_used: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters: any;
          last_used?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          filters?: any;
          last_used?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      nft_certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          token_id: number; // bigint -> number en TS
          contract_address: string;
          transaction_hash: string;
          minted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          token_id: number;
          contract_address: string;
          transaction_hash: string;
          minted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string | null;
          token_id?: number;
          contract_address?: string;
          transaction_hash?: string;
          minted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'nft_certificates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nft_certificates_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };
      content_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          usage_count: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          usage_count?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          usage_count?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription_type: string; // 'category' | 'tag' | 'author'
          subscription_target: string;
          frequency: string; // 'immediate' | 'daily' | 'weekly'
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_type: string;
          subscription_target: string;
          frequency?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_type?: string;
          subscription_target?: string;
          frequency?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Functions: Database['public']['Functions'] & {
      update_user_role: {
        Args: {
          target_user_id: string;
          new_role: string;
          reason: string | null;
        };
        Returns: boolean;
      };
      has_role_or_higher: {
        Args: {
          user_id: string;
          required_role: string;
        };
        Returns: boolean;
      };
      get_role_permissions: {
        Args: { user_id: string };
        Returns: any;
      };
      get_user_notification_preferences: {
        Args: { p_user_id: string };
        Returns: any[];
      };
      update_notification_preferences: {
        Args: { p_user_id: string; p_preferences: Json };
        Returns: null;
      };
      get_user_subscriptions: {
        Args: { p_user_id: string };
        Returns: any[];
      };
      upsert_user_subscription: {
        Args: {
          p_user_id: string;
          p_subscription_type: string;
          p_subscription_target: string;
          p_frequency: string;
          p_is_active: boolean;
        };
        Returns: null;
      };
      get_popular_tags: {
        Args: { limit_count: number };
        Returns: any[];
      };
      get_trending_tags: {
        Args: { limit_count: number };
        Returns: any[];
      };
      get_related_tags: {
        Args: { tag_id: string; limit_count: number };
        Returns: any[];
      };
      search_content: {
        Args: Record<string, unknown>;
        Returns: any[];
      };
      count_search_results: {
        Args: Record<string, unknown>;
        Returns: number | null;
      };
      explain_query: {
        Args: { query_text: string };
        Returns: any;
      };
      execute_optimized_query: {
        Args: { query_text: string; query_params: Json | null };
        Returns: any[];
      };
      get_trending_articles: {
        Args: { p_limit: number; p_days: number; p_locale: string | null };
        Returns: any[];
      };
      get_personalized_news_feed: {
        Args: { p_user_id: string; p_limit: number; p_offset: number };
        Returns: any[];
      };
      get_slow_queries: {
        Args: { p_limit: number };
        Returns: any[];
      };
      analyze_table_stats: {
        Args: Record<PropertyKey, never>;
        Returns: any[];
      };
      refresh_article_stats: {
        Args: Record<PropertyKey, never>;
        Returns: null;
      };
      refresh_trending_content: {
        Args: Record<PropertyKey, never>;
        Returns: null;
      };
      update_article_view_counts: {
        Args: Record<PropertyKey, never>;
        Returns: null;
      };
    };
  };
};
