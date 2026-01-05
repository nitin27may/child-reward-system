export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          family_id: string | null
          role: 'parent' | 'child'
          full_name: string | null
          avatar_url: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          family_id?: string | null
          role: 'parent' | 'child'
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string | null
          role?: 'parent' | 'child'
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      children: {
        Row: {
          id: string
          family_id: string
          linked_profile_id: string | null
          name: string
          email: string | null
          avatar_url: string | null
          avatar_color: string
          date_of_birth: string | null
          is_active: boolean
          can_view_dashboard: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          linked_profile_id?: string | null
          name: string
          email?: string | null
          avatar_url?: string | null
          avatar_color?: string
          date_of_birth?: string | null
          is_active?: boolean
          can_view_dashboard?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          linked_profile_id?: string | null
          name?: string
          email?: string | null
          avatar_url?: string | null
          avatar_color?: string
          date_of_birth?: string | null
          is_active?: boolean
          can_view_dashboard?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      configurations: {
        Row: {
          id: string
          family_id: string
          points_to_minutes: number
          points_to_dollars: number
          christmas_goal: number
          max_weekly_screen_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          points_to_minutes?: number
          points_to_dollars?: number
          christmas_goal?: number
          max_weekly_screen_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          points_to_minutes?: number
          points_to_dollars?: number
          christmas_goal?: number
          max_weekly_screen_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          family_id: string
          name: string
          key: string
          icon: string
          max_points: number
          order_index: number
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          key: string
          icon: string
          max_points: number
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          key?: string
          icon?: string
          max_points?: number
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bonus_presets: {
        Row: {
          id: string
          family_id: string
          label: string
          points: number
          icon: string | null
          order_index: number
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          label: string
          points: number
          icon?: string | null
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          label?: string
          points?: number
          icon?: string | null
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deduction_presets: {
        Row: {
          id: string
          family_id: string
          label: string
          points: number
          icon: string | null
          order_index: number
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          label: string
          points: number
          icon?: string | null
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          label?: string
          points?: number
          icon?: string | null
          order_index?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_tracking: {
        Row: {
          id: string
          child_id: string
          date: string
          day_of_week: string
          category_points: Json
          health_nutrition: number
          screen_discipline: number
          self_study: number
          household: number
          behavior_respect: number
          daily_bonuses: number
          daily_deductions: number
          screen_time_total: number
          christmas_fund_total: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          date: string
          day_of_week: string
          category_points?: Json
          health_nutrition?: number
          screen_discipline?: number
          self_study?: number
          household?: number
          behavior_respect?: number
          daily_bonuses?: number
          daily_deductions?: number
          screen_time_total?: number
          christmas_fund_total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          date?: string
          day_of_week?: string
          category_points?: Json
          health_nutrition?: number
          screen_discipline?: number
          self_study?: number
          household?: number
          behavior_respect?: number
          daily_bonuses?: number
          daily_deductions?: number
          screen_time_total?: number
          christmas_fund_total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bonus_events: {
        Row: {
          id: string
          daily_tracking_id: string
          type: 'bonus' | 'deduction'
          category: string
          points: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_tracking_id: string
          type: 'bonus' | 'deduction'
          category: string
          points: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_tracking_id?: string
          type?: 'bonus' | 'deduction'
          category?: string
          points?: number
          description?: string | null
          created_at?: string
        }
      }
      weekly_summaries: {
        Row: {
          id: string
          child_id: string
          year: number
          week_number: number
          week_start: string
          week_end: string
          total_screen_points: number
          total_christmas_points: number
          screen_time_earned: number
          screen_time_used: number
          christmas_fund_earned: number
          notes: string | null
          behavior_goal: string | null
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          year: number
          week_number: number
          week_start: string
          week_end: string
          total_screen_points?: number
          total_christmas_points?: number
          screen_time_earned?: number
          screen_time_used?: number
          christmas_fund_earned?: number
          notes?: string | null
          behavior_goal?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          year?: number
          week_number?: number
          week_start?: string
          week_end?: string
          total_screen_points?: number
          total_christmas_points?: number
          screen_time_earned?: number
          screen_time_used?: number
          christmas_fund_earned?: number
          notes?: string | null
          behavior_goal?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_user_family_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_parent: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      child_in_family: {
        Args: { child_uuid: string }
        Returns: boolean
      }
      initialize_family: {
        Args: { family_name: string; user_id: string }
        Returns: string
      }
    }
    Views: {
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

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
