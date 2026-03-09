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
      competition_answers: {
        Row: {
          answered_at: string
          competition_id: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          competition_id: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          competition_id?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_answers_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      daily_verses: {
        Row: {
          book: string
          chapter: number
          created_at: string
          id: string
          verse_date: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          id?: string
          verse_date: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          verse_date?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      patristic_commentaries: {
        Row: {
          commentary_text: string
          created_at: string
          id: string
          order_index: number
          saint_name: string
          saint_title: string | null
          source: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          commentary_text: string
          created_at?: string
          id?: string
          order_index?: number
          saint_name: string
          saint_title?: string | null
          source?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          commentary_text?: string
          created_at?: string
          id?: string
          order_index?: number
          saint_name?: string
          saint_title?: string | null
          source?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patristic_commentaries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          full_name: string
          id: string
          last_reading_date: string | null
          longest_streak: number
          phone: string
          topics_completed: number
          total_points: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          full_name: string
          id: string
          last_reading_date?: string | null
          longest_streak?: number
          phone: string
          topics_completed?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          full_name?: string
          id?: string
          last_reading_date?: string | null
          longest_streak?: number
          phone?: string
          topics_completed?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          competition_id: string | null
          correct_answer: string
          created_at: string
          id: string
          option_a: string
          option_b: string
          option_c: string | null
          option_d: string | null
          points: number
          question_text: string
          topic_id: string
        }
        Insert: {
          competition_id?: string | null
          correct_answer: string
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          option_c?: string | null
          option_d?: string | null
          points?: number
          question_text: string
          topic_id: string
        }
        Update: {
          competition_id?: string | null
          correct_answer?: string
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string | null
          option_d?: string | null
          points?: number
          question_text?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
          total_topics: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          title: string
          total_topics?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          total_topics?: number
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          scheduled_at: string
          sent: boolean
          sent_at: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          scheduled_at: string
          sent?: boolean
          sent_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          scheduled_at?: string
          sent?: boolean
          sent_at?: string | null
          title?: string
        }
        Relationships: []
      }
      topic_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          relationship_type: string
          source_topic_id: string
          target_topic_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          relationship_type?: string
          source_topic_id: string
          target_topic_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          relationship_type?: string
          source_topic_id?: string
          target_topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_links_source_topic_id_fkey"
            columns: ["source_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_links_target_topic_id_fkey"
            columns: ["target_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          id: string
          interpretation: string | null
          is_published: boolean
          order_index: number
          points_reward: number
          scheduled_for: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interpretation?: string | null
          is_published?: boolean
          order_index?: number
          points_reward?: number
          scheduled_for?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interpretation?: string | null
          is_published?: boolean
          order_index?: number
          points_reward?: number
          scheduled_for?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          bonus_claimed: boolean
          challenge_id: string
          completed_count: number
          id: string
          is_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_claimed?: boolean
          challenge_id: string
          completed_count?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_claimed?: boolean
          challenge_id?: string
          completed_count?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan_progress: {
        Row: {
          completed_at: string | null
          enrolled_at: string
          id: string
          is_active: boolean
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          is_active?: boolean
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string
          id: string
          points_earned: number
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_earned?: number
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_earned?: number
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verses: {
        Row: {
          book: string
          chapter: number
          created_at: string
          id: string
          order_index: number
          topic_id: string
          verse_end: number | null
          verse_start: number
          verse_text: string
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          id?: string
          order_index?: number
          topic_id: string
          verse_end?: number | null
          verse_start: number
          verse_text: string
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          order_index?: number
          topic_id?: string
          verse_end?: number | null
          verse_start?: number
          verse_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "verses_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          bonus_points: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          target_count: number
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          target_count?: number
          title: string
          week_end: string
          week_start: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          target_count?: number
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          plan_id: string
          start_date: string
          title: string
          topics_count: number
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          plan_id: string
          start_date: string
          title: string
          topics_count?: number
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          title?: string
          topics_count?: number
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
