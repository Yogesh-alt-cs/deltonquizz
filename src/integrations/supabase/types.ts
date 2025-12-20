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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      engineering_courses: {
        Row: {
          category_id: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "engineering_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          quality: number
          reviewed_at: string | null
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          quality: number
          reviewed_at?: string | null
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          quality?: number
          reviewed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string | null
          difficulty: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          last_reviewed_at: string | null
          next_review_at: string | null
          question: string
          repetitions: number | null
          source_quiz_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string | null
          difficulty?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          question: string
          repetitions?: number | null
          source_quiz_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string | null
          difficulty?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          question?: string
          repetitions?: number | null
          source_quiz_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_source_quiz_id_fkey"
            columns: ["source_quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      game_answers: {
        Row: {
          answer_index: number | null
          answered_at: string
          id: string
          is_correct: boolean
          player_id: string
          points_earned: number | null
          question_index: number
          room_id: string
          time_taken_ms: number | null
        }
        Insert: {
          answer_index?: number | null
          answered_at?: string
          id?: string
          is_correct: boolean
          player_id: string
          points_earned?: number | null
          question_index: number
          room_id: string
          time_taken_ms?: number | null
        }
        Update: {
          answer_index?: number | null
          answered_at?: string
          id?: string
          is_correct?: boolean
          player_id?: string
          points_earned?: number | null
          question_index?: number
          room_id?: string
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          avatar_url: string | null
          current_streak: number | null
          id: string
          is_connected: boolean | null
          is_ready: boolean | null
          joined_at: string
          last_answer_correct: boolean | null
          room_id: string
          score: number | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          current_streak?: number | null
          id?: string
          is_connected?: boolean | null
          is_ready?: boolean | null
          joined_at?: string
          last_answer_correct?: boolean | null
          room_id: string
          score?: number | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          current_streak?: number | null
          id?: string
          is_connected?: boolean | null
          is_ready?: boolean | null
          joined_at?: string
          last_answer_correct?: boolean | null
          room_id?: string
          score?: number | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string
          current_question: number | null
          ended_at: string | null
          host_id: string
          id: string
          max_players: number | null
          quiz_id: string | null
          room_code: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_question?: number | null
          ended_at?: string | null
          host_id: string
          id?: string
          max_players?: number | null
          quiz_id?: string | null
          room_code: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_question?: number | null
          ended_at?: string | null
          host_id?: string
          id?: string
          max_players?: number | null
          quiz_id?: string | null
          room_code?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          highest_streak: number | null
          id: string
          multiplayer_games: number | null
          multiplayer_wins: number | null
          theme_color: string | null
          total_quizzes_played: number | null
          total_score: number | null
          tournaments_played: number | null
          tournaments_won: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          highest_streak?: number | null
          id: string
          multiplayer_games?: number | null
          multiplayer_wins?: number | null
          theme_color?: string | null
          total_quizzes_played?: number | null
          total_score?: number | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          highest_streak?: number | null
          id?: string
          multiplayer_games?: number | null
          multiplayer_wins?: number | null
          theme_color?: string | null
          total_quizzes_played?: number | null
          total_score?: number | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string | null
          explanation: string | null
          id: string
          options: Json
          order_index: number | null
          points: number | null
          question_text: string
          quiz_id: string
          time_limit_seconds: number | null
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options: Json
          order_index?: number | null
          points?: number | null
          question_text: string
          quiz_id: string
          time_limit_seconds?: number | null
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number | null
          points?: number | null
          question_text?: string
          quiz_id?: string
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_question: number | null
          id: string
          lives_remaining: number | null
          max_streak: number | null
          quiz_id: string
          score: number | null
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_question?: number | null
          id?: string
          lives_remaining?: number | null
          max_streak?: number | null
          quiz_id: string
          score?: number | null
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_question?: number | null
          id?: string
          lives_remaining?: number | null
          max_streak?: number | null
          quiz_id?: string
          score?: number | null
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category_id: string | null
          course_id: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_public: boolean | null
          join_code: string | null
          time_limit_seconds: number | null
          title: string
          total_plays: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          join_code?: string | null
          time_limit_seconds?: number | null
          title: string
          total_plays?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          join_code?: string | null
          time_limit_seconds?: number | null
          title?: string
          total_plays?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "engineering_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          match_number: number
          player1_id: string | null
          player1_score: number | null
          player2_id: string | null
          player2_score: number | null
          round: number
          started_at: string | null
          status: string | null
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          match_number: number
          player1_id?: string | null
          player1_score?: number | null
          player2_id?: string | null
          player2_score?: number | null
          round: number
          started_at?: string | null
          status?: string | null
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          match_number?: number
          player1_id?: string | null
          player1_score?: number | null
          player2_id?: string | null
          player2_score?: number | null
          round?: number
          started_at?: string | null
          status?: string | null
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          avatar_url: string | null
          eliminated: boolean | null
          eliminated_in_round: number | null
          id: string
          joined_at: string | null
          matches_played: number | null
          matches_won: number | null
          seed: number | null
          total_score: number | null
          tournament_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          eliminated?: boolean | null
          eliminated_in_round?: number | null
          id?: string
          joined_at?: string | null
          matches_played?: number | null
          matches_won?: number | null
          seed?: number | null
          total_score?: number | null
          tournament_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          eliminated?: boolean | null
          eliminated_in_round?: number | null
          id?: string
          joined_at?: string | null
          matches_played?: number | null
          matches_won?: number | null
          seed?: number | null
          total_score?: number | null
          tournament_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_type: string | null
          category_id: string | null
          created_at: string | null
          creator_id: string
          current_round: number | null
          description: string | null
          difficulty: string | null
          ended_at: string | null
          id: string
          max_participants: number | null
          name: string
          questions_per_match: number | null
          registration_ends_at: string | null
          started_at: string | null
          status: string | null
          time_per_question: number | null
          updated_at: string | null
        }
        Insert: {
          bracket_type?: string | null
          category_id?: string | null
          created_at?: string | null
          creator_id: string
          current_round?: number | null
          description?: string | null
          difficulty?: string | null
          ended_at?: string | null
          id?: string
          max_participants?: number | null
          name: string
          questions_per_match?: number | null
          registration_ends_at?: string | null
          started_at?: string | null
          status?: string | null
          time_per_question?: number | null
          updated_at?: string | null
        }
        Update: {
          bracket_type?: string | null
          category_id?: string | null
          created_at?: string | null
          creator_id?: string
          current_round?: number | null
          description?: string | null
          difficulty?: string | null
          ended_at?: string | null
          id?: string
          max_participants?: number | null
          name?: string
          questions_per_match?: number | null
          registration_ends_at?: string | null
          started_at?: string | null
          status?: string | null
          time_per_question?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          highest_streak: number | null
          id: string | null
          rank: number | null
          total_quizzes_played: number | null
          total_score: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
