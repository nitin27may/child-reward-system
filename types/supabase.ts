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
      bonus_events: {
        Row: {
          category: string
          created_at: string | null
          daily_tracking_id: string
          description: string | null
          id: string
          points: number
          type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          daily_tracking_id: string
          description?: string | null
          id?: string
          points: number
          type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          daily_tracking_id?: string
          description?: string | null
          id?: string
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_events_daily_tracking_id_fkey"
            columns: ["daily_tracking_id"]
            isOneToOne: false
            referencedRelation: "daily_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_presets: {
        Row: {
          created_at: string | null
          description: string | null
          family_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order_index: number | null
          points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          family_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_index?: number | null
          points: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_index?: number | null
          points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonus_presets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          family_id: string
          icon: string
          id: string
          is_active: boolean | null
          key: string
          max_points: number
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          family_id: string
          icon: string
          id?: string
          is_active?: boolean | null
          key: string
          max_points: number
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          family_id?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          key?: string
          max_points?: number
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          can_view_dashboard: boolean | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          family_id: string
          id: string
          is_active: boolean | null
          linked_profile_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          can_view_dashboard?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          family_id: string
          id?: string
          is_active?: boolean | null
          linked_profile_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          can_view_dashboard?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          family_id?: string
          id?: string
          is_active?: boolean | null
          linked_profile_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations: {
        Row: {
          christmas_goal: number | null
          created_at: string | null
          family_id: string
          id: string
          max_weekly_screen_time: number | null
          points_to_dollars: number | null
          points_to_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          christmas_goal?: number | null
          created_at?: string | null
          family_id: string
          id?: string
          max_weekly_screen_time?: number | null
          points_to_dollars?: number | null
          points_to_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          christmas_goal?: number | null
          created_at?: string | null
          family_id?: string
          id?: string
          max_weekly_screen_time?: number | null
          points_to_dollars?: number | null
          points_to_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configurations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tracking: {
        Row: {
          behavior_respect: number | null
          category_points: Json | null
          child_id: string
          christmas_fund_total: number | null
          created_at: string | null
          daily_bonuses: number | null
          daily_deductions: number | null
          date: string
          day_of_week: string
          health_nutrition: number | null
          household: number | null
          id: string
          notes: string | null
          screen_discipline: number | null
          screen_time_total: number | null
          screen_time_used: number | null
          self_study: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          behavior_respect?: number | null
          category_points?: Json | null
          child_id: string
          christmas_fund_total?: number | null
          created_at?: string | null
          daily_bonuses?: number | null
          daily_deductions?: number | null
          date: string
          day_of_week: string
          health_nutrition?: number | null
          household?: number | null
          id?: string
          notes?: string | null
          screen_discipline?: number | null
          screen_time_total?: number | null
          screen_time_used?: number | null
          self_study?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          behavior_respect?: number | null
          category_points?: Json | null
          child_id?: string
          christmas_fund_total?: number | null
          created_at?: string | null
          daily_bonuses?: number | null
          daily_deductions?: number | null
          date?: string
          day_of_week?: string
          health_nutrition?: number | null
          household?: number | null
          id?: string
          notes?: string | null
          screen_discipline?: number | null
          screen_time_total?: number | null
          screen_time_used?: number | null
          self_study?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tracking_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      deduction_presets: {
        Row: {
          created_at: string | null
          description: string | null
          family_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order_index: number | null
          points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          family_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_index?: number | null
          points: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_index?: number | null
          points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deduction_presets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          family_id: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_summaries: {
        Row: {
          allowance_earned: number | null
          behavior_goal: string | null
          child_id: string
          christmas_fund_earned: number | null
          created_at: string | null
          days_tracked: number | null
          id: string
          is_finalized: boolean | null
          is_paid: boolean | null
          notes: string | null
          screen_time_earned: number | null
          screen_time_used: number | null
          total_christmas_points: number | null
          total_points: number | null
          total_screen_points: number | null
          updated_at: string | null
          week_end: string
          week_number: number
          week_start: string
          year: number
        }
        Insert: {
          allowance_earned?: number | null
          behavior_goal?: string | null
          child_id: string
          christmas_fund_earned?: number | null
          created_at?: string | null
          days_tracked?: number | null
          id?: string
          is_finalized?: boolean | null
          is_paid?: boolean | null
          notes?: string | null
          screen_time_earned?: number | null
          screen_time_used?: number | null
          total_christmas_points?: number | null
          total_points?: number | null
          total_screen_points?: number | null
          updated_at?: string | null
          week_end: string
          week_number: number
          week_start: string
          year: number
        }
        Update: {
          allowance_earned?: number | null
          behavior_goal?: string | null
          child_id?: string
          christmas_fund_earned?: number | null
          created_at?: string | null
          days_tracked?: number | null
          id?: string
          is_finalized?: boolean | null
          is_paid?: boolean | null
          notes?: string | null
          screen_time_earned?: number | null
          screen_time_used?: number | null
          total_christmas_points?: number | null
          total_points?: number | null
          total_screen_points?: number | null
          updated_at?: string | null
          week_end?: string
          week_number?: number
          week_start?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_summaries_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_total_points: {
        Args: {
          tracking_record: Database["public"]["Tables"]["daily_tracking"]["Row"]
        }
        Returns: number
      }
      child_in_family: { Args: { child_uuid: string }; Returns: boolean }
      get_iso_week_number: { Args: { input_date: string }; Returns: number }
      get_user_family_id: { Args: never; Returns: string }
      get_weekly_summary: {
        Args: { p_child_id: string; p_week_end: string; p_week_start: string }
        Returns: {
          allowance_earned: number
          daily_breakdown: Json
          days_tracked: number
          screen_time_earned: number
          total_points: number
        }[]
      }
      initialize_family: {
        Args: { family_name: string; user_id: string }
        Returns: string
      }
      is_parent: { Args: never; Returns: boolean }
      upsert_weekly_summary: {
        Args: { p_child_id: string; p_week_end: string; p_week_start: string }
        Returns: undefined
      }
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

export type Family = Tables<'families'>
export type Profile = Tables<'profiles'>
export type Child = Tables<'children'>
export type Configuration = Tables<'configurations'>
export type Category = Tables<'categories'>
export type BonusPreset = Tables<'bonus_presets'>
export type DeductionPreset = Tables<'deduction_presets'>
export type DailyTracking = Tables<'daily_tracking'>
export type BonusEvent = Tables<'bonus_events'>
export type WeeklySummary = Tables<'weekly_summaries'>

/** Kept for callers written against the previous hand-written types. */
export type InsertTables<T extends keyof Database['public']['Tables']> = TablesInsert<T>
export type UpdateTables<T extends keyof Database['public']['Tables']> = TablesUpdate<T>
