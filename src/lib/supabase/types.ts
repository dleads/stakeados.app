export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      article_schedules: {
        Row: {
          article_id: string | null;
          created_at: string | null;
          id: string;
          scheduled_at: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string | null;
          id?: string;
          scheduled_at: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          article_id?: string | null;
          created_at?: string | null;
          id?: string;
          scheduled_at?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_schedules_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
        ];
      };
      articles: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          content: string;
          created_at: string | null;
          featured: boolean | null;
          id: string;
          image_url: string | null;
          language: string | null;
          published_at: string | null;
          read_time: number | null;
          slug: string | null;
          status: string | null;
          summary: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          published_at?: string | null;
          read_time?: number | null;
          slug?: string | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          published_at?: string | null;
          read_time?: number | null;
          slug?: string | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      article_proposals: {
        Row: {
          id: string;
          title: string;
          summary: string;
          outline: string;
          author_experience: string;
          previous_work: string[] | null;
          suggested_level: string | null;
          status: string | null;
          feedback: string | null;
          proposer_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          outline: string;
          author_experience: string;
          previous_work?: string[] | null;
          suggested_level?: string | null;
          status?: string | null;
          feedback?: string | null;
          proposer_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          outline?: string;
          author_experience?: string;
          previous_work?: string[] | null;
          suggested_level?: string | null;
          status?: string | null;
          feedback?: string | null;
          proposer_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_proposals_proposer_id_fkey';
            columns: ['proposer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: Json | null;
          icon: string | null;
          id: string;
          name: Json;
          parent_id: string | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: Json | null;
          icon?: string | null;
          id?: string;
          name: Json;
          parent_id?: string | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: Json | null;
          icon?: string | null;
          id?: string;
          name?: Json;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      community_contributions: {
        Row: {
          article_id: string | null;
          content: string | null;
          created_at: string | null;
          description: string;
          id: string;
          review_notes: string | null;
          reviewer_id: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          article_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          review_notes?: string | null;
          reviewer_id?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          article_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          review_notes?: string | null;
          reviewer_id?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_contributions_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_contributions_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_contributions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      courses: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          created_at: string | null;
          description: Json | null;
          duration_minutes: number | null;
          featured: boolean | null;
          id: string;
          image_url: string | null;
          level: string | null;
          nft_contract_address: string | null;
          nft_token_id: number | null;
          price: number | null;
          published: boolean | null;
          slug: string;
          title: Json;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: Json | null;
          duration_minutes?: number | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          level?: string | null;
          nft_contract_address?: string | null;
          nft_token_id?: number | null;
          price?: number | null;
          published?: boolean | null;
          slug: string;
          title: Json;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: Json | null;
          duration_minutes?: number | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          level?: string | null;
          nft_contract_address?: string | null;
          nft_token_id?: number | null;
          price?: number | null;
          published?: boolean | null;
          slug?: string;
          title?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      duplicate_logs: {
        Row: {
          created_at: string | null;
          id: string;
          matched_title: string;
          new_title: string;
          similarity: number;
          type: string;
          url: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          matched_title: string;
          new_title: string;
          similarity: number;
          type: string;
          url?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          matched_title?: string;
          new_title?: string;
          similarity?: number;
          type?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      glossary_terms: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          definition: Json;
          examples: Json | null;
          id: string;
          related_terms: string[] | null;
          term: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          definition: Json;
          examples?: Json | null;
          id?: string;
          related_terms?: string[] | null;
          term: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          definition?: Json;
          examples?: Json | null;
          id?: string;
          related_terms?: string[] | null;
          term?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'glossary_terms_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      lessons: {
        Row: {
          content: Json | null;
          created_at: string | null;
          duration_minutes: number | null;
          id: string;
          module_id: string | null;
          order_index: number;
          quiz_data: Json | null;
          title: Json;
          updated_at: string | null;
          video_url: string | null;
        };
        Insert: {
          content?: Json | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          id?: string;
          module_id?: string | null;
          order_index: number;
          quiz_data?: Json | null;
          title: Json;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Update: {
          content?: Json | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          id?: string;
          module_id?: string | null;
          order_index?: number;
          quiz_data?: Json | null;
          title?: Json;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      modules: {
        Row: {
          course_id: string | null;
          created_at: string | null;
          description: Json | null;
          duration_minutes: number | null;
          id: string;
          order_index: number;
          title: Json;
          updated_at: string | null;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string | null;
          description?: Json | null;
          duration_minutes?: number | null;
          id?: string;
          order_index: number;
          title: Json;
          updated_at?: string | null;
        };
        Update: {
          course_id?: string | null;
          created_at?: string | null;
          description?: Json | null;
          duration_minutes?: number | null;
          id?: string;
          order_index?: number;
          title?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'modules_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      news: {
        Row: {
          ai_processed: boolean | null;
          ai_sentiment: string | null;
          category_id: string | null;
          cluster_id: string | null;
          description: string | null;
          fetched_at: string | null;
          id: string;
          image_url: string | null;
          importance_score: number | null;
          language: string | null;
          published_at: string | null;
          source: string | null;
          summary_en: string | null;
          summary_es: string | null;
          tags: string[] | null;
          title: string;
          url: string;
        };
        Insert: {
          ai_processed?: boolean | null;
          ai_sentiment?: string | null;
          category_id?: string | null;
          cluster_id?: string | null;
          description?: string | null;
          fetched_at?: string | null;
          id?: string;
          image_url?: string | null;
          importance_score?: number | null;
          language?: string | null;
          published_at?: string | null;
          source?: string | null;
          summary_en?: string | null;
          summary_es?: string | null;
          tags?: string[] | null;
          title: string;
          url: string;
        };
        Update: {
          ai_processed?: boolean | null;
          ai_sentiment?: string | null;
          category_id?: string | null;
          cluster_id?: string | null;
          description?: string | null;
          fetched_at?: string | null;
          id?: string;
          image_url?: string | null;
          importance_score?: number | null;
          language?: string | null;
          published_at?: string | null;
          source?: string | null;
          summary_en?: string | null;
          summary_es?: string | null;
          tags?: string[] | null;
          title?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'news_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      news_cluster_items: {
        Row: {
          cluster_id: string | null;
          id: string;
          news_id: string | null;
          similarity: number | null;
        };
        Insert: {
          cluster_id?: string | null;
          id?: string;
          news_id?: string | null;
          similarity?: number | null;
        };
        Update: {
          cluster_id?: string | null;
          id?: string;
          news_id?: string | null;
          similarity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'news_cluster_items_cluster_id_fkey';
            columns: ['cluster_id'];
            isOneToOne: false;
            referencedRelation: 'news_clusters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'news_cluster_items_news_id_fkey';
            columns: ['news_id'];
            isOneToOne: false;
            referencedRelation: 'news';
            referencedColumns: ['id'];
          },
        ];
      };
      news_clusters: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          importance: number | null;
          news_count: number | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          importance?: number | null;
          news_count?: number | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          importance?: number | null;
          news_count?: number | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'news_clusters_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          base_name: string | null;
          bio: string | null;
          citizenship_points: number | null;
          created_at: string | null;
          display_name: string | null;
          genesis_nft_verified: boolean | null;
          id: string;
          language: string | null;
          role: string | null;
          updated_at: string | null;
          username: string | null;
          wallet_address: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          base_name?: string | null;
          bio?: string | null;
          citizenship_points?: number | null;
          created_at?: string | null;
          display_name?: string | null;
          genesis_nft_verified?: boolean | null;
          id: string;
          language?: string | null;
          role?: string | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_address?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          base_name?: string | null;
          bio?: string | null;
          citizenship_points?: number | null;
          created_at?: string | null;
          display_name?: string | null;
          genesis_nft_verified?: boolean | null;
          id?: string;
          language?: string | null;
          role?: string | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_address?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      user_activities: {
        Row: {
          activity_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          points: number;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          points: number;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          points?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_nfts: {
        Row: {
          acquired_at: string | null;
          contract_address: string;
          id: string;
          metadata: Json | null;
          network: string;
          nft_type: string | null;
          token_id: string;
          user_id: string | null;
          verified: boolean | null;
        };
        Insert: {
          acquired_at?: string | null;
          contract_address: string;
          id?: string;
          metadata?: Json | null;
          network?: string;
          nft_type?: string | null;
          token_id: string;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Update: {
          acquired_at?: string | null;
          contract_address?: string;
          id?: string;
          metadata?: Json | null;
          network?: string;
          nft_type?: string | null;
          token_id?: string;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_nfts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          content_id: string;
          completed_at: string | null;
          score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          content_id: string;
          completed_at?: string | null;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          content_id?: string;
          completed_at?: string | null;
          score?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
