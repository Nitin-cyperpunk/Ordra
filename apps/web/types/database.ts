export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cafe_invitations: {
        Row: {
          cafe_id: string;
          created_at: string;
          email: string;
          id: string;
          invited_by: string;
          role: Database["public"]["Enums"]["cafe_role"];
          status: Database["public"]["Enums"]["cafe_invite_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          email: string;
          id?: string;
          invited_by: string;
          role: Database["public"]["Enums"]["cafe_role"];
          status?: Database["public"]["Enums"]["cafe_invite_status"];
          token?: string;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string;
          role?: Database["public"]["Enums"]["cafe_role"];
          status?: Database["public"]["Enums"]["cafe_invite_status"];
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_invitations_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      cafes: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          country: string | null;
          cover_image_url: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          opening_hours: Json;
          owner_id: string;
          phone: string | null;
          postal_code: string | null;
          slug: string;
          state: string | null;
          status: Database["public"]["Enums"]["cafe_status"];
          timezone: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          opening_hours?: Json;
          owner_id: string;
          phone?: string | null;
          postal_code?: string | null;
          slug: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["cafe_status"];
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          opening_hours?: Json;
          owner_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          slug?: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["cafe_status"];
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          cafe_id: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["cafe_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["cafe_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["cafe_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          cafe_address: string;
          cafe_name: string;
          created_at: string;
          email: string;
          id: string;
          owner_name: string;
          phone: string;
          status: Database["public"]["Enums"]["waitlist_status"];
          updated_at: string;
        };
        Insert: {
          cafe_address: string;
          cafe_name: string;
          created_at?: string;
          email: string;
          id?: string;
          owner_name: string;
          phone: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          updated_at?: string;
        };
        Update: {
          cafe_address?: string;
          cafe_name?: string;
          created_at?: string;
          email?: string;
          id?: string;
          owner_name?: string;
          phone?: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_cafe_role: {
        Args: { p_cafe_id: string };
        Returns: Database["public"]["Enums"]["cafe_role"];
      };
    };
    Enums: {
      cafe_invite_status: "pending" | "accepted" | "revoked";
      cafe_role: "owner" | "manager" | "staff";
      cafe_status: "active" | "inactive";
      waitlist_status: "pending" | "contacted" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cafe_invite_status: ["pending", "accepted", "revoked"],
      cafe_role: ["owner", "manager", "staff"],
      cafe_status: ["active", "inactive"],
      waitlist_status: ["pending", "contacted", "archived"],
    },
  },
} as const;
