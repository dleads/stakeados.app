export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      article_proposals: {
        Row: {
          author_experience: string;
          created_at: string | null;
          estimated_read_time: number | null;
          feedback: string | null;
          id: string;
          outline: string;
          previous_work: string[] | null;
          proposer_id: string;
          reviewer_id: string | null;
          status: string | null;
          suggested_category: string | null;
          suggested_level: string | null;
          summary: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_experience: string;
          created_at?: string | null;
          estimated_read_time?: number | null;
          feedback?: string | null;
          id?: string;
          outline: string;
          previous_work?: string[] | null;
          proposer_id: string;
          reviewer_id?: string | null;
          status?: string | null;
          suggested_category?: string | null;
          suggested_level?: string | null;
          summary: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_experience?: string;
          created_at?: string | null;
          estimated_read_time?: number | null;
          feedback?: string | null;
          id?: string;
          outline?: string;
          previous_work?: string[] | null;
          proposer_id?: string;
          reviewer_id?: string | null;
          status?: string | null;
          suggested_category?: string | null;
          suggested_level?: string | null;
          summary?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
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
        Relationships: [];
      };
      articles: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          content: string;
          created_at: string | null;
          featured_image: string | null;
          id: string;
          language: string | null;
          likes: number | null;
          published_at: string | null;
          reading_time: number | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          status: string | null;
          summary: string | null;
          title: string;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          featured_image?: string | null;
          id?: string;
          language?: string | null;
          likes?: number | null;
          published_at?: string | null;
          reading_time?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          featured_image?: string | null;
          id?: string;
          language?: string | null;
          likes?: number | null;
          published_at?: string | null;
          reading_time?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string | null;
          views?: number | null;
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
      categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number | null;
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          category_id: string | null;
          content: string;
          created_at: string | null;
          id: string;
          language: string | null;
          processed: boolean | null;
          published_at: string | null;
          source_name: string | null;
          source_url: string | null;
          summary: string | null;
          title: string;
          trending_score: number | null;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          language?: string | null;
          processed?: boolean | null;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          summary?: string | null;
          title: string;
          trending_score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          language?: string | null;
          processed?: boolean | null;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          summary?: string | null;
          title?: string;
          trending_score?: number | null;
          updated_at?: string | null;
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
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string;
          genesis_nft_verified: boolean | null;
          id: string;
          is_genesis: boolean | null;
          role: string | null;
          total_points: number | null;
          updated_at: string | null;
          username: string | null;
          wallet_address: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email: string;
          genesis_nft_verified?: boolean | null;
          id: string;
          is_genesis?: boolean | null;
          role?: string | null;
          total_points?: number | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_address?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string;
          genesis_nft_verified?: boolean | null;
          id?: string;
          is_genesis?: boolean | null;
          role?: string | null;
          total_points?: number | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_address?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      role_audit_log: {
        Row: {
          changed_by: string;
          created_at: string;
          id: string;
          new_role: string;
          old_role: string | null;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          changed_by: string;
          created_at?: string;
          id?: string;
          new_role: string;
          old_role?: string | null;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          changed_by?: string;
          created_at?: string;
          id?: string;
          new_role?: string;
          old_role?: string | null;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_audit_log_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_audit_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
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
        Relationships: [];
      };
      user_progress: {
        Row: {
          completed: boolean | null;
          course_id: string | null;
          created_at: string | null;
          id: string;
          last_position: number | null;
          lesson_id: string | null;
          progress_percentage: number | null;
          quiz_score: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          completed?: boolean | null;
          course_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_position?: number | null;
          lesson_id?: string | null;
          progress_percentage?: number | null;
          quiz_score?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed?: boolean | null;
          course_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_position?: number | null;
          lesson_id?: string | null;
          progress_percentage?: number | null;
          quiz_score?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      background_jobs: {
        Row: {
          id: string;
          job_type:
            | 'ai_processing'
            | 'rss_fetch'
            | 'bulk_operation'
            | 'backup'
            | 'maintenance';
          status: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
          progress: number;
          message: string | null;
          data: Json;
          started_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          job_type:
            | 'ai_processing'
            | 'rss_fetch'
            | 'bulk_operation'
            | 'backup'
            | 'maintenance';
          status?:
            | 'started'
            | 'progress'
            | 'completed'
            | 'failed'
            | 'cancelled';
          progress?: number;
          message?: string | null;
          data?: Json;
          started_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          job_type?:
            | 'ai_processing'
            | 'rss_fetch'
            | 'bulk_operation'
            | 'backup'
            | 'maintenance';
          status?:
            | 'started'
            | 'progress'
            | 'completed'
            | 'failed'
            | 'cancelled';
          progress?: number;
          message?: string | null;
          data?: Json;
          started_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'background_jobs_started_by_fkey';
            columns: ['started_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      bulk_operations: {
        Row: {
          id: string;
          user_id: string | null;
          operation_type: string;
          operation_action: string;
          status: string;
          total_items: number;
          processed_items: number;
          success_count: number;
          error_count: number;
          progress: number;
          errors: Json;
          metadata: Json;
          started_at: string | null;
          completed_at: string | null;
          estimated_completion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          operation_type: string;
          operation_action: string;
          status?: string;
          total_items: number;
          processed_items?: number;
          success_count?: number;
          error_count?: number;
          progress?: number;
          errors?: Json;
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          estimated_completion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          operation_type?: string;
          operation_action?: string;
          status?: string;
          total_items?: number;
          processed_items?: number;
          success_count?: number;
          error_count?: number;
          progress?: number;
          errors?: Json;
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          estimated_completion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bulk_operations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      news_sources: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          url: string;
          source_type: string;
          api_key: string | null;
          api_endpoint: string | null;
          headers: Json;
          categories: string[];
          language: string;
          fetch_interval: number;
          is_active: boolean;
          priority: number;
          quality_score: number;
          last_fetched_at: string | null;
          last_successful_fetch_at: string | null;
          consecutive_failures: number;
          max_failures: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          url: string;
          source_type?: string;
          api_key?: string | null;
          api_endpoint?: string | null;
          headers?: Json;
          categories?: string[];
          language?: string;
          fetch_interval?: number;
          is_active?: boolean;
          priority?: number;
          quality_score?: number;
          last_fetched_at?: string | null;
          last_successful_fetch_at?: string | null;
          consecutive_failures?: number;
          max_failures?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          url?: string;
          source_type?: string;
          api_key?: string | null;
          api_endpoint?: string | null;
          headers?: Json;
          categories?: string[];
          language?: string;
          fetch_interval?: number;
          is_active?: boolean;
          priority?: number;
          quality_score?: number;
          last_fetched_at?: string | null;
          last_successful_fetch_at?: string | null;
          consecutive_failures?: number;
          max_failures?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'news_sources_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          message: string;
          data: Json;
          priority: string;
          read: boolean;
          created_at: string;
          expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          title: string;
          message: string;
          data?: Json;
          priority?: string;
          read?: boolean;
          created_at?: string;
          expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          data?: Json;
          priority?: string;
          read?: boolean;
          created_at?: string;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: Json;
          message: Json;
          data: Json;
          is_read: boolean | null;
          delivery_status: Json | null;
          scheduled_for: string | null;
          created_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          title: Json;
          message: Json;
          data?: Json;
          is_read?: boolean | null;
          delivery_status?: Json | null;
          scheduled_for?: string | null;
          created_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          title?: Json;
          message?: Json;
          data?: Json;
          is_read?: boolean | null;
          delivery_status?: Json | null;
          scheduled_for?: string | null;
          created_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          in_app_enabled: boolean | null;
          email_enabled: boolean | null;
          push_enabled: boolean | null;
          digest_frequency: string | null;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          timezone: string | null;
          categories: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          in_app_enabled?: boolean | null;
          email_enabled?: boolean | null;
          push_enabled?: boolean | null;
          digest_frequency?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string | null;
          categories?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          in_app_enabled?: boolean | null;
          email_enabled?: boolean | null;
          push_enabled?: boolean | null;
          digest_frequency?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string | null;
          categories?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_digests: {
        Row: {
          id: string;
          user_id: string | null;
          digest_type: string;
          content: Json;
          scheduled_for: string;
          sent_at: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          digest_type: string;
          content: Json;
          scheduled_for: string;
          sent_at?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          digest_type?: string;
          content?: Json;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_digests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_push_subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent: string | null;
          created_at: string | null;
          last_used: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent?: string | null;
          created_at?: string | null;
          last_used?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          endpoint?: string;
          p256dh_key?: string;
          auth_key?: string;
          user_agent?: string | null;
          created_at?: string | null;
          last_used?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      article_collaboration_sessions: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          session_start: string;
          session_end: string | null;
          is_active: boolean;
          last_activity: string;
          cursor_position: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          session_start?: string;
          session_end?: string | null;
          is_active?: boolean;
          last_activity?: string;
          cursor_position?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_id?: string;
          session_start?: string;
          session_end?: string | null;
          is_active?: boolean;
          last_activity?: string;
          cursor_position?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_collaboration_sessions_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_collaboration_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
      user_subscriptions: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          subscription_target: string;
          subscription_type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          subscription_target: string;
          subscription_type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          subscription_target?: string;
          subscription_type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          search_query: string | null;
          search_type: string | null;
          filters: any | null;
          is_default: boolean | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          search_query?: string | null;
          search_type?: string | null;
          filters?: any | null;
          is_default?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          search_query?: string | null;
          search_type?: string | null;
          filters?: any | null;
          is_default?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      content_uploads: {
        Row: {
          id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          upload_type: string;
          uploaded_by: string | null;
          public_url: string;
          metadata: any | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          upload_type?: string;
          uploaded_by?: string | null;
          public_url: string;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          upload_type?: string;
          uploaded_by?: string | null;
          public_url?: string;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_uploads_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      system_health_checks: {
        Row: {
          id: string;
          check_type: string;
          status: string;
          details: any | null;
          checked_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          check_type: string;
          status: string;
          details?: any | null;
          checked_at: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          check_type?: string;
          status?: string;
          details?: any | null;
          checked_at?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      clean_expired_permission_cache: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_role_permissions: {
        Args: { user_id: string };
        Returns: Json;
      };
      get_user_role: {
        Args: { user_id: string };
        Returns: string;
      };
      has_role_or_higher: {
        Args: { required_role: string; user_id: string };
        Returns: boolean;
      };
      update_user_role: {
        Args: { new_role: string; reason?: string; target_user_id: string };
        Returns: boolean;
      };
      get_user_notification_preferences: {
        Args: { p_user_id: string };
        Returns: {
          in_app_enabled: boolean;
          email_enabled: boolean;
          push_enabled: boolean;
          digest_frequency: string;
          quiet_hours_start: string;
          quiet_hours_end: string;
          timezone: string;
          categories: Json;
        }[];
      };
      update_notification_preferences: {
        Args: { p_user_id: string; p_preferences: Json };
        Returns: boolean;
      };
      get_user_subscriptions: {
        Args: { p_user_id: string };
        Returns: {
          id: string;
          subscription_type: string;
          subscription_target: string;
          frequency: string;
          is_active: boolean;
          target_name: string;
          target_metadata: Json;
        }[];
      };
      upsert_user_subscription: {
        Args: {
          p_user_id: string;
          p_subscription_type: string;
          p_subscription_target: string;
          p_frequency?: string;
          p_is_active?: boolean;
        };
        Returns: string;
      };
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
