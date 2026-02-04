export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      caerhold_locations: {
        Row: {
          canon_rules: Json
          created_at: string
          description: string | null
          hero_media_id: string | null
          id: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["caerhold_location_type"]
          updated_at: string
        }
        Insert: {
          canon_rules?: Json
          created_at?: string
          description?: string | null
          hero_media_id?: string | null
          id?: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["caerhold_location_type"]
          updated_at?: string
        }
        Update: {
          canon_rules?: Json
          created_at?: string
          description?: string | null
          hero_media_id?: string | null
          id?: string
          name?: string
          slug?: string
          type?: Database["public"]["Enums"]["caerhold_location_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hero_media"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "caerhold_media"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_media: {
        Row: {
          captured_at: string | null
          created_at: string
          id: string
          public_url: string
          storage_path: string
          thumb_url: string | null
          type: string
          upload_batch_id: string
          uploaded_by: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          id?: string
          public_url: string
          storage_path: string
          thumb_url?: string | null
          type: string
          upload_batch_id: string
          uploaded_by: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          id?: string
          public_url?: string
          storage_path?: string
          thumb_url?: string | null
          type?: string
          upload_batch_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      caerhold_media_location_tags: {
        Row: {
          created_at: string
          id: string
          location_id: string
          media_id: string
          tagged_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          media_id: string
          tagged_by: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          media_id?: string
          tagged_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "caerhold_media_location_tags_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "caerhold_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_media_location_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "caerhold_media"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_media_resident_tags: {
        Row: {
          created_at: string
          id: string
          media_id: string
          resident_id: string
          tagged_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          resident_id: string
          tagged_by: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          resident_id?: string
          tagged_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "caerhold_media_resident_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "caerhold_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_media_resident_tags_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "caerhold_residents"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_post_generation_jobs: {
        Row: {
          created_at: string
          draft_post_id: string | null
          id: string
          job_hash: string
          location_id: string | null
          resident_id: string
          status: string
          upload_batch_id: string
        }
        Insert: {
          created_at?: string
          draft_post_id?: string | null
          id?: string
          job_hash: string
          location_id?: string | null
          resident_id: string
          status?: string
          upload_batch_id: string
        }
        Update: {
          created_at?: string
          draft_post_id?: string | null
          id?: string
          job_hash?: string
          location_id?: string | null
          resident_id?: string
          status?: string
          upload_batch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caerhold_post_generation_jobs_draft_post_id_fkey"
            columns: ["draft_post_id"]
            isOneToOne: false
            referencedRelation: "caerhold_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_post_generation_jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "caerhold_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_post_generation_jobs_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "caerhold_residents"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_post_media: {
        Row: {
          media_id: string
          post_id: string
        }
        Insert: {
          media_id: string
          post_id: string
        }
        Update: {
          media_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caerhold_post_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "caerhold_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "caerhold_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_posts: {
        Row: {
          admin_notes: string | null
          ai_caption: string | null
          author_type: Database["public"]["Enums"]["caerhold_author_type"]
          caption: string | null
          created_at: string
          created_by: string
          id: string
          location_id: string | null
          published_at: string | null
          resident_id: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["caerhold_post_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          ai_caption?: string | null
          author_type: Database["public"]["Enums"]["caerhold_author_type"]
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          location_id?: string | null
          published_at?: string | null
          resident_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["caerhold_post_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          ai_caption?: string | null
          author_type?: Database["public"]["Enums"]["caerhold_author_type"]
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location_id?: string | null
          published_at?: string | null
          resident_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["caerhold_post_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caerhold_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "caerhold_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caerhold_posts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "caerhold_residents"
            referencedColumns: ["id"]
          },
        ]
      }
      caerhold_residents: {
        Row: {
          avatar_media_id: string | null
          bio: string | null
          canon_rules: Json
          created_at: string
          display_name: string
          handle: string
          id: string
          posting_enabled: boolean
          role_title: string | null
          slug: string
          tone_profile: Json
          updated_at: string
        }
        Insert: {
          avatar_media_id?: string | null
          bio?: string | null
          canon_rules?: Json
          created_at?: string
          display_name: string
          handle: string
          id?: string
          posting_enabled?: boolean
          role_title?: string | null
          slug: string
          tone_profile?: Json
          updated_at?: string
        }
        Update: {
          avatar_media_id?: string | null
          bio?: string | null
          canon_rules?: Json
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          posting_enabled?: boolean
          role_title?: string | null
          slug?: string
          tone_profile?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_avatar_media"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "caerhold_media"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_posts: {
        Row: {
          author_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_file_tags: {
        Row: {
          id: string
          media_file_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          media_file_id: string
          tag_id: string
        }
        Update: {
          id?: string
          media_file_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_file_tags_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_file_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "media_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      media_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_slug: string
          section_key: string
          section_type: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug: string
          section_key: string
          section_type?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug?: string
          section_key?: string
          section_type?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_revisions: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          post_id: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          post_id: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          post_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "journal_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "journal_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_caerhold_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      is_caerhold_admin_or_editor: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "author"
        | "caerhold_admin"
        | "caerhold_editor"
      caerhold_author_type: "resident" | "location"
      caerhold_location_type:
        | "landmark"
        | "business"
        | "residence"
        | "street"
        | "park"
      caerhold_post_status: "draft" | "approved" | "scheduled" | "published"
      post_status: "draft" | "scheduled" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "editor",
        "author",
        "caerhold_admin",
        "caerhold_editor",
      ],
      caerhold_author_type: ["resident", "location"],
      caerhold_location_type: [
        "landmark",
        "business",
        "residence",
        "street",
        "park",
      ],
      caerhold_post_status: ["draft", "approved", "scheduled", "published"],
      post_status: ["draft", "scheduled", "published", "archived"],
    },
  },
} as const
