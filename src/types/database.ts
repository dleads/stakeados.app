export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'genesis' | 'citizen' | 'student';
          display_name: string | null;
          avatar_url: string | null;
          genesis_nft_verified: boolean | null;
          citizenship_points: number | null;
          wallet_address: string | null;
          wallet_type: 'ethereum' | 'polygon' | 'binance' | 'solana' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'admin' | 'genesis' | 'citizen' | 'student';
          display_name?: string | null;
          avatar_url?: string | null;
          genesis_nft_verified?: boolean | null;
          citizenship_points?: number | null;
          wallet_address?: string | null;
          wallet_type?: 'ethereum' | 'polygon' | 'binance' | 'solana' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'genesis' | 'citizen' | 'student';
          display_name?: string | null;
          avatar_url?: string | null;
          genesis_nft_verified?: boolean | null;
          citizenship_points?: number | null;
          wallet_address?: string | null;
          wallet_type?: 'ethereum' | 'polygon' | 'binance' | 'solana' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      content_categories: {
        Row: {
          id: string;
          name: Json;
          slug: string;
          description: Json | null;
          color: string | null;
          icon: string | null;
          order_index: number | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: Json;
          slug: string;
          description?: Json | null;
          color?: string | null;
          icon?: string | null;
          order_index?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: Json;
          slug?: string;
          description?: Json | null;
          color?: string | null;
          icon?: string | null;
          order_index?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          title: Json;
          content: Json;
          excerpt: Json | null;
          slug: string;
          author_id: string | null;
          status: 'draft' | 'published' | 'archived' | null;
          published_at: string | null;
          view_count: number | null;
          featured: boolean | null;
          seo_title: Json | null;
          seo_description: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: Json;
          content: Json;
          excerpt?: Json | null;
          slug: string;
          author_id?: string | null;
          status?: 'draft' | 'published' | 'archived' | null;
          published_at?: string | null;
          view_count?: number | null;
          featured?: boolean | null;
          seo_title?: Json | null;
          seo_description?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: Json;
          content?: Json;
          excerpt?: Json | null;
          slug?: string;
          author_id?: string | null;
          status?: 'draft' | 'published' | 'archived' | null;
          published_at?: string | null;
          view_count?: number | null;
          featured?: boolean | null;
          seo_title?: Json | null;
          seo_description?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      news_articles: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          excerpt: string | null;
          url: string | null;
          source_id: string | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          excerpt?: string | null;
          url?: string | null;
          source_id?: string | null;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          excerpt?: string | null;
          url?: string | null;
          source_id?: string | null;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      article_categories: {
        Row: {
          article_id: string;
          category_id: string;
        };
        Insert: {
          article_id: string;
          category_id: string;
        };
        Update: {
          article_id?: string;
          category_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_categories_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'content_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      news_categories: {
        Row: {
          news_id: string;
          category_id: string;
        };
        Insert: {
          news_id: string;
          category_id: string;
        };
        Update: {
          news_id?: string;
          category_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'news_categories_news_id_fkey';
            columns: ['news_id'];
            isOneToOne: false;
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'news_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'content_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      article_history: {
        Row: {
          id: string;
          article_id: string;
          changed_by: string | null;
          change_type: string;
          old_values: Json | null;
          new_values: Json | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          changed_by?: string | null;
          change_type: string;
          old_values?: Json | null;
          new_values?: Json | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          changed_by?: string | null;
          change_type?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_history_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_interactions: {
        Row: {
          id: string;
          user_id: string | null;
          content_id: string;
          content_type: 'article' | 'news';
          interaction_type: 'view' | 'like' | 'share' | 'comment';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          content_id: string;
          content_type: 'article' | 'news';
          interaction_type: 'view' | 'like' | 'share' | 'comment';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          content_id?: string;
          content_type?: 'article' | 'news';
          interaction_type?: 'view' | 'like' | 'share' | 'comment';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_interactions_user_id_fkey';
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
      get_category_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: Json;
          article_count: number;
          news_count: number;
          total_views: number;
          total_interactions: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
