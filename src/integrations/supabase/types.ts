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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ambulances: {
        Row: {
          assigned_alert_id: string | null
          code: string
          id: string
          lat: number
          lng: number
          status: string
          updated_at: string
        }
        Insert: {
          assigned_alert_id?: string | null
          code: string
          id?: string
          lat: number
          lng: number
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_alert_id?: string | null
          code?: string
          id?: string
          lat?: number
          lng?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulances_assigned_alert_id_fkey"
            columns: ["assigned_alert_id"]
            isOneToOne: false
            referencedRelation: "sos_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      missing_persons: {
        Row: {
          age: number | null
          contact: string | null
          created_at: string
          description: string | null
          id: string
          last_seen: string | null
          last_seen_lat: number | null
          last_seen_lng: number | null
          name: string
          photo_url: string | null
          reporter_id: string
          status: string | null
        }
        Insert: {
          age?: number | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_seen?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          name: string
          photo_url?: string | null
          reporter_id: string
          status?: string | null
        }
        Update: {
          age?: number | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_seen?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          name?: string
          photo_url?: string | null
          reporter_id?: string
          status?: string | null
        }
        Relationships: []
      }
      ngos: {
        Row: {
          active: boolean | null
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          donation_url: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          donation_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          donation_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          alert_id: string | null
          channel: string | null
          id: string
          message: string | null
          ngo_id: string | null
          sent_at: string
        }
        Insert: {
          alert_id?: string | null
          channel?: string | null
          id?: string
          message?: string | null
          ngo_id?: string | null
          sent_at?: string
        }
        Update: {
          alert_id?: string | null
          channel?: string | null
          id?: string
          message?: string | null
          ngo_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "sos_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_child: boolean | null
          is_disabled: boolean | null
          is_elderly: boolean | null
          is_minor: boolean | null
          is_pregnant: boolean | null
          lat: number | null
          lng: number | null
          name: string
          onboarded: boolean | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_child?: boolean | null
          is_disabled?: boolean | null
          is_elderly?: boolean | null
          is_minor?: boolean | null
          is_pregnant?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          onboarded?: boolean | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_child?: boolean | null
          is_disabled?: boolean | null
          is_elderly?: boolean | null
          is_minor?: boolean | null
          is_pregnant?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          onboarded?: boolean | null
          phone?: string | null
        }
        Relationships: []
      }
      rescues: {
        Row: {
          alert_id: string | null
          category: string
          count: number
          date: string
          id: string
        }
        Insert: {
          alert_id?: string | null
          category: string
          count?: number
          date?: string
          id?: string
        }
        Update: {
          alert_id?: string | null
          category?: string
          count?: number
          date?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rescues_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "sos_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_distributions: {
        Row: {
          created_at: string
          date: string
          id: string
          ngo_id: string | null
          quantity: number
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          ngo_id?: string | null
          quantity?: number
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          ngo_id?: string | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_distributions_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          note: string | null
          status: string
          user_id: string
          vulnerability: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          note?: string | null
          status?: string
          user_id: string
          vulnerability?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          note?: string | null
          status?: string
          user_id?: string
          vulnerability?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "ngo"
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
      app_role: ["user", "admin", "ngo"],
    },
  },
} as const
