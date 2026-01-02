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
      ai_actions: {
        Row: {
          action_type: string
          executed_at: string
          id: string
          message: string | null
          metadata: Json | null
          session_id: string
          target_latitude: number | null
          target_longitude: number | null
        }
        Insert: {
          action_type: string
          executed_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          session_id: string
          target_latitude?: number | null
          target_longitude?: number | null
        }
        Update: {
          action_type?: string
          executed_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          session_id?: string
          target_latitude?: number | null
          target_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      enemy_bases: {
        Row: {
          base_type: string
          country_id: string | null
          created_at: string
          health: number
          id: string
          is_destroyed: boolean
          is_revealed: boolean
          latitude: number
          longitude: number
          max_health: number
          name: string
          session_id: string
        }
        Insert: {
          base_type: string
          country_id?: string | null
          created_at?: string
          health?: number
          id?: string
          is_destroyed?: boolean
          is_revealed?: boolean
          latitude: number
          longitude: number
          max_health?: number
          name: string
          session_id: string
        }
        Update: {
          base_type?: string
          country_id?: string | null
          created_at?: string
          health?: number
          id?: string
          is_destroyed?: boolean
          is_revealed?: boolean
          latitude?: number
          longitude?: number
          max_health?: number
          name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enemy_bases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      enemy_units: {
        Row: {
          base_id: string | null
          created_at: string
          health: number
          id: string
          is_destroyed: boolean
          latitude: number
          longitude: number
          max_health: number
          name: string
          session_id: string
          status: string
          target_latitude: number | null
          target_longitude: number | null
          unit_type: string
        }
        Insert: {
          base_id?: string | null
          created_at?: string
          health?: number
          id?: string
          is_destroyed?: boolean
          latitude: number
          longitude: number
          max_health?: number
          name: string
          session_id: string
          status?: string
          target_latitude?: number | null
          target_longitude?: number | null
          unit_type: string
        }
        Update: {
          base_id?: string | null
          created_at?: string
          health?: number
          id?: string
          is_destroyed?: boolean
          latitude?: number
          longitude?: number
          max_health?: number
          name?: string
          session_id?: string
          status?: string
          target_latitude?: number | null
          target_longitude?: number | null
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "enemy_units_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "enemy_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemy_units_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          alert_level: string
          captured_countries: string[] | null
          created_at: string
          id: string
          is_active: boolean
          last_tick: number
          player_id: string
          resources: number
          started_at: string
          updated_at: string
        }
        Insert: {
          alert_level?: string
          captured_countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_tick?: number
          player_id: string
          resources?: number
          started_at?: string
          updated_at?: string
        }
        Update: {
          alert_level?: string
          captured_countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_tick?: number
          player_id?: string
          resources?: number
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
